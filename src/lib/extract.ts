import { Readability } from '@mozilla/readability';
import { hashString } from './hash';
import type { ExtractionStrategy, PageExtraction } from './types';

const READABILITY_MIN_LENGTH = 420;
const FALLBACK_MIN_LENGTH = 220;
const CANDIDATE_SELECTORS = ['article', 'main', '[role="main"]', '[data-testid*="content"]', '[class*="content"]', '[class*="article"]'];
const STRIP_SELECTORS = ['script', 'style', 'noscript', 'svg', 'canvas', 'iframe', 'header', 'footer', 'nav', 'aside', '[role="complementary"]', '[aria-hidden="true"]'];

function cleanupDocument(doc: Document): void {
  STRIP_SELECTORS.forEach((selector) => {
    doc.querySelectorAll(selector).forEach((node) => node.remove());
  });
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function buildExtraction(strategy: ExtractionStrategy, title: string, url: string, text: string, excerpt: string): PageExtraction {
  const normalizedText = normalizeText(text);

  return {
    title: normalizeText(title) || 'Untitled page',
    url,
    text: normalizedText,
    excerpt: normalizeText(excerpt),
    strategy,
    charCount: normalizedText.length,
    hash: hashString([title, url, normalizedText].join('::'))
  };
}

function extractFromReadability(html: string, url: string, title: string): PageExtraction | null {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    cleanupDocument(doc);
    const article = new Readability(doc).parse();
    const text = normalizeText(article?.textContent ?? '');

    if (text.length < READABILITY_MIN_LENGTH) {
      return null;
    }

    return buildExtraction('readability', article?.title ?? title, url, text, article?.excerpt ?? text.slice(0, 200));
  } catch {
    return null;
  }
}

function extractFromCandidates(doc: Document, url: string, title: string): PageExtraction | null {
  let bestText = '';

  for (const selector of CANDIDATE_SELECTORS) {
    doc.querySelectorAll<HTMLElement>(selector).forEach((node) => {
      const candidateText = normalizeText(node.innerText || node.textContent || '');

      if (candidateText.length > bestText.length) {
        bestText = candidateText;
      }
    });
  }

  if (bestText.length < FALLBACK_MIN_LENGTH) {
    return null;
  }

  return buildExtraction('main', title, url, bestText, bestText.slice(0, 200));
}

function extractFromBody(doc: Document, url: string, title: string): PageExtraction {
  const bodyText = normalizeText(doc.body?.innerText || doc.body?.textContent || '');
  return buildExtraction('body', title, url, bodyText, bodyText.slice(0, 200));
}

export function extractPageContent(doc: Document = document): PageExtraction {
  const title = doc.title || 'Untitled page';
  const url = doc.location?.href ?? window.location.href;
  const html = doc.documentElement.outerHTML;

  const readabilityResult = extractFromReadability(html, url, title);

  if (readabilityResult) {
    return readabilityResult;
  }

  const candidateResult = extractFromCandidates(doc, url, title);

  if (candidateResult) {
    return candidateResult;
  }

  return extractFromBody(doc, url, title);
}
