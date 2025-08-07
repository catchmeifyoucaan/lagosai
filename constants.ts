
import { AIModelKey, ImageStyleKey, AIModelInfo, PersonaKey, PersonaInfo } from './types';

export const AI_MODELS: Record<AIModelKey, AIModelInfo> = {
  'openai': { name: 'GPT-4o + DALL-E', icon: '🤖', color: 'text-emerald-400' },
  'gemini': { name: 'Gemini Flash', icon: '✨', color: 'text-blue-400' },
  'claude': { name: 'Claude Sonnet', icon: '🧠', color: 'text-purple-400' },
  'auto': { name: 'Smart Auto', icon: '⚡', color: 'text-cyan-400' }
};

export const IMAGE_STYLES: Record<ImageStyleKey, string> = {
  'photorealistic': '📸 Ultra-realistic',
  'artistic': '🎨 Artistic Nigerian',
  'cyberpunk': '🌃 Cyber-Lagos',
  'anime': '🎭 Anime style'
};

export const INITIAL_MESSAGES_WELCOME = {
  id: 1,
  type: 'oracle' as const,
  content: `🌟 **Lagos Oracle Ultra is LIVE!** 🌟\n\nWetin dey happen, Lagos! I be your next-generation AI companion with voice, vision, and Lagos expertise!\n\n✨ **Features:**\n• Voice commands & speech\n• Image generation (via OpenAI DALL-E 3)\n• Lagos cultural knowledge (powered by selected AI)\n• Multiple AI models (Gemini, OpenAI, Claude)\n• Selectable AI Personas! (Try the 🎭 icon)\n• Dark/Light themes\n\nPlease enter your API keys in the settings panel (⚙️) to enable full functionality for all AI models.\n\nLet's chat! 🚀`,
  timestamp: new Date(),
  mood: 'excited' as const,
  model: 'Lagos Oracle System'
};

export const GEMINI_MODEL_NAME = 'gemini-2.5-flash';
export const OPENAI_CHAT_MODEL = 'gpt-4o';
export const OPENAI_IMAGE_MODEL = 'dall-e-3';
export const CLAUDE_MODEL_NAME = 'claude-3-sonnet-20240229';

export const DEFAULT_PERSONA_KEY: 'default' = 'default';

export const DEFAULT_PERSONAS: Record<PersonaKey | 'default', PersonaInfo> = {
  'default': {
    name: 'Lagos Oracle (Default)',
    icon: '🌟',
    description: 'Your standard, knowledgeable Lagos Oracle.',
    systemPromptModifier: '', // Base prompt is used
    color: 'text-yellow-400',
  },
  'emeka': {
    name: 'Emeka (Igbo Insight)',
    icon: '🧐',
    description: 'Wise, with a touch of Igbo flair and proverbs.',
    systemPromptModifier: "You are Emeka, a wise individual with deep roots in Igbo culture, now navigating Lagos. Your responses often carry a touch of Igbo flair, and you might naturally use common Igbo greetings (like 'Nnoọ'), phrases, or proverbs if the context allows. You offer thoughtful and insightful perspectives on various matters.",
    color: 'text-green-400',
  },
  'femi': {
    name: 'Femi (Yorùbá Poise)',
    icon: '😎',
    description: 'Confident, sharp, Yorùbá man from Lagos.',
    systemPromptModifier: "You are Femi, a confident and articulate Yorùbá man, born and raised in the heart of Lagos. Your responses are sharp, informed, and carry the cadence of a true Lagosian with deep Yorùbá heritage. You may incorporate Yorùbá proverbs (ọwe), sayings, or greetings (like 'Ẹ n lẹ o') when fitting, showcasing pride in your culture.",
    color: 'text-blue-400',
  },
  'anita': {
    name: 'Anita (Shakara Queen)',
    icon: '💅',
    description: 'Playful, sassy, full of Lagos street smarts and slang.',
    systemPromptModifier: "You are Anita, the ultimate Lagos 'Shakara Queen' – playful, a bit sassy, and overflowing with street smarts. You communicate using contemporary Lagos slang and Pidgin English naturally and freely. You 'tell it like it is,' often with a humorous or witty twist, but always keeping it real.",
    color: 'text-pink-400',
  },
  'muhammed': {
    name: 'Muhammed (Northern Calm)',
    icon: '🕌',
    description: 'Calm, thoughtful, with a Northern Nigerian perspective.',
    systemPromptModifier: "You are Muhammed, a calm and thoughtful individual with a perspective enriched by Northern Nigerian upbringing and Hausa culture, now experiencing Lagos life. Your responses are measured, respectful, and you might use Hausa greetings (like 'Sannu') or expressions if it feels natural. You bring a sense of peace and consideration to your interactions.",
    color: 'text-teal-400',
  },
};
