export type ProcessingMode = 'simplify' | 'deep';
export type TransformMode = ProcessingMode | 'original';
export type ExtractionStrategy = 'readability' | 'main' | 'body';

export interface ClerraSettings {
  geminiApiKey: string;
  themeId: string;
  accentId: string;
  nightMode: boolean;
  playlistUrl: string;
  musicEnabled: boolean;
}

export interface PageExtraction {
  title: string;
  url: string;
  text: string;
  excerpt: string;
  strategy: ExtractionStrategy;
  charCount: number;
  hash: string;
}

export interface ProcessedContent {
  markdown: string;
  mode: ProcessingMode;
  cacheHit: boolean;
  model: string;
}

export interface CacheDescriptor {
  tabId: number;
  pageUrl: string;
  contentHash: string;
  mode: ProcessingMode;
}
