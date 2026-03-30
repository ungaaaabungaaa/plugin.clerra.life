import type { CacheDescriptor } from './types';

export function buildCacheKey({ tabId, pageUrl, contentHash, mode }: CacheDescriptor): string {
  return ['clerra', String(tabId), pageUrl, contentHash, mode].join('::');
}
