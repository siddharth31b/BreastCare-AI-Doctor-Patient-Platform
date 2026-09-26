/**
 * Speech Service for NariSetu Doctor Tablet Platform
 *
 * Provides a production-grade audio playback engine interfacing with
 * the backend Orpheus TTS endpoint (POST /api/tts/synthesize).
 *
 * Migrated to official Expo SDK 57 `expo-audio` engine:
 * - Direct native expo-audio Player playback on Android tablet & iOS
 * - Temporary hash-based cache files in app cache directory (zero patient PII)
 * - HTML5 Audio fallback for web previews
 * - Full state machine: idle | loading | playing | paused | error
 * - Single-stream guarantee: stops any running audio before new playback
 * - Controlled sequential queue for "Listen Assessment"
 * - Immediate cancellation on answer submission, question navigation, or language switch
 * - Auxiliary architecture: failure never blocks clinical workflows
 */

import { createAudioPlayer, setAudioModeAsync, AudioPlayer, AudioStatus } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { synthesizeTTS } from '../api';

export type SpeechPlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export interface QueueItem {
  id?: string;
  text: string;
  language: 'en' | 'hi';
  label?: string;
}

export type StateListener = (state: {
  status: SpeechPlaybackState;
  activeText: string | null;
  language: 'en' | 'hi';
  queueIndex?: number;
  queueTotal?: number;
  errorMessage?: string | null;
}) => void;

class SpeechService {
  private currentPlayer: AudioPlayer | null = null;
  private statusSubscription: any = null;
  private htmlAudio: any = null;
  private status: SpeechPlaybackState = 'idle';
  private activeText: string | null = null;
  private activeLanguage: 'en' | 'hi' = 'en';
  private errorMessage: string | null = null;

  // Queue state for "Listen Assessment"
  private queue: QueueItem[] = [];
  private currentQueueIndex = 0;
  private isQueueActive = false;
  private queueProgressCallback: ((index: number, total: number) => void) | null = null;
  private queueCompleteCallback: (() => void) | null = null;

  // In-memory cache: hash -> { audioBase64, format }
  private audioCache = new Map<string, { audioBase64: string; format: string }>();
  private tempFiles: string[] = [];
  private readonly MAX_CACHE = 50;

  // State listeners
  private listeners: Set<StateListener> = new Set();

  constructor() {
    this.configureAudioSession();
  }

  private async configureAudioSession() {
    try {
      if (Platform.OS !== 'web') {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: false,
          interruptionMode: 'duckOthers',
        });
      }
    } catch (err) {
      console.warn('[SpeechService] Audio mode configuration notice:', err);
    }
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    // Notify immediately with current state
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach(fn => fn(state));
  }

  public getState() {
    return {
      status: this.status,
      activeText: this.activeText,
      language: this.activeLanguage,
      queueIndex: this.isQueueActive ? this.currentQueueIndex + 1 : undefined,
      queueTotal: this.isQueueActive ? this.queue.length : undefined,
      errorMessage: this.errorMessage,
    };
  }

  public isPlaying(): boolean {
    return this.status === 'playing';
  }

  public isLoading(): boolean {
    return this.status === 'loading';
  }

  public getStatus(): SpeechPlaybackState {
    return this.status;
  }

  /**
   * Generates a safe in-memory cache key
   */
  private getCacheKey(text: string, language: string): string {
    return `${language}:${text.trim()}`;
  }

  /**
   * Deterministic hash for temporary cache filenames (zero clinical or patient info)
   */
  private getSafeHash(language: string, text: string): string {
    const normalized = text.trim();
    let hash1 = 5381;
    let hash2 = 52711;
    const str = `${language}:${normalized}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash1 = (hash1 * 33) ^ char;
      hash2 = (hash2 * 33) ^ char;
    }
    return `${(hash1 >>> 0).toString(16)}_${(hash2 >>> 0).toString(16)}`;
  }

  /**
   * Fetches synthesized audio base64 and format from backend or cache
   */
  private async fetchAudio(text: string, language: 'en' | 'hi'): Promise<{ audioBase64: string; format: string }> {
    const key = this.getCacheKey(text, language);
    if (this.audioCache.has(key)) {
      return this.audioCache.get(key)!;
    }

    const res = await synthesizeTTS(text, language);
    const audioData = res ? (res.audioBase64 || res.audio) : null;
    if (!res || !audioData) {
      throw new Error('No audio returned from speech synthesis backend.');
    }

    const detectedFormat = (res.format || (res.mimeType?.includes('wav') ? 'wav' : 'mp3')).toLowerCase();

    const audioItem = {
      audioBase64: audioData,
      format: detectedFormat,
    };

    if (this.audioCache.size >= this.MAX_CACHE) {
      const first = this.audioCache.keys().next().value;
      if (first) this.audioCache.delete(first);
    }
    this.audioCache.set(key, audioItem);

    return audioItem;
  }

  /**
   * Prepares a valid URI for expo-audio playback with correct format and MIME type
   */
  private async getAudioFileUri(
    text: string,
    language: 'en' | 'hi',
    base64Audio: string,
    format: string = 'mp3'
  ): Promise<string> {
    const isWav = format === 'wav' || base64Audio.startsWith('UklG');
    const ext = isWav ? 'wav' : 'mp3';
    const mime = isWav ? 'audio/wav' : 'audio/mpeg';

    if (Platform.OS === 'web') {
      return `data:${mime};base64,${base64Audio}`;
    }

    try {
      const cacheDir = FileSystem.cacheDirectory;
      if (!cacheDir) {
        return `data:${mime};base64,${base64Audio}`;
      }

      const hash = this.getSafeHash(language, text);
      const fileUri = `${cacheDir}narsetu_tts_${hash}.${ext}`;

      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        await FileSystem.writeAsStringAsync(fileUri, base64Audio, {
          encoding: FileSystem.EncodingType.Base64,
        });

        this.tempFiles.push(fileUri);
        if (this.tempFiles.length > this.MAX_CACHE) {
          const oldest = this.tempFiles.shift();
          if (oldest) {
            FileSystem.deleteAsync(oldest, { idempotent: true }).catch(() => {});
          }
        }
      }

      return fileUri;
    } catch (err) {
      console.warn('[SpeechService] Temporary file cache notice, using data URI fallback:', err);
      return `data:${mime};base64,${base64Audio}`;
    }
  }

  /**
   * Plays a single text prompt
   */
  public async speak(
    text: string,
    language: 'en' | 'hi',
    onEnded?: () => void,
    onError?: (err: Error) => void
  ): Promise<void> {
    // If currently playing something else, stop it first (single-stream guarantee)
    await this.stop();

    if (!text || !text.trim()) return;

    this.activeText = text;
    this.activeLanguage = language;
    this.status = 'loading';
    this.errorMessage = null;
    this.notify();

    try {
      const { audioBase64, format } = await this.fetchAudio(text, language);
      const audioUri = await this.getAudioFileUri(text, language, audioBase64, format);

      // Web HTML5 Audio fallback
      if (Platform.OS === 'web' && typeof window !== 'undefined' && (window as any).Audio) {
        if (this.htmlAudio) {
          try {
            this.htmlAudio.pause();
            this.htmlAudio.src = '';
          } catch (e) {}
        }

        const audio = new (window as any).Audio(audioUri);
        this.htmlAudio = audio;

        audio.onplay = () => {
          this.status = 'playing';
          this.notify();
        };

        audio.onpause = () => {
          if (this.status !== 'idle' && this.status !== 'loading') {
            this.status = 'paused';
            this.notify();
          }
        };

        audio.onended = () => {
          this.status = 'idle';
          this.activeText = null;
          this.notify();
          if (onEnded) onEnded();
        };

        audio.onerror = () => {
          this.status = 'error';
          this.errorMessage = 'Unable to play audio on this device.';
          this.notify();
          if (onError) onError(new Error('Audio playback failed on web engine.'));
        };

        await audio.play();
        return;
      }

      // Native expo-audio playback
      const player = createAudioPlayer(audioUri, { updateInterval: 200 });
      this.currentPlayer = player;

      this.statusSubscription = player.addListener(
        'playbackStatusUpdate',
        (status: AudioStatus) => {
          if (status.error) {
            console.warn('[SpeechService] Playback status error:', status.error);
            this.status = 'error';
            this.errorMessage = 'Unable to play audio on this device.';
            this.notify();
            if (onError) onError(new Error(status.error));
            return;
          }

          if (status.didJustFinish) {
            this.status = 'idle';
            this.activeText = null;
            this.notify();
            this.unloadCurrentSound();
            if (onEnded) onEnded();
          }
        }
      );

      player.play();
      this.status = 'playing';
      this.notify();
    } catch (err: any) {
      console.warn('[SpeechService] Speech synthesis/playback error:', err);
      this.status = 'error';
      this.errorMessage = err.message || 'Speech service is currently unavailable.';
      this.notify();
      if (onError) onError(err);
    }
  }

  /**
   * Pauses the active audio playback
   */
  public async pause(): Promise<void> {
    if (this.status !== 'playing') return;

    try {
      if (this.htmlAudio) {
        this.htmlAudio.pause();
      } else if (this.currentPlayer) {
        this.currentPlayer.pause();
      }
      this.status = 'paused';
      this.notify();
    } catch (err) {
      console.warn('[SpeechService] Pause error:', err);
    }
  }

  /**
   * Resumes paused audio playback
   */
  public async resume(): Promise<void> {
    if (this.status !== 'paused') return;

    try {
      if (this.htmlAudio) {
        await this.htmlAudio.play();
      } else if (this.currentPlayer) {
        this.currentPlayer.play();
      }
      this.status = 'playing';
      this.notify();
    } catch (err) {
      console.warn('[SpeechService] Resume error:', err);
    }
  }

  /**
   * Stops active playback and unloads resources
   */
  public async stop(): Promise<void> {
    this.isQueueActive = false;
    this.queue = [];
    this.currentQueueIndex = 0;
    this.queueProgressCallback = null;
    this.queueCompleteCallback = null;

    await this.unloadCurrentSound();
    this.status = 'idle';
    this.activeText = null;
    this.errorMessage = null;
    this.notify();
  }

  private async unloadCurrentSound() {
    if (this.statusSubscription) {
      try {
        this.statusSubscription.remove();
      } catch (e) {}
      this.statusSubscription = null;
    }

    if (this.htmlAudio) {
      try {
        this.htmlAudio.pause();
        this.htmlAudio.src = '';
      } catch (e) {}
      this.htmlAudio = null;
    }

    if (this.currentPlayer) {
      try {
        this.currentPlayer.pause();
        this.currentPlayer.remove();
      } catch (e) {}
      this.currentPlayer = null;
    }
  }

  /**
   * Sequential Queue Playback for "Listen Assessment"
   */
  public async playQueue(
    items: QueueItem[],
    onProgress?: (index: number, total: number) => void,
    onComplete?: () => void
  ): Promise<void> {
    await this.stop();

    if (!items || items.length === 0) return;

    this.queue = items;
    this.currentQueueIndex = 0;
    this.isQueueActive = true;
    this.queueProgressCallback = onProgress || null;
    this.queueCompleteCallback = onComplete || null;

    this.playNextQueueItem();
  }

  private async playNextQueueItem() {
    if (!this.isQueueActive || this.currentQueueIndex >= this.queue.length) {
      this.isQueueActive = false;
      this.status = 'idle';
      this.activeText = null;
      this.notify();
      if (this.queueCompleteCallback) {
        this.queueCompleteCallback();
      }
      return;
    }

    const item = this.queue[this.currentQueueIndex];
    if (this.queueProgressCallback) {
      this.queueProgressCallback(this.currentQueueIndex + 1, this.queue.length);
    }

    this.speak(
      item.text,
      item.language,
      () => {
        // Upon finish of current item, advance to next
        if (this.isQueueActive) {
          this.currentQueueIndex++;
          this.playNextQueueItem();
        }
      },
      err => {
        console.warn(`[SpeechService] Error playing queue item ${this.currentQueueIndex + 1}:`, err);
        // On error in queue, stop queue gracefully
        this.isQueueActive = false;
        this.status = 'error';
        this.errorMessage = 'Unable to complete assessment speech playback.';
        this.notify();
      }
    );
  }

  /**
   * Stops queue execution immediately
   */
  public async stopQueue(): Promise<void> {
    await this.stop();
  }

  /**
   * Complete cleanup on screen unmount
   */
  public async cleanup(): Promise<void> {
    await this.stop();
    this.listeners.clear();
  }
}

// Global singleton instance
export const speechService = new SpeechService();
