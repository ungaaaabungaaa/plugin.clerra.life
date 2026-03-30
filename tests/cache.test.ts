import { describe, expect, it } from 'vitest';
import { buildCacheKey } from '../src/lib/cache';

describe('cache key generation', () => {
  it('includes tab, url, content hash, and mode', () => {
    expect(buildCacheKey({ tabId: 12, pageUrl: 'https://example.com/a', contentHash: 'abc123', mode: 'simplify' }))
      .toBe('clerra::12::https://example.com/a::abc123::simplify');
  });

  it('changes when the mode changes', () => {
    const simplifyKey = buildCacheKey({ tabId: 12, pageUrl: 'https://example.com/a', contentHash: 'abc123', mode: 'simplify' });
    const deepKey = buildCacheKey({ tabId: 12, pageUrl: 'https://example.com/a', contentHash: 'abc123', mode: 'deep' });

    expect(simplifyKey).not.toBe(deepKey);
  });
});
