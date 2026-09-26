import { apiClient } from './client';

export async function getSupportedLanguages() {
  return await apiClient<{ success: boolean; provider: string; languages: any[] }>('/language/languages');
}

export async function translateText(text: string, targetLang: string) {
  return await apiClient<{ success: boolean; translatedText: string }>('/language/translate', {
    method: 'POST',
    body: JSON.stringify({ text, targetLang }),
  });
}

export async function requestSTT(audioBase64: string, language: string = 'hi', promptHint: string = '') {
  return await apiClient<{ success: boolean; transcript: string; isDemo: boolean }>('/language/stt', {
    method: 'POST',
    body: JSON.stringify({ audioBase64, language, promptHint }),
  });
}

export async function requestTTS(text: string, language: string = 'hi') {
  return await apiClient<{ success: boolean; audioBase64: string; isDemo: boolean }>('/language/tts', {
    method: 'POST',
    body: JSON.stringify({ text, language }),
  });
}

export async function synthesizeTTS(text: string, language: string = 'en') {
  return await apiClient<{
    success: boolean;
    audioBase64: string;
    audio?: string;
    format: string;
    mimeType?: string;
    language: string;
    model: string;
    provider?: string;
    isFallback: boolean;
    durationMs: number;
  }>('/tts/synthesize', {
    method: 'POST',
    body: JSON.stringify({ text, language }),
  });
}
