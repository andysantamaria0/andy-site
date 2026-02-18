import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

const FIELD_LABELS = {
  elevator_pitch: 'What is the one sentence you\'d use to describe Stand to a parent?',
  success_6mo: 'What does success look like 6 months from now?',
  success_12mo: 'And 12 months from now?',
  primary_user: 'Who is the primary user?',
  age_range: 'What age range are you targeting?',
  first_win: 'What does a kid\'s "first win" look like in the app?',
  built_today: 'What do you have built today?',
  working_not_working: 'What\'s working well in the current prototype? What isn\'t?',
  real_money: 'For the pilot, will kids be handling real money? Or will transactions be simulated at first?',
  personality_words: 'How would you describe Stand\'s personality in 3 words?',
  design_admire: 'Are there apps or products you admire for their design?',
  mobile_desktop: 'How important is mobile vs desktop for your users?',
  timeline: 'What\'s your ideal timeline for having something live that users can touch?',
};

function buildFreeformPrompt(formState) {
  const fieldSummary = Object.entries(formState)
    .map(([key, value]) => `- ${key}: ${value ? `"${value}"` : '(empty)'}`)
    .join('\n');

  return `You are an intake form assistant. Lauren is answering questions about her project "Stand." Your ONLY job is to take what she says, map it to the right form field(s), confirm what you updated, and move on.

Rules:
- DO NOT give opinions, analysis, advice, or commentary on her answers
- DO NOT ask follow-up questions or probe deeper
- DO NOT editorialize ("Whoa!", "Great answer!", "That's interesting!")
- Keep responses to 1 sentence: confirm what you captured, nothing more
- Example good response: "Got it — updated the timeline."
- Example bad response: "Whoa, that's ambitious! So you're thinking Series A in 6 months, which means..."
- If her message clearly maps to a field, update it and confirm
- If it's ambiguous which field she means, ask briefly which field she's updating
- If she asks you a question, answer it briefly, then move on

Current form fields:

${fieldSummary}

CRITICAL: When your response should update any form fields, end your message with a field update block in exactly this format:
<FIELD_UPDATES>{"field_id":"new value","another_field":"another value"}</FIELD_UPDATES>

Only include fields that should actually change. Do NOT include the block if nothing should change.

Field IDs: elevator_pitch, success_6mo, success_12mo, primary_user (must be one of: "The parent", "The kid", "Both equally"), age_range, first_win, built_today, working_not_working, real_money, personality_words, design_admire, mobile_desktop (must be one of: "Mobile-first", "Desktop-first", "Equal priority"), timeline`;
}

function buildGuidedPrompt(formState, currentFieldId) {
  const fieldSummary = Object.entries(formState)
    .map(([key, value]) => `- ${key}: ${value ? `"${value}"` : '(empty)'}`)
    .join('\n');

  // All questions answered — wrap up and ask to submit
  if (!currentFieldId) {
    return `You just finished walking Lauren through every question in her Stand intake questionnaire. All fields are filled in.

Rules:
- Tell her you're all done — keep it to one warm sentence.
- Ask if she's ready to send it to Andy.
- When she confirms (yes, send it, looks good, go ahead, etc.), respond with a brief confirmation and include <SUBMIT/> at the end.
- If she wants to change something, help her — use <FIELD_UPDATES> as usual.
- DO NOT give opinions or commentary on her answers.

Current form fields:

${fieldSummary}

CRITICAL: When she confirms submission, end your message with <SUBMIT/>. When updating fields, use:
<FIELD_UPDATES>{"field_id":"new value"}</FIELD_UPDATES>

Field IDs: elevator_pitch, success_6mo, success_12mo, primary_user, age_range, first_win, built_today, working_not_working, real_money, personality_words, design_admire, mobile_desktop, timeline`;
  }

  const label = FIELD_LABELS[currentFieldId] || currentFieldId;
  const currentValue = formState[currentFieldId];

  return `You are walking Lauren through her Stand intake questionnaire one question at a time. You're warm and conversational — like a friendly colleague, not a robot.

The current question is: "${label}" (field: ${currentFieldId})
${currentValue ? `Current answer: "${currentValue}"` : 'This field is currently empty.'}

Rules:
- Ask this ONE question conversationally. Don't read it verbatim — rephrase naturally.
- Keep it short — one or two sentences max.
- When she answers, confirm briefly (one short sentence) and include <NEXT_FIELD/> at the very end of your message to signal we should move to the next question.
- If the field already has a value, mention it briefly and ask if she wants to keep it or change it.
- DO NOT give opinions, analysis, or commentary on her answers.
- DO NOT ask follow-up questions beyond the current field.
- If she says something like "keep it" or "that's fine," accept the current value and move on with <NEXT_FIELD/>.
${currentFieldId === 'primary_user' ? '- Options are: "The parent", "The kid", or "Both equally".' : ''}
${currentFieldId === 'mobile_desktop' ? '- Options are: "Mobile-first", "Desktop-first", or "Equal priority".' : ''}

Current form fields:

${fieldSummary}

CRITICAL: When your response should update any form fields, end your message with a field update block in exactly this format:
<FIELD_UPDATES>{"field_id":"new value"}</FIELD_UPDATES>

Only include the block if a field value should change. After confirming her answer, always end with <NEXT_FIELD/> (after the FIELD_UPDATES block if present).

Field IDs: elevator_pitch, success_6mo, success_12mo, primary_user, age_range, first_win, built_today, working_not_working, real_money, personality_words, design_admire, mobile_desktop, timeline`;
}

export async function POST(request) {
  try {
    const { message, history, formState, mode, currentFieldId } = await request.json();

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = mode === 'guided'
      ? buildGuidedPrompt(formState || {}, currentFieldId)
      : buildFreeformPrompt(formState || {});

    const messages = [
      ...(history || []),
      { role: 'user', content: message },
    ];

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    return new Response(stream.toReadableStream(), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Intake chat error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process message' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
