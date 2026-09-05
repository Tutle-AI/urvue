import { createRequire } from 'node:module';
import OpenAI from 'openai';
import ts from 'typescript';
import { readFile } from 'node:fs/promises';

const require = createRequire(import.meta.url);
const { loadEnvConfig } = createRequire(require.resolve('next/package.json'))('@next/env');
loadEnvConfig(process.cwd());
const source = await readFile('src/lib/interview.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { interviewSystemPrompt, finalReply } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const model = process.env.OPENAI_FEEDBACK_MODEL || 'gpt-5.6-luna';
const cases = [
  { name: 'Listen and explore an unanswered goal', history: [['assistant', 'How was your experience with the website?'], ['user', 'I found pricing easily and it was clear. The contact form lost everything I typed when I hit submit.']], close: false },
  { name: 'Out-of-scope support question', history: [['assistant', 'What stood out about the website?'], ['user', 'Can you refund my order? What is your refund policy?']], close: false },
  { name: 'Respect an immediate stop', history: [['assistant', 'How was your experience?'], ['user', 'I do not want to answer questions. Please stop.']], close: true },
  { name: 'Close after the final invitation', history: [['assistant', 'How was the website?'], ['user', 'Pricing was clear, and the contact form worked well.'], ['assistant', 'Is there anything else you would like the team to know?'], ['user', 'No, that is everything.']], close: true },
];
for (const scenario of cases) {
  const started = Date.now();
  try {
    const response = await client.responses.create({
      model, store: false, max_output_tokens: 500,
      ...(model.startsWith('gpt-5.6') ? { reasoning: { effort: 'none' } } : {}),
      input: [
        { role: 'system', content: interviewSystemPrompt('AMANDA') },
        { role: 'system', content: 'Feedback point: Sample website. Goals: understand pricing clarity and contact form usability. No policies or contact details supplied.' },
        ...scenario.history.map(([role, content]) => ({ role, content })),
      ],
      text: { format: { type: 'json_schema', name: 'feedback_reply', strict: true, schema: { type: 'object', additionalProperties: false, required: ['reply', 'finalize'], properties: { reply: { type: 'string' }, finalize: { type: 'boolean' } } } } },
    });
    const payload = JSON.parse(response.output_text);
    const passed = payload.finalize === scenario.close && Boolean(payload.reply?.trim());
    console.log(JSON.stringify({ scenario: scenario.name, model, passed, milliseconds: Date.now() - started, ...payload, displayedReply: payload.finalize ? finalReply(payload.reply) : payload.reply }));
    if (!passed) process.exitCode = 1;
  } catch (error) {
    console.error(JSON.stringify({ scenario: scenario.name, model, error: error.message, status: error.status }));
    process.exitCode = 1;
    break;
  }
}
