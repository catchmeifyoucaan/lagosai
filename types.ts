
export interface Message {
  id: number;
  type: 'user' | 'oracle';
  content: string;
  timestamp: Date;
  model?: string;
  image?: ImageResult;
  mood?: 'excited' | 'helpful' | 'demo' | 'error';
  personaKey?: PersonaKey | 'default'; 
}

export interface ImageResult {
  imageUrl: string;
  model: string;
  success: boolean;
}

export type AIModelKey = 'openai' | 'gemini' | 'claude' | 'auto';
export type ImageStyleKey = 'photorealistic' | 'artistic' | 'cyberpunk' | 'anime';

export interface AIModelInfo {
  name: string;
  icon: string;
  color: string;
}

export interface ApiKeys {
  openai: string;
  gemini: string; 
  claude: string;
}

export interface ApiStatus {
  openai: boolean;
  gemini: boolean;
  claude: boolean;
}

export interface ThemeColors {
  bg: string;
  card: string;
  text: string;
  muted: string;
  input: string;
  primaryAccent: string;
  secondaryAccent: string;
}

export interface AIServiceResponse {
  content: string;
  model: string;
  success: boolean;
}

// Persona Types
export type PersonaKey = 'emeka' | 'femi' | 'anita' | 'muhammed';

export interface PersonaInfo {
  name: string;
  icon: string;
  description: string;
  systemPromptModifier: string;
  color?: string; 
}

// Type for image parts in multimodal requests
export interface ImagePart {
  inlineData: {
    mimeType: string;
    data: string; // base64 encoded image data
  };
}

// Extend Window interface for webkitSpeechRecognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any; 
  }
}