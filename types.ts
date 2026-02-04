
export interface ChildProfile {
  name: string;
  age: number;
  favorites: string;
  language: string;
  voice: string;
  theme: string;
  pitch: number;
}

export interface StoryState {
  content: string;
  isStreaming: boolean;
  choices: string[];
  lastChoice?: string;
  audioUrl?: string;
  isAudioPlaying?: boolean;
}

export enum AppView {
  WIZARD = 'WIZARD',
  STORY = 'STORY'
}
