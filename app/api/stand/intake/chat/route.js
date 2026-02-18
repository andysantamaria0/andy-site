import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

function buildSystemPrompt(formState) {
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

Field IDs: elevator_pitch, success_6mo, success_12mo, primary_user (must be one of: "The parent", "The kid", "Both equally"), age_range, first_win, built_today, technical_decisions, working_not_working, revenue_model, real_money, personality_words, design_admire, brand_guidelines, mobile_desktop (must be one of: "Mobile-first", "Desktop-first", "Equal priority"), timeline`;
}

export async function POST(request) {
  try {
    const { message, history, formState } = await request.json();

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const messages = [
      ...(history || []),
      { role: 'user', content: message },
    ];

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: buildSystemPrompt(formState || {}),
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
