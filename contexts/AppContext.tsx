import React from 'react';
import { useRef, useMemo, createContext, useContext, useCallback, useState } from 'react';
import { ThemeColors } from '../types';
import { useAppState } from '../hooks/useAppState';
import { useAppHandlers } from '../hooks/useAppHandlers';
import { Chat, Message } from '../types';

// Define the shape of the context
interface AppContextType extends ReturnType<typeof useAppState>, ReturnType<typeof useAppHandlers> {
    inputRef: React.RefObject<HTMLInputElement>;
    abortControllerRef: React.MutableRefObject<AbortController | null>;
    videoElementRef: React.RefObject<HTMLVideoElement | null>;
    canvasElementRef: React.RefObject<HTMLCanvasElement | null>;
    themeColors: ThemeColors;
    toggleSound: () => void;
    toggleDarkMode: () => void;
    toggleDownloadModal: () => void;
    isSidebarOpen: boolean; // New state for sidebar
    toggleSidebar: () => void; // New handler for sidebar
    toggleVisionGuideMode: () => Promise<void>;
    chats: Chat[];
    currentChatId: string | null;
    startNewChat: () => void;
    selectChat: (id: string) => void;
    addMessageToCurrentChat: (message: Message) => void;
    updateMessageInCurrentChat: (messageId: number, updatedFields: Partial<Message>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error("useAppContext must be used within an AppProvider");
    }
    return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const inputRef = useRef<HTMLInputElement>(document.createElement('input')) as React.RefObject<HTMLInputElement>;
    const abortControllerRef = useRef<AbortController | null>(null);
    const videoElementRef = useRef<HTMLVideoElement>(document.createElement('video')) as React.RefObject<HTMLVideoElement>;
    const canvasElementRef = useRef<HTMLCanvasElement>(document.createElement('canvas')) as React.RefObject<HTMLCanvasElement>;

    const appState = useAppState();
    const appHandlers = useAppHandlers(appState, inputRef, abortControllerRef, videoElementRef, canvasElementRef);

    const { setDarkMode, setSoundEnabled, setShowDownloadModal, setShowSettings, setShowPersonaSelector } = appState;

    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for sidebar visibility

    const themeColors: ThemeColors = useMemo(() => ({
        bg: 'bg-[#1a1a1a]',
        card: 'bg-gray-800',
        text: 'text-white',
        muted: 'text-gray-400',
        input: 'bg-gray-700 border-gray-600 text-white placeholder-gray-400',
        primaryAccent: 'text-blue-400',
        secondaryAccent: 'text-purple-400',
    }), []); // No dependency on darkMode, as we are forcing dark theme

    const toggleSound = useCallback(() => setSoundEnabled(s => !s), [setSoundEnabled]);
    const toggleDarkMode = useCallback(() => setDarkMode(d => !d), [setDarkMode]);
    const toggleDownloadModal = useCallback(() => setShowDownloadModal(s => !s), [setShowDownloadModal]);
    const toggleSidebar = useCallback(() => {
        setIsSidebarOpen(s => !s);
        // Close other modals/panels when sidebar opens
        if (!isSidebarOpen) {
            setShowDownloadModal(false);
            setShowSettings(false);
            setShowPersonaSelector(false);
        }
    }, [isSidebarOpen, setShowDownloadModal, setShowSettings, setShowPersonaSelector]);

    const appContextValue: AppContextType = useMemo(() => ({
        ...appState,
        ...appHandlers,
        inputRef,
        abortControllerRef,
        videoElementRef,
        canvasElementRef,
        themeColors,
        toggleSound,
        toggleDarkMode,
        toggleDownloadModal,
        isSidebarOpen,
        toggleSidebar,
        toggleVisionGuideMode: appHandlers.toggleVisionGuideMode,
        chats: appState.chats,
        currentChatId: appState.currentChatId,
        startNewChat: appState.startNewChat,
        selectChat: appState.selectChat,
        addMessageToCurrentChat: appState.addMessageToCurrentChat,
        updateMessageInCurrentChat: appState.updateMessageInCurrentChat,
    }), [appState, appHandlers, themeColors, toggleSound, toggleDarkMode, toggleDownloadModal, isSidebarOpen, toggleSidebar, appHandlers.toggleVisionGuideMode]);

    return (
        <AppContext.Provider value={appContextValue}>
            {children}
        </AppContext.Provider>
    );
};