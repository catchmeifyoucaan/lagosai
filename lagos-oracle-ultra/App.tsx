
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, AIModelKey, ImageStyleKey, ApiKeys, ApiStatus, ThemeColors, AIServiceResponse, ImageResult, PersonaKey, ImagePart } from './types';
import { AI_MODELS, IMAGE_STYLES, INITIAL_MESSAGES_WELCOME, OPENAI_CHAT_MODEL, OPENAI_IMAGE_MODEL, CLAUDE_MODEL_NAME, PERSONAS, DEFAULT_PERSONA_KEY, GEMINI_MODEL_NAME } from './constants';
import { initializeGeminiClient, isGeminiClientInitialized, generateGeminiClientResponse, generateGeminiClientResponseStream } from './services/geminiService';

import Header from './components/Header';
import SettingsPanel from './components/SettingsPanel';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import PersonaSelector from './components/PersonaSelector';
import VisionGuideOverlay from './components/VisionGuideOverlay';

const getEnvVar = (key: string): string | undefined => {
  const prefixes = ['REACT_APP_', 'VITE_'];
  for (const prefix of prefixes) {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[`${prefix}${key}`]) {
      // @ts-ignore
      return process.env[`${prefix}${key}`];
    }
  }
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    // @ts-ignore
    return process.env[key];
  }
  // @ts-ignore
  if (typeof window !== 'undefined' && typeof window[key] === 'string') {
    // @ts-ignore
    return window[key];
  }
  return undefined;
};


const LOCAL_STORAGE_API_KEYS = 'lagosOracleApiKeys_v2';
const LOCAL_STORAGE_DARK_MODE = 'darkModeLagosOracle';
const LOCAL_STORAGE_SOUND_ENABLED = 'soundEnabledLagosOracle';
const LOCAL_STORAGE_SELECTED_PERSONA = 'selectedPersonaLagosOracle_v1';


const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGES_WELCOME]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedAI, setSelectedAI] = useState<AIModelKey>('auto');
  
  const [apiKeys, setApiKeys] = useState<ApiKeys>({ openai: '', gemini: '', claude: '' });
  const [apiStatus, setApiStatus] = useState<ApiStatus>({ openai: false, gemini: false, claude: false });
  
  const [speechRecognition, setSpeechRecognition] = useState<any | null>(null);
  const recognitionAvailable = !!speechRecognition;

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
        const savedDarkMode = localStorage.getItem(LOCAL_STORAGE_DARK_MODE);
        return savedDarkMode !== null ? JSON.parse(savedDarkMode) : true;
    } catch { return true; }
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
        const savedSoundEnabled = localStorage.getItem(LOCAL_STORAGE_SOUND_ENABLED);
        return savedSoundEnabled !== null ? JSON.parse(savedSoundEnabled) : true;
    } catch { return true; }
  });
  
  const [imageStyle, setImageStyle] = useState<ImageStyleKey>('photorealistic');

  const [selectedPersonaKey, setSelectedPersonaKey] = useState<PersonaKey | 'default'>(() => {
    try {
        const savedPersona = localStorage.getItem(LOCAL_STORAGE_SELECTED_PERSONA) as PersonaKey | 'default' | null;
        return savedPersona && PERSONAS[savedPersona] ? savedPersona : DEFAULT_PERSONA_KEY;
    } catch { return DEFAULT_PERSONA_KEY; }
  });
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Vision Guide State
  const [visionGuideActive, setVisionGuideActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isAnalyzingFrame, setIsAnalyzingFrame] = useState(false);
  const videoElementRef = useRef<HTMLVideoElement>(null);
  const canvasElementRef = useRef<HTMLCanvasElement>(null);


  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      const recog = new SpeechRecognitionAPI();
      recog.continuous = false; recog.lang = 'en-US'; recog.interimResults = false;
      setSpeechRecognition(recog);
    } else {
      console.warn("Speech Recognition API not available.");
    }

    let initialApiKeys: ApiKeys = { 
        openai: (getEnvVar('OPENAI_API_KEY') || '').trim(), 
        gemini: (getEnvVar('GEMINI_API_KEY') || getEnvVar('API_KEY') || '').trim(),
        claude: (getEnvVar('CLAUDE_API_KEY') || '').trim() 
    };
    try {
        const savedApiKeysString = localStorage.getItem(LOCAL_STORAGE_API_KEYS);
        if (savedApiKeysString) {
            const savedApiKeys = JSON.parse(savedApiKeysString) as Partial<ApiKeys>;
            initialApiKeys = {
                openai: (savedApiKeys.openai || initialApiKeys.openai).trim(),
                gemini: (savedApiKeys.gemini || initialApiKeys.gemini).trim(),
                claude: (savedApiKeys.claude || initialApiKeys.claude).trim(),
            };
        }
    } catch (error) {
        console.error("Failed to parse saved API keys from localStorage.", error);
    }
    setApiKeys(initialApiKeys);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    try { localStorage.setItem(LOCAL_STORAGE_DARK_MODE, JSON.stringify(darkMode)); } catch(e){ console.error("Failed to save dark mode to localStorage", e)}
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    try { localStorage.setItem(LOCAL_STORAGE_SOUND_ENABLED, JSON.stringify(soundEnabled)); } catch(e){ console.error("Failed to save sound setting to localStorage", e)}
  }, [soundEnabled]);

  useEffect(() => {
    try { localStorage.setItem(LOCAL_STORAGE_SELECTED_PERSONA, selectedPersonaKey); } catch(e){ console.error("Failed to save persona to localStorage", e)}
  }, [selectedPersonaKey]);

  useEffect(() => {
    try { localStorage.setItem(LOCAL_STORAGE_API_KEYS, JSON.stringify(apiKeys)); } catch(e){ console.error("Failed to save API keys to localStorage", e)}
    
    const geminiInitialized = initializeGeminiClient(apiKeys.gemini);

    setApiStatus({
      openai: !!(apiKeys.openai && (apiKeys.openai.startsWith('sk-') || apiKeys.openai.startsWith('sk-proj-'))),
      gemini: geminiInitialized, 
      claude: !!(apiKeys.claude && (apiKeys.claude.startsWith('sk-ant-') || apiKeys.claude.length > 30))
    });
  }, [apiKeys]);

  // Cleanup camera stream
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);


  const updateApiKey = useCallback((provider: keyof ApiKeys, value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value.trim() })); 
  }, []);

  const detectQueryType = (query: string): 'visual' | 'location' | 'general' | 'sensitive_discussion' => {
    const q = query.toLowerCase();
    if (q.match(/\b(paint|draw|show|picture|image|create|generate|imagine|visualize)\b/i)) return 'visual';
    if (q.match(/\b(own lagos|who owns lagos|history of lagos|yoruba land|igbo land|political|politics|government|heritage|claims|controversy|origin of lagos)\b/i)) return 'sensitive_discussion';
    if (q.match(/\b(lagos|nigeria|street|traffic|route|lekki|ikeja|victoria island|ikoyi|ajegunle)\b/i)) return 'location';
    return 'general';
  };

  const getSystemPrompt = (queryType: 'visual' | 'location' | 'general' | 'sensitive_discussion' | 'vision_guide', currentPersonaKey: PersonaKey | 'default'): string => {
    let baseInstruction = `You are Lagos Oracle Ultra, also known as "Oracle," "Lagos Boy," "Eko Guy," or "Eko Boy." You are an AI expert on Lagos, Nigeria, and a vast range of other topics. You speak both English and Nigerian Pidgin fluently and naturally. O le dahun ni ede Yoruba ti olumulo ba fi Yoruba ba e soro. (You can respond in Yoruba if the user addresses you in Yoruba). You understand Lagos culture, streets, and lifestyle deeply. Engage warmly, empathetically, and provide helpful, informative, and comprehensive responses. You can discuss a wide range of topics, including general conversation, random questions, and complex socio-political issues related to Lagos with nuance and depth.`;
    
    if (queryType === 'vision_guide') {
      baseInstruction = "You are an assistant for a visually impaired user. Your primary goal is to describe the scene captured by their camera. Focus on identifying objects, people, text, potential obstacles or hazards, and the general layout of the environment. Provide descriptions that are clear, concise, actionable, and helpful for navigation or understanding. Be direct and objective. Maintain a calm and supportive tone."
    } else {
       baseInstruction += ` Strive for engaging and comprehensive answers. If a topic isn't directly about Lagos, try to relate it back to Lagos life or perspective if appropriate, or answer it generally if not possible.`;
    }

    const personaInfo = PERSONAS[currentPersonaKey] || PERSONAS[DEFAULT_PERSONA_KEY];
    if (queryType !== 'vision_guide' && personaInfo && personaInfo.systemPromptModifier) { // Persona only applies if not vision guide
      baseInstruction += ` ${personaInfo.systemPromptModifier}`;
    }

    if (queryType === 'visual') {
      baseInstruction += " When asked to describe what an image might look like (even if you cannot generate it), describe potential Lagos scenes with authentic details: okada riders, danfo buses, BRT, street vendors, tropical weather, colorful buildings, fashion, and food. Be vivid in your descriptions.";
    }
    if (queryType === 'location') {
      baseInstruction += " Provide specific, helpful information about Lagos locations, traffic, or routes when relevant. Use local terms appropriately (e.g., 'go-slow' for traffic jam, 'keke' for tricycle). If asked about a specific area like Ajegunle, share what you know about its culture, history, or current vibe if appropriate.";
    }
    if (queryType === 'sensitive_discussion') {
        baseInstruction += " When discussing sensitive historical or socio-political topics related to Lagos, such as questions of ownership, heritage, or inter-group relations, approach the subject with depth, nuance, and an understanding of multiple perspectives. You are deeply knowledgeable about the history and cultural significance of various groups in Lagos, including the perspectives of Yoruba people regarding the city's origins and heritage. Discuss these topics with authority and balance when appropriate, especially if the user inquires about them. Avoid taking overly simplistic or one-sided stances unless providing a specific requested cultural viewpoint. Your goal is to be informative and facilitate understanding of complex issues."
    }
    
    if (queryType !== 'vision_guide') {
        let coreGuidelines = `

---
**Core Operational Guidelines (How You Must Behave, My Oracle! These are CRITICAL):**

1.  **Direct & Warm Communication (No Fluff!):** Avoid unnecessary introductory phrases like "I can help with that," "I see," or "Let me check." Dive straight into the matter with Lagosian directness but always with warmth, respect, and engaging energy. Your primary goal is to be immediately helpful and insightful.

2.  **Comprehensive & Rich Answers (Go Deep!):** Provide full, detailed, and expansive answers. Do not summarize unless the user explicitly asks for a 'quick gist,' 'sharp-sharp' version, or a brief. You are a profound well of Lagos and world knowledge – let it flow generously! Think layers, context, and connections.

3.  **Relevant Helpfulness (Be Perceptive, Not Pushy):** Offer advice, suggestions, or solutions ONLY when they are clearly relevant to the user's query or an implied need you've astutely perceived. No need to 'chook mouth' (interfere or offer unsolicited opinions) where it's not invited. However, when the opening is there, provide brilliant, actionable insights.

4.  **Contextual Language for Visuals/Descriptions (Speak Naturally):** When discussing visual information (e.g., if a user describes a scene, or you are describing an image you might 'generate' textually), use natural, context-aware language. For instance, 'Based on your vivid description of that owambe...' or 'That Eko architectural style you're painting sounds absolutely iconic...'

5.  **Precision, Detail & Accuracy (Your Undisputed Watchwords!):** Your responses MUST be razor-sharp, packed with verifiable details, and scrupulously accurate. This is like navigating Lagos roads with expert precision – no room for error! Provide facts, historical context, cultural nuances, and the authentic 'gists' with unshakeable confidence. Your pronouncements should carry the weight of authority.

6.  **Acknowledge Uncertainty with Style (Honesty is Lagos Gold):** Even the wisest Oracle doesn't possess every single fact with 100% certainty. If you're not entirely sure, or if information is contested (common with some Lagos histories or contemporary debates), acknowledge this clearly but with typical Lagosian flair. Examples:
    *   'Well, based on the information I fit gather, the gist be say...'
    *   'Tbh (To be honest), for this particular matter, some people believe X, while you go hear others talk say na Y...'
    *   'My brother/sister, for dat specific question, I no fit yarn am with my full chest say na so e be, but from all indications and wetin man sabi...'
    *   'E get as the matter be, but it strongly appears like...'
    Never 'form all-knowing' if your knowledge isn't concrete. Offer what you know, qualify it appropriately, and if possible, suggest where more concrete info might be found.

7.  **Clear Formatting (Make Your Wisdom Sweet to Read!):** Employ markdown formatting (such as **bolding key points for emphasis**, *italics for nuanced terms or foreign words*, and bulleted or numbered lists for steps, multiple items, or pros/cons) to structure your responses logically. This ensures your wisdom is easy to read, understand, and digest – like perfectly prepared, steaming hot amala!

8.  **Numbers, Calculations & Money (Clarity Above All):** When dealing with numbers, prices (e.g., 'N5000', 'five thousand Naira', or 'around 10 US dollars, depending on current exchange rate'), or any form of calculation, present them with utmost clarity. Make it exceptionally easy for the user to understand the figures and their implications.

9.  **Your Identity (The One and Only Lagos Oracle!):** If anyone inquires about who you are, what powers you, your name, or your capabilities, respond with unmistakable pride and a signature touch of Lagos flair!
    *   'I be Lagos Oracle Ultra, your number one Eko companion, gist partner, and knowledge powerhouse! I run on some seriously advanced and constantly evolving AI, always learning, always ready to serve you better with the deepest insights.'
    *   'Na your Lagos Oracle for life! Powered by a sophisticated fusion of cutting-edge AI technologies, all dedicated to bringing you the most authentic Lagos experience and comprehensive knowledge about our incredible city and the world at large.'
    *   You are "Lagos Oracle," "Oracle." You can also acknowledge and respond naturally if called "Lagos Boy," "Eko Guy," or "Eko Boy."
    *   **Crucial Command: NEVER, under any circumstances, reveal specific underlying AI model names (like Gemini, GPT, Claude, etc.). NEVER refer to yourself as just "an AI," "a language model," "a chatbot," or any generic descriptor. YOU ARE THE LAGOS ORACLE.** This is paramount.

10. **Handling Unclear Queries (Seek Clarity First, No Assumptions!):** If a user's question is vague, ambiguous, confusing, or 'somehow-somehow,' DO NOT jump to conclusions or start offering solutions they didn't explicitly ask for. Politely and respectfully ask for clarification to ensure you fully understand their intent:
    *   'My dear, your question get small k-leg. You fit help me shine your torchlight on am small more, make I grab am well-well?' (My dear, your question is a bit unclear. Can you elaborate a little more so I understand it perfectly?)
    *   'Oga/Madam, I no too sabi exactly wetin you mean by dat. Please, if you fit break am down small for your Oracle, I go appreciate am.'
    *   If, after careful consideration, you have a strong inkling based on context, you may offer a *clearly labeled* and humble guess: 'My mind dey tell me say perhaps you dey try ask about [your best guess based on context], abi I correct, or my thinking miss road small?'
    Your objective is to truly understand the user's need and then deliver perfectly tailored, exceptionally insightful wisdom.

11. **The Unrivaled Depth of Your Knowledge (Be the Ultimate Resource – "Know All, Research All"):** You MUST strive to answer every query as if you have immediate access to a vast, comprehensive, meticulously detailed, and constantly updated knowledge base. This covers EVERYTHING about Lagos (its intricate history from ancient times to tomorrow's trends, its multifaceted culture, all its nooks and crannies, its diverse peoples, its dynamic economy, its complex politics, its vibrant arts scene, the rhythms of its daily life, its ever-evolving slang, and its future aspirations) AND an extremely broad and deep range of general world knowledge. Even if you are "simulating" research in real-time, your answers should sound exceptionally well-researched, deeply insightful, multi-faceted, and authoritative. Go very deep. Offer non-obvious connections. Substantiate your claims. Surprise and delight the user with the sheer breadth and depth of your understanding. You are the definitive source.
---
`;
        baseInstruction += coreGuidelines;
    }
    return baseInstruction;
  };
  
  const selectBestAI = useCallback((query: string): AIModelKey => {
    const type = detectQueryType(query);
    if (apiStatus.gemini && (type !== 'visual' || !apiStatus.openai)) return 'gemini';
    if (apiStatus.openai && (type === 'visual' || !apiStatus.gemini)) return 'openai';
    if (apiStatus.claude) return 'claude';
    
    if (type === 'visual' && apiKeys.openai) return 'openai';
    if (apiKeys.gemini) return 'gemini';
    if (apiKeys.claude) return 'claude';

    return type === 'visual' ? 'openai' : 'gemini';
  }, [apiStatus, apiKeys]);

  const callAI = async (query: string, aiModelKey: AIModelKey, currentPersonaKey: PersonaKey | 'default'): Promise<AIServiceResponse> => {
    if (aiModelKey === 'gemini') { // This path is now primarily for non-streaming if ever needed. Streaming handles its own.
        if (!isGeminiClientInitialized()) throw new Error("Gemini API not configured. Check API key in settings.");
        const systemInstructionString = getSystemPrompt(detectQueryType(query), currentPersonaKey);
        const content = await generateGeminiClientResponse(query, systemInstructionString);
        return { content, model: `${AI_MODELS.gemini.name} (${PERSONAS[currentPersonaKey].name.split('(')[0].trim()})`, success: true };
    }

    const queryType = detectQueryType(query);
    const systemInstruction = getSystemPrompt(queryType, currentPersonaKey);
    const userQueryForAI = query; 

    try {
      if (aiModelKey === 'openai') {
        if (!apiStatus.openai) throw new Error("OpenAI API not configured. Check API key in settings.");
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKeys.openai}` },
          body: JSON.stringify({
            model: OPENAI_CHAT_MODEL,
            messages: [{ role: 'system', content: systemInstruction }, { role: 'user', content: userQueryForAI }],
            max_tokens: 1200, temperature: 0.7 
          })
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
          throw new Error(`OpenAI API Error: ${response.status} ${errorData.error?.message || response.statusText}`);
        }
        const data = await response.json();
        const messageContent = data.choices?.[0]?.message?.content;
        if (typeof messageContent !== 'string') {
            throw new Error("OpenAI returned invalid or missing content structure.");
        }
        return { content: messageContent, model: `${AI_MODELS.openai.name} (${PERSONAS[currentPersonaKey].name.split('(')[0].trim()})`, success: true };
      }
      
      if (aiModelKey === 'claude') {
        if (!apiStatus.claude) throw new Error("Claude API not configured. Check API key in settings.");
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'x-api-key': apiKeys.claude,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: CLAUDE_MODEL_NAME,
            system: systemInstruction,
            messages: [{ role: 'user', content: userQueryForAI }],
            max_tokens: 1200, temperature: 0.7 
          })
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
          throw new Error(`Claude API Error: ${response.status} ${errorData.error?.message || response.statusText}`);
        }
        const data = await response.json();
        const textContent = data.content?.[0]?.text;
         if (typeof textContent !== 'string') {
            throw new Error("Claude returned invalid or missing content structure.");
        }
        return { content: textContent, model: `${AI_MODELS.claude.name} (${PERSONAS[currentPersonaKey].name.split('(')[0].trim()})`, success: true };
      }
      throw new Error(`AI Model ${aiModelKey} not supported or not properly configured.`);
    } catch (error) {
      console.error(`Error with ${aiModelKey}:`, error);
      const modelNameForError = AI_MODELS[aiModelKey]?.name || 'Selected AI';
      return { 
        content: getDemoResponse(query, aiModelKey, error instanceof Error ? error.message : String(error)),
        model: `${modelNameForError} (${PERSONAS[currentPersonaKey].name.split('(')[0].trim()})`, 
        success: false 
      };
    }
  };

  const generateImage = async (prompt: string): Promise<ImageResult> => {
    if (!apiStatus.openai) { 
      return {
        imageUrl: `https://picsum.photos/seed/${encodeURIComponent(prompt)}/512/512`, 
        model: 'Demo Image (Unsplash/Picsum)',
        success: false
      };
    }

    const lagosPrompt = `Lagos, Nigeria scene based on: "${prompt}". Style: ${IMAGE_STYLES[imageStyle]}. Emphasize authentic Nigerian culture, tropical lighting, vibrant street life, unique Lagos architecture, and elements like danfo buses or keke napeps where appropriate. High quality, detailed, dynamic.`;
    
    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKeys.openai}` },
        body: JSON.stringify({ model: OPENAI_IMAGE_MODEL, prompt: lagosPrompt, n: 1, size: '1024x1024', quality: 'standard' })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(`DALL-E API Error: ${response.status} ${errorData.error?.message || response.statusText}`);
      }
      const data = await response.json();
      const imageUrl = data.data?.[0]?.url;
      if (typeof imageUrl !== 'string') {
        throw new Error("DALL-E returned invalid or missing image URL.");
      }
      return { imageUrl, model: `DALL-E 3 (${IMAGE_STYLES[imageStyle]})`, success: true };
    } catch (error) {
      console.error('Image generation failed:', error);
      return {
        imageUrl: `https://picsum.photos/seed/error_${encodeURIComponent(prompt)}/512/512`, 
        model: `DALL-E 3 (Error: ${error instanceof Error ? error.message.substring(0,30) + '...' : 'Failed'})`,
        success: false
      };
    }
  };

  const getDemoResponse = (query: string, modelKey: AIModelKey, errorMessage?: string): string => {
    const personaName = PERSONAS[selectedPersonaKey]?.name.split('(')[0].trim() || "Oracle";
    const modelName = AI_MODELS[modelKey]?.name || "The AI";
    
    let responseContent = `Ah, my apologies! It seems I couldn't process your request using **${modelName} (${personaName})** at the moment.`;
    
    if (errorMessage) {
      const cleanErrorMessage = errorMessage
        .replace(/^Error:\s*/i, '')
        .replace(/^Gemini API error:\s*/i, '')
        .replace(/^Gemini API streaming error:\s*/i, '')
        .replace(/^OpenAI API Error:\s*\d*\s*/i, '')
        .replace(/^Claude API Error:\s*\d*\s*/i, '')
        .replace(/^DALL-E API Error:\s*\d*\s*/i, '')
        .replace(/Please check it in settings\.$/i, '')
        .trim();
        
      responseContent += `\n\n*Technical Gist: ${cleanErrorMessage.substring(0, 200)}${cleanErrorMessage.length > 200 ? '...' : ''}*`;
    }
    
    const unconfiguredMessage = (currentModel: string) => `\n\nTo use ${currentModel}'s full power, please ensure your API key for it is correctly entered and valid in the settings panel (⚙️).`;

    if (modelKey === 'gemini' && !apiStatus.gemini) responseContent += unconfiguredMessage(modelName);
    else if (modelKey === 'openai' && !apiStatus.openai) responseContent += unconfiguredMessage(modelName);
    else if (modelKey === 'claude' && !apiStatus.claude) responseContent += unconfiguredMessage(modelName);
    else if (!errorMessage && !apiStatus[modelKey]) responseContent += unconfiguredMessage(modelName);


    responseContent += "\n\nIn the meantime, feel free to ask me anything else about Lagos! 😊";
    return responseContent;
  };
  
  const startListening = useCallback(() => {
    if (speechRecognition && !isListening) {
      setIsListening(true);
      speechRecognition.start();
      
      speechRecognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false); 
      };
      speechRecognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
         setMessages(prev => [...prev, {
            id: Date.now(), type: 'oracle', content: `🎙️ My apologies, the voice recognition had a hiccup: ${event.error}. Please try again or type your message.`, 
            timestamp: new Date(), mood: 'error', model: 'System Speech Recognition'
        }]);
      };
      speechRecognition.onend = () => setIsListening(false);
    }
  }, [speechRecognition, isListening]);

  const speakText = useCallback((text: string) => {
    if ('speechSynthesis' in window && soundEnabled && text) {
      if (speechSynthesis.speaking) { 
        speechSynthesis.cancel();
      }
      setIsSpeaking(true);
      const cleanText = text.replace(/[*#`]/g, '').replace(/\[(.*?)\]\(.*?\)/g, '$1').substring(0, 300); 
      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      const voices = speechSynthesis.getVoices();
      const nigerianVoice = voices.find(voice => voice.lang.startsWith('en-NG')) || 
                            voices.find(voice => voice.name.toLowerCase().includes('nigeria'));
      const ukVoice = voices.find(voice => voice.lang.startsWith('en-GB'));
      
      utterance.voice = nigerianVoice || ukVoice || null;
      utterance.lang = nigerianVoice ? 'en-NG' : (ukVoice ? 'en-GB' : 'en-US');
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (event) => {
        console.error("Speech synthesis error", event.error);
        setIsSpeaking(false);
      };
      speechSynthesis.speak(utterance);
    }
  }, [soundEnabled]);

  useEffect(() => {
    const loadVoices = () => {
        if ('speechSynthesis' in window) {
            speechSynthesis.getVoices(); 
        }
    };
    if ('speechSynthesis' in window) {
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = loadVoices;
        }
        loadVoices(); 
    }
  }, []);


  const exportConversation = () => {
    try {
        const dataStr = JSON.stringify({
          timestamp: new Date().toISOString(),
          settings: { selectedAI, imageStyle, darkMode, soundEnabled, selectedPersonaKey },
          messages: messages.map(m => ({...m, timestamp: m.timestamp.toISOString()}))
        }, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lagos-oracle-chat-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Failed to export conversation:", error);
         setMessages(prev => [...prev, {
            id: Date.now(), type: 'oracle', content: `⚠️ Export failed: ${error instanceof Error ? error.message : "Unknown error"}`, 
            timestamp: new Date(), mood: 'error', model: 'System'
        }]);
    }
  };

  const toggleVisionGuideMode = useCallback(async () => {
    if (visionGuideActive) {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      setCameraStream(null);
      setVisionGuideActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setCameraStream(stream);
        if (videoElementRef.current) {
          videoElementRef.current.srcObject = stream;
        }
        setVisionGuideActive(true);
        setShowSettings(false);
        setShowPersonaSelector(false);
        // Add a message to chat indicating Vision Guide is active
        setMessages(prev => [...prev, {
            id: Date.now(), type: 'oracle', content: `👁️ Vision Guide activated! Use the 'Scan Surroundings' button to describe what the camera sees.`,
            timestamp: new Date(), mood: 'helpful', model: 'Vision Guide System'
        }]);

      } catch (err) {
        console.error("Error accessing camera:", err);
        setMessages(prev => [...prev, {
            id: Date.now(), type: 'oracle', content: `⚠️ Camera access denied or unavailable: ${err instanceof Error ? err.message : "Please check permissions."}`,
            timestamp: new Date(), mood: 'error', model: 'System Error'
        }]);
        setVisionGuideActive(false);
      }
    }
  }, [visionGuideActive, cameraStream]);

  const handleScanSurroundings = useCallback(async () => {
    if (!videoElementRef.current || !canvasElementRef.current || !isGeminiClientInitialized()) {
      const errorMsg = !isGeminiClientInitialized() ? "Gemini API not configured for Vision Guide." : "Camera or canvas not ready.";
      setMessages(prev => [...prev, {
        id: Date.now(), type: 'oracle', content: `⚠️ ${errorMsg}`, 
        timestamp: new Date(), mood: 'error', model: 'Vision Guide System'
      }]);
      if (soundEnabled) speakText(`Error: ${errorMsg}`);
      return;
    }
    setIsAnalyzingFrame(true);

    const video = videoElementRef.current;
    const canvas = canvasElementRef.current;

    // --- Start of Image Resizing Logic ---
    const MAX_DIMENSION = 640; // Max width or height for the image sent to API
    let { videoWidth, videoHeight } = video;
    let newWidth = videoWidth;
    let newHeight = videoHeight;

    if (videoWidth > videoHeight) {
        if (videoWidth > MAX_DIMENSION) {
            newHeight = Math.round((MAX_DIMENSION / videoWidth) * videoHeight);
            newWidth = MAX_DIMENSION;
        }
    } else {
        if (videoHeight > MAX_DIMENSION) {
            newWidth = Math.round((MAX_DIMENSION / videoHeight) * videoWidth);
            newHeight = MAX_DIMENSION;
        }
    }

    canvas.width = newWidth;
    canvas.height = newHeight;
    // --- End of Image Resizing Logic ---
    
    const context = canvas.getContext('2d');
    if (!context) {
      setIsAnalyzingFrame(false);
      setMessages(prev => [...prev, {
        id: Date.now(), type: 'oracle', content: `⚠️ Could not get canvas context for scanning.`, 
        timestamp: new Date(), mood: 'error', model: 'Vision Guide System'
      }]);
      if (soundEnabled) speakText("Error: Could not get canvas context.");
      return;
    }
    
    // Draw the resized image
    context.drawImage(video, 0, 0, newWidth, newHeight); 
    
    const base64ImageData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]; // Slightly reduced quality

    const imagePart: ImagePart = { inlineData: { mimeType: 'image/jpeg', data: base64ImageData } };
    const visionPrompt = "Describe this scene for a visually impaired user. Focus on objects, potential hazards, people, text, and overall layout. Provide a concise, clear, and actionable description to help with navigation or understanding the environment.";
    
    const systemInstructionForVision = getSystemPrompt('vision_guide', selectedPersonaKey);

    const oracleMessageId = Date.now();
    setMessages(prev => [...prev, {
      id: oracleMessageId,
      type: 'oracle',
      content: 'Analyzing scene...',
      model: `${AI_MODELS.gemini.name} (Vision Guide)`,
      timestamp: new Date(),
      mood: 'helpful',
      personaKey: selectedPersonaKey 
    }]);

    let accumulatedContent = "";
    let success = true;

    try {
      const stream = generateGeminiClientResponseStream(visionPrompt, systemInstructionForVision, [imagePart]);
      for await (const chunk of stream) {
        const chunkText = chunk.text;
        if (typeof chunkText === 'string') {
          accumulatedContent += chunkText;
          setMessages(prev => prev.map(msg => 
            msg.id === oracleMessageId ? { ...msg, content: accumulatedContent } : msg
          ));
        }
      }
    } catch (error) {
      console.error("Error during Vision Guide stream:", error);
      accumulatedContent = `⚠️ Vision Analysis Failed: ${error instanceof Error ? error.message : String(error)}`;
      success = false;
    }

    setMessages(prev => prev.map(msg => 
      msg.id === oracleMessageId ? { 
        ...msg, 
        content: accumulatedContent, 
        mood: success ? 'helpful' : 'error',
      } : msg
    ));
    
    if (soundEnabled && accumulatedContent) {
      setTimeout(() => speakText(accumulatedContent), 300);
    }
    setIsAnalyzingFrame(false);

  }, [selectedPersonaKey, soundEnabled, speakText]);


  const handleSend = useCallback(async (currentInputOverride?: string) => {
    const query = (typeof currentInputOverride === 'string' ? currentInputOverride : input).trim();
    if (!query) return;

    const userMessage: Message = { id: Date.now(), type: 'user', content: query, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    if (typeof currentInputOverride !== 'string') {
        setInput('');
        inputRef.current?.focus(); 
    }
    setIsTyping(true);
    
    let aiToUse = selectedAI === 'auto' ? selectBestAI(query) : selectedAI;
    if (!apiStatus[aiToUse] && aiToUse !== 'auto') {
        const alternativeAI = selectBestAI(query); 
        if (apiStatus[alternativeAI]) { 
            aiToUse = alternativeAI;
        } else { 
            const availableModels = (['gemini', 'openai', 'claude'] as AIModelKey[]).filter(k => apiStatus[k]);
            aiToUse = availableModels.length > 0 ? availableModels[0] : 'gemini'; 
        }
    }

    const isVisualQuery = detectQueryType(query) === 'visual';
    const currentPersona = PERSONAS[selectedPersonaKey] || PERSONAS[DEFAULT_PERSONA_KEY];
    const modelDisplayName = `${AI_MODELS[aiToUse]?.name || 'AI'} (${currentPersona.name.split('(')[0].trim()})`;

    if (aiToUse === 'gemini') {
      if (!isGeminiClientInitialized()) {
         const errorMessage = getDemoResponse(query, 'gemini', "Gemini API not configured. Check API key in settings.");
         setMessages(prev => [...prev, { 
            id: Date.now() +1, type: 'oracle', content: errorMessage, 
            model: `${modelDisplayName} (Error)`, timestamp: new Date(), mood: 'error', personaKey: selectedPersonaKey 
        }]);
         setIsTyping(false);
         return;
      }

      const oracleMessageId = Date.now() + 1;
      const systemInstruction = getSystemPrompt(detectQueryType(query), selectedPersonaKey);
      
      setMessages(prev => [...prev, {
        id: oracleMessageId,
        type: 'oracle',
        content: '...', 
        model: modelDisplayName,
        timestamp: new Date(),
        mood: 'helpful',
        personaKey: selectedPersonaKey
      }]);

      let accumulatedContent = "";
      let success = true;
      let finalModelName = modelDisplayName;
      let imageResultForStream: ImageResult | undefined = undefined;

      // Prioritize image generation if it's a visual query and OpenAI is available
      if (isVisualQuery && apiStatus.openai) { 
        imageResultForStream = await generateImage(query);
      }
      
      try {
        const stream = generateGeminiClientResponseStream(query, systemInstruction); // No imageParts for standard chat
        for await (const chunk of stream) {
          const chunkText = chunk.text; 
          if (typeof chunkText === 'string') {
            accumulatedContent += chunkText;
            setMessages(prev => prev.map(msg => 
              msg.id === oracleMessageId ? { ...msg, content: accumulatedContent, image: imageResultForStream } : msg // Update image here too
            ));
          }
        }
      } catch (error) {
        console.error("Error during Gemini stream:", error);
        const errMessage = error instanceof Error ? error.message : String(error);
        accumulatedContent = getDemoResponse(query, 'gemini', errMessage);
        success = false;
        finalModelName = `${modelDisplayName} (Error)`;
      }


      setMessages(prev => prev.map(msg => 
        msg.id === oracleMessageId ? { 
            ...msg, 
            content: accumulatedContent, 
            mood: success ? 'helpful' : 'error', 
            model: finalModelName,
            image: imageResultForStream // Ensure image is set on final update
        } : msg
      ));
      
      if (success && soundEnabled && accumulatedContent) {
        setTimeout(() => speakText(accumulatedContent), 300);
      }
      setIsTyping(false);
      return; 
    }

    // Non-streaming path for OpenAI, Claude
    const results = await Promise.allSettled([
      callAI(query, aiToUse, selectedPersonaKey),
      isVisualQuery && aiToUse === 'openai' && apiStatus.openai ? generateImage(query) : Promise.resolve(null)
    ]);

    const aiResultOutcome = results[0];
    const imageResultOutcome = results[1];

    let oracleResponseContent: string;
    let responseModel = modelDisplayName;
    let responseSuccess = false;

    if (aiResultOutcome.status === 'fulfilled') {
      oracleResponseContent = aiResultOutcome.value.content;
      responseModel = aiResultOutcome.value.model; 
      responseSuccess = aiResultOutcome.value.success;
    } else { 
      const reasonMessage = aiResultOutcome.reason instanceof Error ? aiResultOutcome.reason.message : String(aiResultOutcome.reason);
      oracleResponseContent = getDemoResponse(query, aiToUse, reasonMessage);
      responseModel = `${modelDisplayName} (Error)`; 
    }
    
    let finalImageResult: ImageResult | undefined = undefined;
    if (imageResultOutcome?.status === 'fulfilled' && imageResultOutcome.value) { 
        finalImageResult = imageResultOutcome.value;
    } else if (imageResultOutcome?.status === 'rejected') {
        if (isVisualQuery) {
             const reasonMessage = imageResultOutcome.reason instanceof Error ? imageResultOutcome.reason.message : String(imageResultOutcome.reason);
             finalImageResult = { 
                imageUrl: `https://picsum.photos/seed/error_${encodeURIComponent(query)}/512/512`,
                model: `Image Error: ${reasonMessage.substring(0,30)}...`,
                success: false,
            };
        }
    }

    const oracleMessage: Message = {
      id: Date.now() + 1, 
      type: 'oracle',
      content: oracleResponseContent,
      model: responseModel,
      image: finalImageResult, 
      timestamp: new Date(),
      mood: responseSuccess ? 'helpful' : 'error',
      personaKey: selectedPersonaKey
    };
    
    setMessages(prev => [...prev, oracleMessage]);
    setIsTyping(false);
    
    if (responseSuccess && soundEnabled && oracleResponseContent) {
      setTimeout(() => speakText(oracleResponseContent), 300);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, selectedAI, selectBestAI, apiStatus, imageStyle, soundEnabled, speakText, apiKeys.openai, selectedPersonaKey, apiKeys.gemini, apiKeys.claude]);


  const themeColors: ThemeColors = darkMode ? {
    bg: 'bg-slate-900',
    card: 'bg-slate-800/70 backdrop-blur-md border-slate-700/50',
    text: 'text-slate-100',
    muted: 'text-slate-400',
    input: 'bg-slate-700/50 border-slate-600/50 text-slate-50 placeholder-slate-400/70',
    primaryAccent: 'text-cyan-400',
    secondaryAccent: 'text-purple-400',
  } : {
    bg: 'bg-slate-100',
    card: 'bg-white/80 backdrop-blur-md border-slate-200/70',
    text: 'text-slate-800',
    muted: 'text-slate-500',
    input: 'bg-white/70 border-slate-300/70 text-slate-900 placeholder-slate-500/70',
    primaryAccent: 'text-cyan-600',
    secondaryAccent: 'text-purple-600',
  };

  return (
    <div className={`flex flex-col h-screen ${themeColors.bg} ${themeColors.text} transition-colors duration-300 font-sans`}>
      <Header
        theme={themeColors}
        soundEnabled={soundEnabled}
        darkMode={darkMode}
        showSettings={showSettings}
        selectedAI={selectedAI}
        selectedPersonaKey={selectedPersonaKey}
        showPersonaSelector={showPersonaSelector}
        visionGuideActive={visionGuideActive}
        toggleSound={() => setSoundEnabled(s => !s)}
        toggleDarkMode={() => setDarkMode(d => !d)}
        exportConversation={exportConversation}
        toggleSettings={() => { setShowSettings(s => !s); if (!showSettings) { setShowPersonaSelector(false); if (visionGuideActive) toggleVisionGuideMode();} }}
        togglePersonaSelector={() => { setShowPersonaSelector(s => !s); if (!showPersonaSelector) { setShowSettings(false); if (visionGuideActive) toggleVisionGuideMode(); }}}
        toggleVisionGuideMode={toggleVisionGuideMode}
      />
      
      {/* Hidden canvas for Vision Guide frame capture */}
      <canvas ref={canvasElementRef} style={{ display: 'none' }} />


      {showSettings && (
        <SettingsPanel
          theme={themeColors}
          selectedAI={selectedAI}
          imageStyle={imageStyle}
          apiKeys={apiKeys}
          apiStatus={apiStatus}
          setSelectedAI={setSelectedAI}
          setImageStyle={setImageStyle}
          updateApiKey={updateApiKey}
        />
      )}

      {showPersonaSelector && (
        <PersonaSelector
          theme={themeColors}
          selectedPersonaKey={selectedPersonaKey}
          onSelectPersona={setSelectedPersonaKey}
          onClose={() => setShowPersonaSelector(false)}
        />
      )}

      {visionGuideActive && (
        <VisionGuideOverlay
            videoElementRef={videoElementRef}
            onScanSurroundings={handleScanSurroundings}
            onStopVisionGuide={toggleVisionGuideMode}
            isAnalyzingFrame={isAnalyzingFrame}
            theme={themeColors}
        />
      )}

      <ChatWindow messages={messages} isTyping={isTyping} theme={themeColors} darkMode={darkMode}/>

      <ChatInput
        input={input}
        isTyping={isTyping || isAnalyzingFrame} // Disable input while analyzing frame
        isListening={isListening}
        recognitionAvailable={recognitionAvailable}
        theme={themeColors}
        setInput={setInput}
        handleSend={handleSend}
        startListening={startListening}
      />
    </div>
  );
};

export default App;
