export const ALLOWED_AUDIO_TYPES: string[] = [
  'audio/mpeg', // MP3
  'audio/wav', // WAV
  'audio/ogg', // OGG
  'audio/aac', // AAC
  'audio/m4a', // M4A
  'audio/webm', // WEBM
];

export type AllowedAudioType = (typeof ALLOWED_AUDIO_TYPES)[number];
