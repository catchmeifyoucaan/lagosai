
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, AIModelKey, ImageStyleKey, ApiKeys, ApiStatus, ThemeColors, AIServiceResponse, MediaResult, PersonaKey, ImagePart, Conversation, StoredMessage } from './types';
import { AI_MODELS, IMAGE_STYLES, OPENAI_CHAT_MODEL, OPENAI_IMAGE_MODEL, CLAUDE_MODEL_NAME, PERSONAS, DEFAULT_PERSONA_KEY, GEMINI_MODEL_NAME } from './constants';
import { initializeGeminiClient, isGeminiClientInitialized, generateGeminiClientResponse, generateGeminiClientResponseStream, generateImageWithImagen, generateVideoWithVeo } from './services/geminiService';

import SettingsPanel from './components/SettingsPanel';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import PersonaSelector from './components/PersonaSelector';
import VisionGuideOverlay from './components/VisionGuideOverlay';
import Sidebar from './components/Sidebar';
import LibraryPanel from './components/LibraryPanel';
import SearchPanel from './components/SearchPanel';
// Header intentionally not used; controls are in Sidebar
import { subscribeAuth } from './services/firebase';
const Onboarding = React.lazy(() => import('./components/Onboarding'));
const firebaseModule = import('./services/firebase');
import { db } from './services/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc, serverTimestamp, getDocs } from 'firebase/firestore';

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
const LOCAL_STORAGE_CONVERSATIONS = 'lagosOracleConversations_v1';
const LOCAL_STORAGE_CURRENT_CONV_ID = 'lagosOracleCurrentConversationId_v1';


const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
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
  const [showSearch, setShowSearch] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_CONVERSATIONS);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Conversation[];
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  });
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(() => {
    try { return localStorage.getItem(LOCAL_STORAGE_CURRENT_CONV_ID); } catch { return null; }
  });
  const [user, setUser] = useState<any | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(true);
  const lastSyncedMessagesRef = React.useRef<string>('');
  const saveTimerRef = React.useRef<number | null>(null);

  useEffect(() => {
    // If a persisted Firebase user already exists (e.g., after redirect), close onboarding early
    try {
      const hasAuth = !!(window.localStorage.getItem('firebase:authUser') || window.localStorage.getItem('firebase:AuthUser'));
      if (hasAuth) setShowOnboarding(false);
    } catch {}
  }, []);

  // Auth listener
  useEffect(() => {
    const unsub = subscribeAuth(u => {
      setUser(u);
      // Hide onboarding if already signed in
      setShowOnboarding(!u);
    });
    return () => unsub();
  }, []);

  // Firestore realtime sync for conversations when authenticated
  useEffect(() => {
    if (!user) return;
    const uid = user.uid as string;
    const convsCol = collection(db, 'users', uid, 'conversations');
    const metaDoc = doc(db, 'users', uid, 'meta');

    let initialLoaded = false;

    const unsubConvs = onSnapshot(convsCol, async (snapshot) => {
      const remoteConvs: Conversation[] = snapshot.docs.map(ds => {
        const d = ds.data() as any;
        return {
          id: ds.id,
          title: d.title || 'New chat',
          timestamp: d.timestamp || new Date().toISOString(),
          personaKey: d.personaKey || selectedPersonaKey,
          messages: Array.isArray(d.messages) ? d.messages : []
        };
      }).sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));

      // If first load and no remote data, migrate local to remote (one-time)
      if (!initialLoaded) {
        initialLoaded = true;
        if (remoteConvs.length === 0 && conversations.length > 0) {
          // migrate local conversations to Firestore
          for (const c of conversations) {
            await setDoc(doc(db, 'users', uid, 'conversations', c.id), {
              title: c.title,
              timestamp: c.timestamp,
              personaKey: c.personaKey,
              messages: c.messages,
              updatedAt: serverTimestamp()
            }, { merge: true });
          }
          await setDoc(metaDoc, { currentConversationId: currentConversationId || conversations[0]?.id || null }, { merge: true });
          return; // wait for next snapshot after migration
        }
      }

      setConversations(remoteConvs);
      try { localStorage.setItem(LOCAL_STORAGE_CONVERSATIONS, JSON.stringify(remoteConvs)); } catch {}

      // Hydrate current conversation messages from remote
      const activeId = currentConversationId || remoteConvs[0]?.id || null;
      if (activeId) {
        const active = remoteConvs.find(c => c.id === activeId);
        if (active) {
          const json = JSON.stringify(active.messages || []);
          lastSyncedMessagesRef.current = json;
          const hydrated: Message[] = (active.messages || []).map(sm => ({ ...sm, timestamp: new Date(sm.timestamp) }));
          setMessages(hydrated);
          if (currentConversationId !== activeId) {
            setCurrentConversationId(activeId);
            try { localStorage.setItem(LOCAL_STORAGE_CURRENT_CONV_ID, activeId); } catch {}
          }
        }
      }
    });

    const unsubMeta = onSnapshot(metaDoc, (ds) => {
      const d = ds.data() as any;
      if (d && d.currentConversationId && d.currentConversationId !== currentConversationId) {
        setCurrentConversationId(d.currentConversationId);
        try { localStorage.setItem(LOCAL_STORAGE_CURRENT_CONV_ID, d.currentConversationId); } catch {}
      }
    });

    return () => { unsubConvs(); unsubMeta(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Ensure there is a current conversation on first load
  useEffect(() => {
    if (!currentConversationId) {
      const newId = `${Date.now()}`;
      const newConv: Conversation = {
        id: newId,
        title: 'New chat',
        timestamp: new Date().toISOString(),
        personaKey: selectedPersonaKey,
        messages: []
      };
      setConversations(prev => {
        const updated = [newConv, ...prev];
        try { localStorage.setItem(LOCAL_STORAGE_CONVERSATIONS, JSON.stringify(updated)); } catch {}
        return updated;
      });
      setCurrentConversationId(newId);
      try { localStorage.setItem(LOCAL_STORAGE_CURRENT_CONV_ID, newId); } catch {}
      setMessages([]);
    } else {
      const conv = conversations.find(c => c.id === currentConversationId);
      if (conv) {
        // hydrate messages
        const hydrated: Message[] = conv.messages.map(sm => ({
          ...sm,
          timestamp: new Date(sm.timestamp)
        }));
        setMessages(hydrated);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update current conversation persona if persona changes
  useEffect(() => {
    if (!currentConversationId) return;
    setConversations(prev => {
      const updated = prev.map(c => c.id === currentConversationId ? { ...c, personaKey: selectedPersonaKey } : c);
      try { localStorage.setItem(LOCAL_STORAGE_CONVERSATIONS, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, [selectedPersonaKey, currentConversationId]);

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

  const toggleSettings = () => {
    setShowSettings(s => !s);
    setShowPersonaSelector(false);
    setShowSearch(false);
    setShowLibrary(false);
  };

  const togglePersonaSelector = () => {
    setShowPersonaSelector(s => !s);
    setShowSettings(false);
    setShowSearch(false);
    setShowLibrary(false);
  };

  const toggleSearch = () => {
    setShowSearch(s => !s);
    setShowSettings(false);
    setShowPersonaSelector(false);
    setShowLibrary(false);
  };

  const toggleLibrary = () => {
    setShowLibrary(s => !s);
    setShowSettings(false);
    setShowPersonaSelector(false);
    setShowSearch(false);
  };

  const startNewConversation = () => {
    const newId = `${Date.now()}`;
    const newConv: Conversation = {
      id: newId,
      title: 'New chat',
      timestamp: new Date().toISOString(),
      personaKey: selectedPersonaKey,
      messages: []
    };
    setConversations(prev => {
      const updated = [newConv, ...prev];
      try { localStorage.setItem(LOCAL_STORAGE_CONVERSATIONS, JSON.stringify(updated)); } catch {}
      return updated;
    });
    setCurrentConversationId(newId);
    try { localStorage.setItem(LOCAL_STORAGE_CURRENT_CONV_ID, newId); } catch {}
    setMessages([]);
    // Firestore
    if (user) {
      const uid = user.uid as string;
      setDoc(doc(db, 'users', uid, 'conversations', newId), {
        title: 'New chat', timestamp: new Date().toISOString(), personaKey: selectedPersonaKey, messages: [], updatedAt: serverTimestamp()
      }, { merge: true });
      setDoc(doc(db, 'users', uid, 'meta'), { currentConversationId: newId }, { merge: true });
    }
  };

  const loadConversation = (conv: Conversation) => {
    setCurrentConversationId(conv.id);
    try { localStorage.setItem(LOCAL_STORAGE_CURRENT_CONV_ID, conv.id); } catch {}
    const hydrated: Message[] = conv.messages.map(sm => ({ ...sm, timestamp: new Date(sm.timestamp) }));
    setMessages(hydrated);
    setShowLibrary(false);
    setShowSearch(false);
    if (user) {
      const uid = user.uid as string;
      setDoc(doc(db, 'users', uid, 'meta'), { currentConversationId: conv.id }, { merge: true });
    }
  };

  const deleteConversation = (conversationId: string) => {
    setConversations(prev => {
      const updated = prev.filter(c => c.id !== conversationId);
      try { localStorage.setItem(LOCAL_STORAGE_CONVERSATIONS, JSON.stringify(updated)); } catch {}
      return updated;
    });
    if (currentConversationId === conversationId) {
      startNewConversation();
    }
    if (user) {
      const uid = user.uid as string;
      deleteDoc(doc(db, 'users', uid, 'conversations', conversationId)).catch(()=>{});
    }
  };

  const exportLibrary = () => {
    try {
      const dataStr = JSON.stringify({
        conversations,
        currentConversationId,
        version: 1
      }, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `lagos-oracle-library-${Date.now()}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export library failed', e);
    }
  };

  const importLibrary = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as { conversations: Conversation[]; currentConversationId?: string };
      if (!Array.isArray(parsed.conversations)) throw new Error('Invalid file');
      setConversations(parsed.conversations);
      try { localStorage.setItem(LOCAL_STORAGE_CONVERSATIONS, JSON.stringify(parsed.conversations)); } catch {}
      if (parsed.currentConversationId && parsed.conversations.some(c => c.id === parsed.currentConversationId)) {
        setCurrentConversationId(parsed.currentConversationId);
        try { localStorage.setItem(LOCAL_STORAGE_CURRENT_CONV_ID, parsed.currentConversationId); } catch {}
        const conv = parsed.conversations.find(c => c.id === parsed.currentConversationId)!;
        const hydrated: Message[] = conv.messages.map(sm => ({ ...sm, timestamp: new Date(sm.timestamp) }));
        setMessages(hydrated);
      } else if (parsed.conversations.length) {
        loadConversation(parsed.conversations[0]);
      } else {
        startNewConversation();
      }
    } catch (e) {
      console.error('Import library failed', e);
    }
  };

  const renameCurrentConversation = () => {
    if (!currentConversationId) return;
    const title = prompt('Rename conversation to:', conversations.find(c => c.id === currentConversationId)?.title || '');
    if (title == null) return;
    setConversations(prev => {
      const updated = prev.map(c => c.id === currentConversationId ? { ...c, title: title.trim() || c.title } : c);
      try { localStorage.setItem(LOCAL_STORAGE_CONVERSATIONS, JSON.stringify(updated)); } catch {}
      return updated;
    });
    if (user) {
      const uid = user.uid as string;
      updateDoc(doc(db, 'users', uid, 'conversations', currentConversationId), { title: title.trim() || 'New chat', updatedAt: serverTimestamp() }).catch(()=>{});
    }
  };

  const shareCurrentConversation = async () => {
    if (!currentConversationId) return;
    try {
      const conv = conversations.find(c => c.id === currentConversationId);
      if (!conv) return;
      const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
      const payload = {
        title: conv.title,
        timestamp: conv.timestamp,
        personaKey: conv.personaKey,
        messages: conv.messages,
        // read-only snapshot
      };
      await setDoc(doc(db, 'shared', token), payload, { merge: true });
      const url = `${window.location.origin}/#/share/${token}`;
      await navigator.clipboard.writeText(url);
      setMessages(prev => [...prev, { id: Date.now(), type: 'oracle', content: `🔗 Share link copied to clipboard:\n${url}`, timestamp: new Date(), mood: 'helpful', model: 'System' }]);
    } catch (e) {
      console.error('Share failed', e);
      setMessages(prev => [...prev, { id: Date.now(), type: 'oracle', content: `⚠️ Failed to create share link.`, timestamp: new Date(), mood: 'error', model: 'System' }]);
    }
  };

  // Persist messages to the current conversation whenever messages change
  useEffect(() => {
    if (!currentConversationId) return;
    setConversations(prev => {
      const idx = prev.findIndex(c => c.id === currentConversationId);
      if (idx === -1) return prev;
      const title = messages.find(m => m.type === 'user')?.content?.slice(0, 60) || 'New chat';
      const storedMessages: StoredMessage[] = messages.map(m => ({ ...m, timestamp: m.timestamp.toISOString() }));
      const updatedConv: Conversation = { ...prev[idx], title, messages: storedMessages, timestamp: prev[idx].timestamp || new Date().toISOString(), personaKey: selectedPersonaKey };
      const updated = [...prev];
      updated[idx] = updatedConv;
      try { localStorage.setItem(LOCAL_STORAGE_CONVERSATIONS, JSON.stringify(updated)); } catch {}
      return updated;
    });
    // Firestore debounced write
    if (user) {
      const uid = user.uid as string;
      const storedMessages: StoredMessage[] = messages.map(m => ({ ...m, timestamp: m.timestamp.toISOString() }));
      const json = JSON.stringify(storedMessages);
      if (json === lastSyncedMessagesRef.current) return;
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => {
        setDoc(doc(db, 'users', uid, 'conversations', currentConversationId), {
          title: messages.find(m => m.type === 'user')?.content?.slice(0, 60) || 'New chat',
          timestamp: new Date().toISOString(),
          personaKey: selectedPersonaKey,
          messages: storedMessages,
          updatedAt: serverTimestamp()
        }, { merge: true }).then(() => {
          lastSyncedMessagesRef.current = json;
          setDoc(doc(db, 'users', uid, 'meta'), { currentConversationId }, { merge: true }).catch(()=>{});
        }).catch(()=>{});
      }, 800);
    }
  }, [messages, currentConversationId, selectedPersonaKey]);

  const detectQueryType = (query: string): 'visual' | 'video' | 'location' | 'general' | 'sensitive_discussion' => {
    const q = query.toLowerCase();
    if (q.match(/\b(video|animate|movie|clip)\b/i)) return 'video';
    if (q.match(/\b(paint|draw|show|picture|image|create|generate|imagine|visualize)\b/i)) return 'visual';
    if (q.match(/\b(own lagos|who owns lagos|history of lagos|yoruba land|igbo land|political|politics|government|heritage|claims|controversy|origin of lagos)\b/i)) return 'sensitive_discussion';
    if (q.match(/\b(lagos|nigeria|street|traffic|route|lekki|ikeja|victoria island|ikoyi|ajegunle)\b/i)) return 'location';
    return 'general';
  };

  const getSystemPrompt = (queryType: 'visual' | 'video' | 'location' | 'general' | 'sensitive_discussion' | 'vision_guide', currentPersonaKey: PersonaKey | 'default'): string => {
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
    }
    setIsTyping(true);

    const queryType = detectQueryType(query);

    if (queryType === 'visual' || queryType === 'video') {
      const oracleMessageId = Date.now() + 1;
      setMessages(prev => [...prev, {
        id: oracleMessageId,
        type: 'oracle',
        content: `🎨 Generating your ${queryType}...`,
        model: 'Lagos Oracle Creative Engine',
        timestamp: new Date(),
        mood: 'helpful',
        personaKey: selectedPersonaKey
      }]);

      try {
        let mediaResult: MediaResult;
        if (queryType === 'video') {
          const video = await generateVideoWithVeo(query);
          mediaResult = { videoUrl: video.uri, model: 'Veo 3', success: true };
        } else {
          const image = await generateImageWithImagen(query);
          mediaResult = { imageUrl: image.generatedImages[0].image.url, model: 'Imagen 4', success: true };
        }
        setMessages(prev => prev.map(msg =>
          msg.id === oracleMessageId ? { ...msg, content: `Here is the ${queryType} you requested.`, media: mediaResult } : msg
        ));
      } catch (error) {
        console.error(`Error during ${queryType} generation:`, error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        setMessages(prev => prev.map(msg =>
          msg.id === oracleMessageId ? { ...msg, content: `⚠️ Sorry, I couldn't generate the ${queryType}. Reason: ${errorMessage}`, mood: 'error' } : msg
        ));
      }
      setIsTyping(false);
      return;
    }

    // Standard text-based chat flow
    let aiToUse = selectedAI === 'auto' ? selectBestAI(query) : selectedAI;
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

      try {
        const stream = generateGeminiClientResponseStream(query, systemInstruction);
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
            model: finalModelName
        } : msg
      ));

      if (success && soundEnabled && accumulatedContent) {
        setTimeout(() => speakText(accumulatedContent), 300);
      }
      setIsTyping(false);
      return;
    }

    // Non-streaming path for OpenAI, Claude
    const aiResult = await callAI(query, aiToUse, selectedPersonaKey);

    const oracleMessage: Message = {
      id: Date.now() + 1,
      type: 'oracle',
      content: aiResult.content,
      model: aiResult.model,
      timestamp: new Date(),
      mood: aiResult.success ? 'helpful' : 'error',
      personaKey: selectedPersonaKey
    };

    setMessages(prev => [...prev, oracleMessage]);
    setIsTyping(false);

    if (aiResult.success && soundEnabled && aiResult.content) {
      setTimeout(() => speakText(aiResult.content), 300);
    }
  }, [input, selectedAI, selectBestAI, apiStatus, imageStyle, soundEnabled, speakText, apiKeys.openai, selectedPersonaKey, apiKeys.gemini, apiKeys.claude]);


  const themeColors: ThemeColors = darkMode ? {
    bg: 'bg-gray-800',
    card: 'bg-gray-900',
    text: 'text-gray-100',
    muted: 'text-gray-400',
    input: 'bg-gray-700 text-gray-50 placeholder-gray-400',
    primaryAccent: 'text-blue-400',
    secondaryAccent: 'text-indigo-400',
  } : {
    bg: 'bg-gray-100',
    card: 'bg-white',
    text: 'text-gray-800',
    muted: 'text-gray-500',
    input: 'bg-gray-200 text-gray-900 placeholder-gray-500',
    primaryAccent: 'text-blue-600',
    secondaryAccent: 'text-indigo-600',
  };

  return (
    <div className={`flex h-screen ${themeColors.bg} ${themeColors.text} transition-colors duration-300 font-sans overflow-hidden`}>
      <Sidebar
        theme={themeColors}
        showSettings={showSettings}
        toggleSettings={toggleSettings}
        showPersonaSelector={showPersonaSelector}
        togglePersonaSelector={togglePersonaSelector}
        onNewChat={startNewConversation}
        showSearch={showSearch}
        showLibrary={showLibrary}
        toggleSearch={toggleSearch}
        toggleLibrary={toggleLibrary}
        onExportLibrary={exportLibrary}
        onImportLibrary={importLibrary}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Main chat area */}
                <ChatWindow
           messages={messages}
           isTyping={isTyping}
           theme={themeColors}
           personas={PERSONAS}
           onPromptClick={(prompt) => handleSend(prompt)}
         />

        <ChatInput
          input={input}
          isTyping={isTyping || isAnalyzingFrame} // Disable input while analyzing frame
          isListening={isListening}
          recognitionAvailable={recognitionAvailable}
          theme={themeColors}
          selectedAI={selectedAI}
          setInput={setInput}
          handleSend={handleSend}
          startListening={startListening}
          setSelectedAI={setSelectedAI}
        />

        {/* Modals and Overlays will go here, potentially managed differently */}
        {showOnboarding && (
          <React.Suspense fallback={null}>
            <Onboarding theme={themeColors} onClose={() => setShowOnboarding(false)} />
          </React.Suspense>
        )}
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
            darkMode={darkMode}
            soundEnabled={soundEnabled}
            toggleDarkMode={() => setDarkMode(d => !d)}
            toggleSound={() => setSoundEnabled(s => !s)}
            onClose={() => setShowSettings(false)}
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

        {showLibrary && (
          <LibraryPanel
            theme={themeColors}
            conversations={conversations}
            onLoad={loadConversation}
            onDelete={deleteConversation}
            onRename={(id) => { if (id === currentConversationId) { renameCurrentConversation(); } else { const title = prompt('Rename conversation to:', conversations.find(c=>c.id===id)?.title || ''); if (title!=null) setConversations(prev => { const updated = prev.map(c => c.id === id ? { ...c, title: title.trim() || c.title } : c); try { localStorage.setItem(LOCAL_STORAGE_CONVERSATIONS, JSON.stringify(updated)); } catch {} return updated; }); } }}
            onClose={() => setShowLibrary(false)}
          />
        )}

        {showSearch && (
          <SearchPanel
            theme={themeColors}
            conversations={conversations}
            currentMessages={messages}
            onOpenConversation={loadConversation}
            onClose={() => setShowSearch(false)}
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
        <canvas ref={canvasElementRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default App;
