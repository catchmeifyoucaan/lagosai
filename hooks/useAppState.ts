import { useState, useEffect, useCallback } from 'react';
import { Message, AIModelKey, ImageStyleKey, ApiKeys, ApiStatus, PersonaKey, Chat } from '../types';
import { INITIAL_MESSAGES_WELCOME, PERSONAS, DEFAULT_PERSONA_KEY } from '../constants';
import { initializeGeminiClient } from '../services/geminiService';
import { v4 as uuidv4 } from 'uuid';

const LOCAL_STORAGE_API_KEYS = 'lagosOracleApiKeys_v2';
const LOCAL_STORAGE_DARK_MODE = 'darkModeLagosOracle';
const LOCAL_STORAGE_SOUND_ENABLED = 'soundEnabledLagosOracle';
const LOCAL_STORAGE_SELECTED_PERSONA = 'selectedPersonaLagosOracle_v1';
const LOCAL_STORAGE_CHATS = 'lagosOracleChats_v2'; // New local storage key
const LOCAL_STORAGE_WELCOME_SEEN = 'lagosOracleWelcomeSeen_v1';

// Example: import.meta.env.VITE_OPENAI_API_KEY
const getEnvVar = (key: string): string | undefined => {
  const viteKey = `VITE_${key}`;
  if (import.meta.env[viteKey]) {
    return import.meta.env[viteKey] as string;
  }
  // Fallback for non-prefixed keys, though less common in Vite for public env vars
  if (import.meta.env[key]) {
    return import.meta.env[key] as string;
  }
  return undefined;
};

export const useAppState = () => {
    const [chats, setChats] = useState<Chat[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [chatHistoryLoaded, setChatHistoryLoaded] = useState(false);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
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
    const [showWelcomeGuide, setShowWelcomeGuide] = useState(() => {
        try {
            const welcomeSeen = localStorage.getItem(LOCAL_STORAGE_WELCOME_SEEN);
            return !welcomeSeen;
        } catch { return true; }
    });
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [visionGuideActive, setVisionGuideActive] = useState(false);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [isAnalyzingFrame, setIsAnalyzingFrame] = useState(false);

    // Derived state for current messages
    const messages = useMemo(() => {
        const currentChat = chats.find(chat => chat.id === currentChatId);
        return currentChat ? currentChat.messages : [];
    }, [chats, currentChatId]);

    // Function to start a new chat
    const startNewChat = useCallback(() => {
        const newChat: Chat = {
            id: uuidv4(),
            title: `New Chat ${chats.length + 1}`,
            messages: [INITIAL_MESSAGES_WELCOME],
        };
        setChats(prevChats => [newChat, ...prevChats]);
        setCurrentChatId(newChat.id);
    }, [chats.length]);

    // Function to select a chat
    const selectChat = useCallback((id: string) => {
        setCurrentChatId(id);
    }, []);

    // Function to add a message to the current chat
    const addMessageToCurrentChat = useCallback((message: Message) => {
        setChats(prevChats => prevChats.map(chat =>
            chat.id === currentChatId
                ? { ...chat, messages: [...chat.messages, message] }
                : chat
        ));
    }, [currentChatId]);

    // Function to update a message in the current chat
    const updateMessageInCurrentChat = useCallback((messageId: number, updatedFields: Partial<Message>) => {
        setChats(prevChats => prevChats.map(chat =>
            chat.id === currentChatId
                ? { ...chat, messages: chat.messages.map(msg =>
                    msg.id === messageId ? { ...msg, ...updatedFields } : msg
                  ) }
                : chat
        ));
    }, [currentChatId]);

    // Effect for loading chats and setting chatHistoryLoaded
    useEffect(() => {
        try {
            const savedChats = localStorage.getItem(LOCAL_STORAGE_CHATS);
            if (savedChats) {
                const parsedChats: Chat[] = JSON.parse(savedChats).map((chat: any) => ({
                    ...chat,
                    messages: chat.messages.map((msg: any) => ({
                        ...msg,
                        timestamp: new Date(msg.timestamp)
                    }))
                }));
                setChats(parsedChats);
                if (parsedChats.length > 0) {
                    setCurrentChatId(parsedChats[0].id); // Select the most recent chat
                } else {
                    startNewChat(); // Start a new chat if no saved chats
                }
            } else {
                startNewChat(); // Start a new chat if no saved chats
            }
        } catch (error) {
            console.error("Failed to load chats from localStorage.", error);
            startNewChat(); // Fallback to new chat on error
        }
        setChatHistoryLoaded(true);
    }, []); // Empty dependency array for initial load

    // Effect for saving chats
    useEffect(() => {
        if (chatHistoryLoaded) {
            try { localStorage.setItem(LOCAL_STORAGE_CHATS, JSON.stringify(chats)); } catch (e) { console.error("Failed to save chats to localStorage", e); }
        }
    }, [chats, chatHistoryLoaded]);

    // Effect for dark mode persistence
    useEffect(() => {
        try { localStorage.setItem(LOCAL_STORAGE_DARK_MODE, JSON.stringify(darkMode)); } catch (e) { console.error("Failed to save dark mode to localStorage", e) }
        document.documentElement.classList.toggle('dark', darkMode);
    }, [darkMode]);

    // Effect for sound enabled persistence
    useEffect(() => {
        try { localStorage.setItem(LOCAL_STORAGE_SOUND_ENABLED, JSON.stringify(soundEnabled)); } catch (e) { console.error("Failed to save sound setting to localStorage", e) }
    }, [soundEnabled]);

    // Effect for selected persona persistence
    useEffect(() => {
        try { localStorage.setItem(LOCAL_STORAGE_SELECTED_PERSONA, selectedPersonaKey); } catch (e) { console.error("Failed to save persona to localStorage", e) }
    }, [selectedPersonaKey]);

    // Effect for API keys persistence and initialization
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
    }, []); // Empty dependency array for initial load

    // Effect for API status update
    useEffect(() => {
        try { localStorage.setItem(LOCAL_STORAGE_API_KEYS, JSON.stringify(apiKeys)); } catch (e) { console.error("Failed to save API keys to localStorage", e) }

        const geminiInitialized = initializeGeminiClient(apiKeys.gemini);

        setApiStatus({
            openai: !!(apiKeys.openai && (apiKeys.openai.startsWith('sk-') || apiKeys.openai.startsWith('sk-proj-'))),
            gemini: geminiInitialized,
            claude: !!(apiKeys.claude && (apiKeys.claude.startsWith('sk-ant-') || apiKeys.claude.length > 30))
        });
    }, [apiKeys]);

    // Effect for auto-opening settings
    useEffect(() => {
        if (chatHistoryLoaded && !apiStatus.openai && !apiStatus.gemini && !apiStatus.claude && !showWelcomeGuide) {
            setShowSettings(true);
        }
    }, [chatHistoryLoaded, apiStatus, showWelcomeGuide]);

    return {
        messages, input, setInput, isTyping, setIsTyping, isStreaming, setIsStreaming,
        isListening, setIsListening, isSpeaking, setIsSpeaking, showSettings, setShowSettings,
        selectedAI, setSelectedAI, apiKeys, setApiKeys, apiStatus, setApiStatus, speechRecognition, setSpeechRecognition,
        recognitionAvailable, darkMode, setDarkMode, soundEnabled, setSoundEnabled, imageStyle, setImageStyle,
        selectedPersonaKey, setSelectedPersonaKey, showPersonaSelector, setShowPersonaSelector,
        showWelcomeGuide, setShowWelcomeGuide, showDownloadModal, setShowDownloadModal, visionGuideActive, setVisionGuideActive,
        cameraStream, setCameraStream, isAnalyzingFrame, setIsAnalyzingFrame,
        chats, currentChatId, startNewChat, selectChat, addMessageToCurrentChat, updateMessageInCurrentChat
    };
};