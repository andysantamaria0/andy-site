// ============================================================
// THE BREAKUP — Main App (Server-proxied API calls)
// ============================================================

const state = {
  running: false,
  paused: false,
  conversationHistory: [],
};

const characterAEl = document.getElementById('character-a');
const characterBEl = document.getElementById('character-b');
const statusEl = document.getElementById('status');
const nameAEl = document.getElementById('name-a');
const nameBEl = document.getElementById('name-b');

// ----- Audio Engine with Analyser -----

let audioContext = null;
let analyserNode = null;
let gainNode = null;
let frequencyData = null;
let timeDomainData = null;
let currentSpeakingOrb = null;

function initAudio() {
  if (audioContext) return;
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyserNode = audioContext.createAnalyser();
  analyserNode.fftSize = 256;
  analyserNode.smoothingTimeConstant = 0.7;
  frequencyData = new Uint8Array(analyserNode.frequencyBinCount);
  timeDomainData = new Uint8Array(analyserNode.fftSize);
  gainNode = audioContext.createGain();
  gainNode.gain.value = 1.0;
  gainNode.connect(analyserNode);
  analyserNode.connect(audioContext.destination);
  analyzeAudio();
}

function analyzeAudio() {
  if (!analyserNode || !currentSpeakingOrb) {
    requestAnimationFrame(analyzeAudio);
    return;
  }
  analyserNode.getByteFrequencyData(frequencyData);
  analyserNode.getByteTimeDomainData(timeDomainData);

  let sum = 0;
  for (let i = 0; i < frequencyData.length; i++) sum += frequencyData[i] * frequencyData[i];
  const volume = Math.sqrt(sum / frequencyData.length) / 255;

  let bassSum = 0;
  const bassEnd = Math.floor(frequencyData.length * 0.15);
  for (let i = 0; i < bassEnd; i++) bassSum += frequencyData[i];
  const bass = bassSum / (bassEnd * 255);

  let midSum = 0;
  const midStart = Math.floor(frequencyData.length * 0.15);
  const midEnd = Math.floor(frequencyData.length * 0.5);
  for (let i = midStart; i < midEnd; i++) midSum += frequencyData[i];
  const mid = midSum / ((midEnd - midStart) * 255);

  let highSum = 0;
  const highStart = Math.floor(frequencyData.length * 0.5);
  for (let i = highStart; i < frequencyData.length; i++) highSum += frequencyData[i];
  const high = highSum / ((frequencyData.length - highStart) * 255);

  let diffSum = 0;
  for (let i = 1; i < timeDomainData.length; i++) diffSum += Math.abs(timeDomainData[i] - timeDomainData[i - 1]);
  const spikiness = diffSum / ((timeDomainData.length - 1) * 128);

  currentSpeakingOrb.setAudioData({ volume, bass, mid, high, spikiness });
  requestAnimationFrame(analyzeAudio);
}

// ----- Dialogue Generation (via server proxy) -----

async function generateDialogue(character, { wrapUp = false } = {}) {
  const charConfig = CONFIG.characters[character];
  const otherChar = character === 'a' ? 'b' : 'a';
  const otherName = CONFIG.characters[otherChar].name;

  const messages = state.conversationHistory.map((entry) => ({
    role: entry.role === character ? 'assistant' : 'user',
    content: entry.role === character
      ? entry.content
      : `[${CONFIG.characters[entry.role].name}]: ${entry.content}`,
  }));

  if (messages.length === 0) {
    messages.push({
      role: 'user',
      content: `[Start the conversation. You're with ${otherName}. Something has been on your mind.]`,
    });
  }

  let system = `${CONFIG.sharedContext}\n\n${charConfig.systemPrompt}\n\nYou are speaking with ${otherName}. Respond in character. Do not include your name as a prefix — just speak naturally. Do NOT include stage directions, action descriptions, or asterisk notations like *pauses* or *sighs*. Only output the words you would actually say out loud.`;

  if (wrapUp) {
    system += `\n\nIMPORTANT: This conversation is ending NOW. Say your final words. This is the last thing you will say to this person — make it count. Be definitive. The breakup is final. One sentence, maybe two. Then it's over.`;
  }

  const response = await fetch('/api/breakup/dialogue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, messages }),
  });

  if (!response.ok) {
    if (response.status === 529) {
      await new Promise(r => setTimeout(r, 2000));
      return generateDialogue(character, { wrapUp });
    }
    const err = await response.text();
    throw new Error(`Dialogue error: ${response.status} — ${err}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// ----- Strip stage directions -----

function stripStageDirections(text) {
  text = text.replace(/\*[^*]+\*/g, '');
  text = text.replace(/\[[^\]]*\]/g, '');
  text = text.replace(/\s{2,}/g, ' ').trim();
  return text;
}

// ----- TTS (via server proxy) -----

async function speakText(text, character) {
  initAudio();

  const spokenText = stripStageDirections(text);
  if (!spokenText) return;

  const response = await fetch('/api/breakup/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: spokenText,
      voiceId: CONFIG.characters[character].voiceId,
      modelId: CONFIG.tts.modelId,
      voiceSettings: {
        stability: CONFIG.tts.stability,
        similarity_boost: CONFIG.tts.similarityBoost,
        style: CONFIG.tts.style,
        speed: CONFIG.characters[character].speed || 1.0,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`TTS error: ${response.status} — ${err}`);
  }

  const audioBlob = await response.blob();
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  return new Promise((resolve) => {
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(gainNode);
    source.onended = resolve;
    source.start();
  });
}

// ----- Init -----

function init() {
  nameAEl.textContent = CONFIG.characters.a.name;
  nameBEl.textContent = CONFIG.characters.b.name;

  characterAEl.classList.add('active');
  characterBEl.classList.add('active');

  characterAEl.addEventListener('click', () => startConversation('a'));
  characterBEl.addEventListener('click', () => startConversation('b'));

  document.getElementById('pause-btn').addEventListener('click', togglePause);
}

// ----- Pause -----

function togglePause() {
  state.paused = !state.paused;
  const btn = document.getElementById('pause-btn');
  btn.textContent = state.paused ? 'Resume' : 'Pause';
  if (state.paused) statusEl.textContent = 'Paused.';
}

function waitWhilePaused() {
  return new Promise((resolve) => {
    const check = () => { if (!state.paused) resolve(); else setTimeout(check, 200); };
    check();
  });
}

// ----- Start Conversation -----

async function startConversation(firstCharacter) {
  if (state.running) return;
  state.running = true;

  characterAEl.style.cursor = 'default';
  characterBEl.style.cursor = 'default';

  document.getElementById('pause-btn').classList.remove('hidden');

  let currentCharacter = firstCharacter;
  const maxTurns = 30;
  const conversationDurationMs = 3 * 60 * 1000;
  const startTime = Date.now();
  let prefetchedText = null;
  let prefetchedCharacter = null;

  for (let turn = 0; turn < maxTurns; turn++) {
    await waitWhilePaused();

    const elapsed = Date.now() - startTime;
    const timeLeft = conversationDurationMs - elapsed;
    const isLastTurn = timeLeft <= 20000;

    const otherCharacter = currentCharacter === 'a' ? 'b' : 'a';
    const charEl = currentCharacter === 'a' ? characterAEl : characterBEl;
    const otherEl = currentCharacter === 'a' ? characterBEl : characterAEl;
    const orb = currentCharacter === 'a' ? orbA : orbB;

    charEl.classList.add('speaking');
    otherEl.classList.add('disabled');

    if (timeLeft <= 0) break;

    try {
      let text;
      if (isLastTurn) {
        prefetchedText = null;
        text = await generateDialogue(currentCharacter, { wrapUp: true });
      } else if (prefetchedText && prefetchedCharacter === currentCharacter) {
        text = prefetchedText;
        prefetchedText = null;
        prefetchedCharacter = null;
      } else {
        text = await generateDialogue(currentCharacter);
      }

      console.log(`[${CONFIG.characters[currentCharacter].name}]:`, text);
      state.conversationHistory.push({ role: currentCharacter, content: text });

      orb.setSpeaking(true);
      currentSpeakingOrb = orb;

      if (isLastTurn) {
        await speakText(text, currentCharacter);
        charEl.classList.remove('speaking');
        otherEl.classList.remove('disabled');
        orb.setSpeaking(false);
        currentSpeakingOrb = null;
        break;
      }

      const speakPromise = speakText(text, currentCharacter);
      const prefetchPromise = generateDialogue(otherCharacter).catch(err => {
        console.warn('Prefetch failed:', err);
        return null;
      });

      await speakPromise;

      prefetchedText = await prefetchPromise;
      prefetchedCharacter = otherCharacter;

      await new Promise(r => setTimeout(r, 300));

    } catch (err) {
      console.error('Error:', err);
      statusEl.textContent = `Error: ${err.message}`;
      break;
    } finally {
      charEl.classList.remove('speaking');
      otherEl.classList.remove('disabled');
      orb.setSpeaking(false);
      currentSpeakingOrb = null;
    }

    currentCharacter = otherCharacter;
  }

  statusEl.textContent = '';
  state.running = false;
}

init();
