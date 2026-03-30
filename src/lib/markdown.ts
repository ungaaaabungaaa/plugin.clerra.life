const SAFE_URL_PATTERN = /^https?:\/\//i;

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderInline(source: string): string {
  let rendered = escapeHtml(source);

  rendered = rendered.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_match, label: string, url: string) => {
    if (!SAFE_URL_PATTERN.test(url)) {
      return escapeHtml(label);
    }

    return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
  });

  rendered = rendered.replace(/`([^`]+)`/g, '<code>$1</code>');
  rendered = rendered.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  rendered = rendered.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  return rendered;
}

function wrapParagraph(lines: string[]): string {
  return `<p>${renderInline(lines.join(' '))}</p>`;
}

export function renderMarkdown(source: string): string {
  const normalized = source.replace(/\r\n/g, '\n').trim();

  if (!normalized) {
    return '<p>No content returned.</p>';
  }

  const lines = normalized.split('\n');
  const blocks: string[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let orderedItems: string[] = [];
  let quoteLines: string[] = [];
  let codeLines: string[] = [];
  let inCodeFence = false;

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push(wrapParagraph(paragraph));
      paragraph = [];
    }
  };

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push(`<ul>${listItems.map((item) => `<li>${renderInline(item)}</li>`).join('')}</ul>`);
      listItems = [];
    }
  };

  const flushOrdered = () => {
    if (orderedItems.length > 0) {
      blocks.push(`<ol>${orderedItems.map((item) => `<li>${renderInline(item)}</li>`).join('')}</ol>`);
      orderedItems = [];
    }
  };

  const flushQuote = () => {
    if (quoteLines.length > 0) {
      blocks.push(`<blockquote>${quoteLines.map((line) => `<p>${renderInline(line)}</p>`).join('')}</blockquote>`);
      quoteLines = [];
    }
  };

  const flushCode = () => {
    if (codeLines.length > 0) {
      blocks.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
      codeLines = [];
    }
  };

  const flushAll = () => {
    flushParagraph();
    flushList();
    flushOrdered();
    flushQuote();
  };

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      if (inCodeFence) {
        flushCode();
      } else {
        flushAll();
      }
      inCodeFence = !inCodeFence;
      continue;
    }

    if (inCodeFence) {
      codeLines.push(line);
      continue;
    }

    if (line.trim().length === 0) {
      flushAll();
      continue;
    }

    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);

    if (headingMatch) {
      flushAll();
      const level = Math.min(headingMatch[1].length, 4);
      blocks.push(`<h${level}>${renderInline(headingMatch[2])}</h${level}>`);
      continue;
    }

    const quoteMatch = line.match(/^>\s?(.*)$/);

    if (quoteMatch) {
      flushParagraph();
      flushList();
      flushOrdered();
      quoteLines.push(quoteMatch[1]);
      continue;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);

    if (orderedMatch) {
      flushParagraph();
      flushList();
      flushQuote();
      orderedItems.push(orderedMatch[1]);
      continue;
    }

    const bulletMatch = line.match(/^[-*]\s+(.+)$/);

    if (bulletMatch) {
      flushParagraph();
      flushOrdered();
      flushQuote();
      listItems.push(bulletMatch[1]);
      continue;
    }

    paragraph.push(line.trim());
  }

  if (inCodeFence) {
    flushCode();
  }

  flushAll();

  return blocks.join('');
}
