import type { ClerraSettings, PageExtraction, ProcessedContent, ProcessingMode } from './types';

export interface ToggleOverlayMessage {
  type: 'clerra/toggleOverlay';
  payload?: {
    forceOpen?: boolean;
  };
}

export interface ProcessModeMessage {
  type: 'clerra/processMode';
  payload: {
    mode: ProcessingMode;
    page: PageExtraction;
  };
}

export interface UpdateSettingsMessage {
  type: 'clerra/updateSettings';
  payload: Partial<ClerraSettings>;
}

export interface ToggleMusicMessage {
  type: 'clerra/toggleMusic';
  payload: {
    enabled?: boolean;
    openExternal?: boolean;
    playlistUrl?: string;
  };
}

export type ClerraMessage = ToggleOverlayMessage | ProcessModeMessage | UpdateSettingsMessage | ToggleMusicMessage;

export interface SuccessResponse<T> {
  ok: true;
  data: T;
}

export interface ErrorResponse {
  ok: false;
  error: string;
}

export type RuntimeResponse<T> = SuccessResponse<T> | ErrorResponse;

export interface ToggleOverlayResponse {
  visible: boolean;
}

export interface ProcessModeResponse extends ProcessedContent {}

export interface UpdateSettingsResponse {
  settings: ClerraSettings;
}

export interface ToggleMusicResponse {
  musicEnabled: boolean;
}

export function isRuntimeError<T>(response: RuntimeResponse<T>): response is ErrorResponse {
  return response.ok === false;
}
