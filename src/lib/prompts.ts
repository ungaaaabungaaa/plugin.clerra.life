import type { PageExtraction, ProcessingMode } from './types';

export const GEMINI_MODEL = 'gemini-2.0-flash';

export function buildPrompt(mode: ProcessingMode, page: PageExtraction): string {
  const sharedInstructions = [
    'You are Clerra, a reading-layer assistant.',
    'Only use the source page content provided below.',
    'Do not invent citations, browsing results, or external facts.',
    'Return clean markdown only.',
    'Use short headings, concise paragraphs, bullets, and blockquotes when helpful.',
    'Do not wrap the answer in code fences.',
    '',
    `Page title: ${page.title}`,
    `Page url: ${page.url}`,
    `Extraction strategy: ${page.strategy}`,
    `Page excerpt: ${page.excerpt || 'N/A'}`,
    '',
    'Source text:',
    page.text
  ];

  if (mode === 'simplify') {
    return [
      'Simplify this page for a smart but busy reader.',
      'Reduce jargon, shorten sentences, and remove repetition.',
      'Preserve the core meaning.',
      'Use sections titled: Quick Take, Key Points, and What Matters.'
    ].concat(sharedInstructions).join('\n');
  }

  return [
    'Deepen this page for a curious reader.',
    'Add clarifying definitions, context, implications, and concrete examples only when they can be reasonably inferred from the page.',
    'Do not pretend you researched the web.',
    'Use sections titled: Core Idea, Expanded Context, Why It Matters, and Questions To Think About.'
  ].concat(sharedInstructions).join('\n');
}
