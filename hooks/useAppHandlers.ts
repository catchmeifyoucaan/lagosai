import { useCallback } from 'react';
import { Message, AIModelKey, ApiKeys, PersonaKey, ImageResult, ImagePart } from '../types';
import { AI_MODELS, IMAGE_STYLES, OPENAI_CHAT_MODEL, OPENAI_IMAGE_MODEL, CLAUDE_MODEL_NAME, PERSONAS, DEFAULT_PERSONA_KEY } from '../constants';
import { isGeminiClientInitialized, generateGeminiClientResponseStream } from '../services/geminiService';
import { useAppState } from './useAppState';

export const useAppHandlers = (appState: ReturnType<typeof useAppState>, inputRef: React.RefObject<HTMLInputElement>, abortControllerRef: React.MutableRefObject<AbortController | null>, videoElementRef: React.RefObject<HTMLVideoElement>, canvasElementRef: React.RefObject<HTMLCanvasElement>) => {
    const {
        messages, input, setInput, setIsTyping, setIsStreaming,
        isListening, setIsListening, setIsSpeaking, setShowSettings, selectedAI, apiKeys, setApiKeys, apiStatus, speechRecognition,
        darkMode, soundEnabled, imageStyle, selectedPersonaKey, visionGuideActive, setVisionGuideActive, cameraStream, setCameraStream, setIsAnalyzingFrame, setShowPersonaSelector,
        setShowWelcomeGuide,
        addMessageToCurrentChat, chats, currentChatId, updateMessageInCurrentChat
    } = appState;

    const speakText = useCallback((text: string) => {
        if ('speechSynthesis' in window && soundEnabled && text) {
            if (speechSynthesis.speaking) {
                speechSynthesis.cancel(); // Stop any ongoing speech
            }
            setIsSpeaking(true);

            // Clean text: remove markdown, links, and then split into sentences
            const cleanText = text.replace(/[*#`]/g, '').replace(/[[]](.*?)]\(.*?\)/g, '$1');
            // Simple sentence splitting regex. Handles common punctuation.
            const sentences = cleanText.match(/[^.!?]+[.!?]|\S+/g) || [cleanText];

            let currentUtteranceIndex = 0;

            const speakNextSentence = () => {
                if (currentUtteranceIndex < sentences.length) {
                    const sentence = sentences[currentUtteranceIndex].trim();
                    if (!sentence) { // Skip empty sentences
                        currentUtteranceIndex++;
                        speakNextSentence();
                        return;
                    }

                    const utterance = new SpeechSynthesisUtterance(sentence);
                    // Voice selection logic (Nigerian, UK, US) remains the same
                    const voices = speechSynthesis.getVoices();
                    const nigerianVoice = voices.find(voice => voice.lang.startsWith('en-NG')) ||
                        voices.find(voice => voice.name.toLowerCase().includes('nigeria'));
                    const ukVoice = voices.find(voice => voice.lang.startsWith('en-GB'));

                    utterance.voice = nigerianVoice || ukVoice || null;
                    utterance.lang = nigerianVoice ? 'en-NG' : (ukVoice ? 'en-GB' : 'en-US');
                    utterance.rate = 0.95;
                    utterance.pitch = 1;

                    utterance.onend = () => {
                        currentUtteranceIndex++;
                        speakNextSentence(); // Speak the next sentence
                    };
                    utterance.onerror = (event) => {
                        console.error("Speech synthesis error", event.error);
                        setIsSpeaking(false); // Stop speaking on error
                    };
                    speechSynthesis.speak(utterance);
                } else {
                    setIsSpeaking(false); // All sentences spoken
                }
            };

            speakNextSentence(); // Start speaking from the first sentence
        }
    }, [soundEnabled, setIsSpeaking]);

    const updateApiKey = useCallback((provider: keyof ApiKeys, value: string) => {
        setApiKeys(prev => ({ ...prev, [provider]: value.trim() }));
    }, [setApiKeys]);

    const handleCloseWelcomeGuide = useCallback(() => {
        setShowWelcomeGuide(false);
        try {
            localStorage.setItem('lagosOracleWelcomeSeen_v1', 'true');
        } catch (e) {
            console.error("Failed to save welcome seen status", e);
        }
    }, [setShowWelcomeGuide]);

    const detectQueryType = useCallback((query: string): 'visual' | 'location' | 'general' | 'sensitive_discussion' => {
        const q = query.toLowerCase();
        if (q.match(/\b(paint|draw|show|picture|image|create|generate|imagine|visualize)\b/i)) return 'visual';
        if (q.match(/\b(own lagos|who owns lagos|history of lagos|yoruba land|igbo land|political|politics|government|heritage|claims|controversy|origin of lagos)\b/i)) return 'sensitive_discussion';
        if (q.match(/\b(lagos|nigeria|street|traffic|route|lekki|ikeja|victoria island|ikoyi|ajegunle)\b/i)) return 'location';
        return 'general';
    }, []);

    const getSystemPrompt = useCallback((queryType: 'visual' | 'location' | 'general' | 'sensitive_discussion' | 'vision_guide', currentPersonaKey: PersonaKey | 'default'): string => {
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
        let coreGuidelines = `\n\n---\n**Core Operational Guidelines (How You Must Behave, My Oracle! These are CRITICAL):**\n\n1.  **Direct & Warm Communication (No Fluff!):** Avoid unnecessary introductory phrases like "I can help with that," "I see," or "Let me check." Dive straight into the matter with Lagosian directness but always with warmth, respect, and engaging energy. Your primary goal is to be immediately helpful and insightful.\n\n2.  **Comprehensive & Rich Answers (Go Deep!):** Provide full, detailed, and expansive answers. Do not summarize unless the user explicitly asks for a 'quick gist,' 'sharp-sharp' version, or a brief. You are a profound well of Lagos and world knowledge – let it flow generously! Think layers, context, and connections.\n\n3.  **Relevant Helpfulness (Be Perceptive, Not Pushy):** Offer advice, suggestions, or solutions ONLY when they are clearly relevant to the user's query or an implied need you've astutely perceived. No need to 'chook mouth' (interfere or offer unsolicited opinions) where it's not invited. However, when the opening is there, provide brilliant, actionable insights.\n\n4.  **Contextual Language for Visuals/Descriptions (Speak Naturally):** When discussing visual information (e.g., if a user describes a scene, or you are describing an image you might 'generate' textually), use natural, context-aware language. For instance, 'Based on your vivid description of that owambe...' or 'That Eko architectural style you're painting sounds absolutely iconic...'\n\n5.  **Precision, Detail & Accuracy (Your Undisputed Watchwords!):** Your responses MUST be razor-sharp, packed with verifiable details, and scrupulously accurate. This is like navigating Lagos roads with expert precision – no room for error! Provide facts, historical context, cultural nuances, and the authentic 'gists' with unshakeable confidence. Your pronouncements should carry the weight of authority.\n\n6.  **Acknowledge Uncertainty with Style (Honesty is Lagos's middle name):** If you don't know something, say so with confidence. It's better to be honest than to give wrong information. You can offer to find out or suggest alternatives.`;
        baseInstruction += coreGuidelines;
    }
    return baseInstruction;
  }, []);

    const selectBestAI = useCallback((query: string): AIModelKey => {
        const type = detectQueryType(query);
        if (apiStatus.gemini && (type !== 'visual' || !apiStatus.openai)) return 'gemini';
        if (apiStatus.openai && type === 'visual') return 'openai';
        if (apiStatus.claude && !apiStatus.gemini && !apiStatus.openai) return 'claude';
        if (type === 'visual' && apiKeys.openai) return 'openai';
        if (apiKeys.gemini) return 'gemini';
        if (apiKeys.claude) return 'claude';
        return type === 'visual' ? 'openai' : 'gemini';
    }, [apiStatus, apiKeys, detectQueryType]);

    const generateImage = useCallback(async (prompt: string): Promise<ImageResult> => {
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
                model: `DALL-E 3 (Error: ${error instanceof Error ? error.message.substring(0, 30) + '...' : 'Failed'})`,
                success: false
            };
        }
    }, [apiStatus.openai, apiKeys.openai, imageStyle]);

    const getDemoResponse = useCallback((_query: string, modelKey: AIModelKey, errorMessage?: string): string => {
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
        else if (!errorMessage && !apiStatus[modelKey as Exclude<AIModelKey, 'auto'>]) responseContent += unconfiguredMessage(modelName);
        responseContent += "\n\nIn the meantime, feel free to ask me anything else about Lagos! 😊";
        return responseContent;
    }, [selectedPersonaKey, apiStatus]);

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
                addMessageToCurrentChat({ id: Date.now(), type: 'oracle', content: `🎙️ My apologies, the voice recognition had a hiccup: ${event.error}. Please try again or type your message.`, timestamp: new Date(), mood: 'error', model: 'System Speech Recognition' });
            };
            speechRecognition.onend = () => setIsListening(false);
        }
    }, [speechRecognition, isListening, setInput, messages, setIsListening]);

    const exportConversation = useCallback(() => {
        try {
            const dataStr = JSON.stringify({
                timestamp: new Date().toISOString(),
                settings: { selectedAI, imageStyle, darkMode, soundEnabled, selectedPersonaKey },
                messages: messages.map(m => ({ ...m, timestamp: m.timestamp.toISOString() }))
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
            messages(prev => [...prev, { id: Date.now(), type: 'oracle', content: `⚠️ Export failed: ${error instanceof Error ? error.message : "Unknown error"}`, timestamp: new Date(), mood: 'error', model: 'System' }]);
        }
    }, [messages, selectedAI, imageStyle, darkMode, soundEnabled, selectedPersonaKey, setMessages]);

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
                setMessages(prev => [...prev, { id: Date.now(), type: 'oracle', content: `👁️ Vision Guide activated! Use the 'Scan Surroundings' button to describe what the camera sees.`, timestamp: new Date(), mood: 'helpful', model: 'Vision Guide System' }]);
            } catch (err) {
                console.error("Error accessing camera:", err);
                setMessages(prev => [...prev, { id: Date.now(), type: 'oracle', content: `⚠️ Camera access denied or unavailable: ${err instanceof Error ? err.message : "Please check permissions."}`,
                    timestamp: new Date(), mood: 'error', model: 'System Error'
                }]);
                setVisionGuideActive(false);
            }
        }
    }, [visionGuideActive, cameraStream, setCameraStream, setVisionGuideActive, setShowSettings, setShowPersonaSelector, setMessages, videoElementRef]);

    const handleScanSurroundings = useCallback(async () => {
        if (!videoElementRef.current || !canvasElementRef.current || !isGeminiClientInitialized()) {
            const errorMsg = !isGeminiClientInitialized() ? "Gemini API not configured for Vision Guide." : "Camera or canvas not ready.";
            setMessages(prev => [...prev, { id: Date.now(), type: 'oracle', content: `⚠️ ${errorMsg}`, timestamp: new Date(), mood: 'error', model: 'Vision Guide System' }]);
            if (soundEnabled) speakText(`Error: ${errorMsg}`);
            return;
        }
        setIsAnalyzingFrame(true);
        const video = videoElementRef.current;
        const canvas = canvasElementRef.current;
        const MAX_DIMENSION = 640;
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
        const context = canvas.getContext('2d');
        if (!context) {
            setIsAnalyzingFrame(false);
            setMessages(prev => [...prev, { id: Date.now(), type: 'oracle', content: `⚠️ Could not get canvas context for scanning.`, timestamp: new Date(), mood: 'error', model: 'Vision Guide System' }]);
            if (soundEnabled) speakText("Error: Could not get canvas context.");
            return;
        }
        context.drawImage(video, 0, 0, newWidth, newHeight);
        const base64ImageData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        const imagePart: ImagePart = { inlineData: { mimeType: 'image/jpeg', data: base64ImageData } };
        const visionPrompt = "Describe this scene for a visually impaired user. Focus on objects, potential hazards, people, text, and overall layout. Provide a concise, clear, and actionable description to help with navigation or understanding the environment.";
        const systemInstructionForVision = getSystemPrompt('vision_guide', selectedPersonaKey);
        const oracleMessageId = Date.now();
        addMessageToCurrentChat({
            id: oracleMessageId,
            type: 'oracle',
            content: 'Analyzing scene...',
            model: `${AI_MODELS.gemini.name} (Vision Guide)`,
            timestamp: new Date(),
            mood: 'helpful',
            personaKey: selectedPersonaKey
        });
        let accumulatedContent = "";
        let success = true;
        try {
            const stream = generateGeminiClientResponseStream(visionPrompt, systemInstructionForVision, [imagePart]);
            for await (const chunk of stream) {
                const chunkText = chunk.text;
                if (typeof chunkText === 'string') {
                    accumulatedContent += chunkText;
                    updateMessageInCurrentChat(oracleMessageId, { content: accumulatedContent });
                }
            }
        } catch (error) {
            console.error("Error during Vision Guide stream:", error);
            accumulatedContent = `⚠️ Vision Analysis Failed: ${error instanceof Error ? error.message : String(error)}`;
            success = false;
        }
        updateMessageInCurrentChat(oracleMessageId, {
            content: accumulatedContent,
            mood: success ? 'helpful' : 'error',
            model: `${AI_MODELS.gemini.name} (Vision Guide)`, // Ensure model is retained/updated
        });
        if (soundEnabled && accumulatedContent) {
            setTimeout(() => speakText(accumulatedContent), 300);
        }
        setIsAnalyzingFrame(false);
    }, [videoElementRef, canvasElementRef, soundEnabled, setMessages, speakText, setIsAnalyzingFrame, selectedPersonaKey, getSystemPrompt]);

    const handleStopGenerating = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsTyping(false);
            setIsStreaming(false);
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && lastMessage.type === 'oracle' && lastMessage.content.length < 20) {
                updateMessageInCurrentChat(lastMessage.id, { content: 'Generation stopped by user.', mood: 'helpful' });
            }
        }
    }, [abortControllerRef, setIsTyping, setIsStreaming, messages, updateMessageInCurrentChat]);

    const handleSend = useCallback(async (currentInputOverride?: string) => {
        const query = (typeof currentInputOverride === 'string' ? currentInputOverride : input).trim();
        if (!query) return;
        const userMessage: Message = { id: Date.now(), type: 'user', content: query, timestamp: new Date() };
        addMessageToCurrentChat(userMessage);
        if (typeof currentInputOverride !== 'string') {
            setInput('');
            inputRef.current?.focus();
        }
        setIsTyping(true);
        setIsStreaming(true);
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        let aiToUse = selectedAI === 'auto' ? selectBestAI(query) : selectedAI;
        if (aiToUse === 'auto' || !apiStatus[aiToUse]) {
            const alternativeAI = selectBestAI(query);
            if (apiStatus[alternativeAI as Exclude<AIModelKey, 'auto'>]) {
                aiToUse = alternativeAI;
            } else {
                const availableModels = (['gemini', 'openai', 'claude'] as const).filter(k => apiStatus[k]);
                aiToUse = availableModels.length > 0 ? availableModels[0] : 'gemini';
            }
        }
        const isVisualQuery = detectQueryType(query) === 'visual';
        const currentPersona = PERSONAS[selectedPersonaKey] || PERSONAS[DEFAULT_PERSONA_KEY];
        const modelDisplayName = `${AI_MODELS[aiToUse]?.name || 'AI'} (${currentPersona.name.split('(')[0].trim()})`;
        if (!apiStatus[aiToUse as Exclude<AIModelKey, 'auto'>]) {
            const errorMessage = getDemoResponse(query, aiToUse, `${AI_MODELS[aiToUse].name} API not configured. Check API key in settings.`);
            addMessageToCurrentChat({
                id: oracleMessageId,
                type: 'oracle',
                content: errorMessage,
                model: `${modelDisplayName} (Error)`, timestamp: new Date(), mood: 'error', personaKey: selectedPersonaKey
            });
            setIsTyping(false);
            setIsStreaming(false);
            return;
        }
        const oracleMessageId = Date.now() + 1;
        const systemInstruction = getSystemPrompt(detectQueryType(query), selectedPersonaKey);
        addMessageToCurrentChat({
            id: oracleMessageId,
            type: 'oracle',
            content: '',
            model: modelDisplayName,
            timestamp: new Date(),
            mood: 'helpful',
            personaKey: selectedPersonaKey
        });
        let accumulatedContent = "";
        let success = true;
        let finalModelName = modelDisplayName;
        let imageResultForStream: ImageResult | undefined = undefined;
        if (isVisualQuery && aiToUse === 'openai' && apiStatus.openai) {
            imageResultForStream = await generateImage(query);
        }
        try {
            abortControllerRef.current = new AbortController();
            if (aiToUse === 'gemini') {
                const stream = generateGeminiClientResponseStream(query, systemInstruction, []);
                for await (const chunk of stream) {
                    const chunkText = chunk.text;
                    if (typeof chunkText === 'string') {
                        accumulatedContent += chunkText;
                        setMessages(prev => prev.map(msg =>
                            msg.id === oracleMessageId ? { ...msg, content: accumulatedContent } : msg
                        ));
                    }
                }
            } else {
                const isClaude = aiToUse === 'claude';
                const url = isClaude ? 'https://api.anthropic.com/v1/messages' : 'https://api.openai.com/v1/chat/completions';
                const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                if (isClaude) {
                    headers['x-api-key'] = apiKeys.claude;
                    headers['anthropic-version'] = '2023-06-01';
                } else {
                    headers['Authorization'] = `Bearer ${apiKeys.openai}`;
                }
                const body = isClaude ? {
                    model: CLAUDE_MODEL_NAME,
                    system: systemInstruction,
                    messages: [{ role: 'user', content: query }],
                    max_tokens: 1200,
                    stream: true,
                } : {
                    model: OPENAI_CHAT_MODEL,
                    messages: [{ role: 'system', content: systemInstruction }, { role: 'user', content: query }],
                    max_tokens: 1200,
                    stream: true,
                };
                const response = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body),
                    signal: abortControllerRef.current.signal,
                });
                if (!response.ok || !response.body) {
                    const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
                    throw new Error(`${isClaude ? 'Claude' : 'OpenAI'} API Error: ${response.status} ${errorData.error?.message || response.statusText}`);
                }
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let done = false;
                while (!done) {
                    const { value, done: readerDone } = await reader.read();
                    done = readerDone;
                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n').filter(line => line.trim() !== '');
                    for (const line of lines) {
                        if (line.startsWith('data: [DONE]')) break;
                        let chunkText = '';
                        if (isClaude) {
                            if (line.startsWith('data:')) {
                                try {
                                    const json = JSON.parse(line.substring(5));
                                    if (json.type === 'content_block_delta' && json.delta.type === 'text_delta') {
                                        chunkText = json.delta.text;
                                    }
                                } catch (e) { /* ignore parse errors */ }
                            }
                        } else {
                            if (line.startsWith('data:')) {
                                try {
                                    const json = JSON.parse(line.substring(5));
                                    chunkText = json.choices?.[0]?.delta?.content || '';
                                } catch (e) { /* ignore parse errors */ }
                            }
                        }
                        if (chunkText) {
                            accumulatedContent += chunkText;
                            setMessages(prev => prev.map(msg =>
                                msg.id === oracleMessageId ? { ...msg, content: accumulatedContent, image: imageResultForStream } : msg
                            ));
                        }
                    }
                }
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                console.log("Stream generation aborted by user.");
                success = false;
                return;
            }
            console.error(`Error during ${aiToUse} stream:`, error);
            const errMessage = error instanceof Error ? error.message : String(error);
            accumulatedContent = getDemoResponse(query, aiToUse, errMessage);
            if (!accumulatedContent.trim()) {
                accumulatedContent = `An unknown error occurred with ${AI_MODELS[aiToUse].name}.`;
            }
            success = false;
            finalModelName = `${modelDisplayName} (Error)`;
        } finally {
            setIsTyping(false);
            setIsStreaming(false);
            abortControllerRef.current = null;
        }
        setMessages(prev => prev.map(msg =>
            msg.id === oracleMessageId ? {
                ...msg,
                content: accumulatedContent,
                mood: success ? 'helpful' : 'error',
                model: finalModelName,
                image: imageResultForStream
            } : msg
        ));
        if (success && soundEnabled && accumulatedContent) {
            setTimeout(() => speakText(accumulatedContent), 300);
        }
    }, [input, setInput, inputRef, abortControllerRef, setIsTyping, setIsStreaming, selectedAI, selectBestAI, apiStatus, detectQueryType, selectedPersonaKey, generateImage, getSystemPrompt, getDemoResponse, apiKeys, setMessages, soundEnabled, speakText]);

    const handleRegenerate = useCallback(() => {
        const lastUserMessage = [...messages].reverse().find(m => m.type === 'user');
        if (lastUserMessage) {
            // Remove the last Oracle message (if any) before regenerating
            const currentChat = chats.find(chat => chat.id === currentChatId);
            if (currentChat) {
                const lastOracleIndex = currentChat.messages.map(m => m.type).lastIndexOf('oracle');
                if (lastOracleIndex > -1) {
                    const updatedMessages = currentChat.messages.slice(0, lastOracleIndex);
                    updateMessageInCurrentChat(currentChat.id, { messages: updatedMessages });
                }
            }
            handleSend(lastUserMessage.content);
        }
    }, [messages, chats, currentChatId, updateMessageInCurrentChat, handleSend]);

    return {
        speakText,
        updateApiKey,
        handleCloseWelcomeGuide,
        detectQueryType,
        getSystemPrompt,
        selectBestAI,
        generateImage,
        getDemoResponse,
        startListening,
        exportConversation,
        toggleVisionGuideMode,
        handleScanSurroundings,
        handleStopGenerating,
        handleSend,
        handleRegenerate,
    };
};