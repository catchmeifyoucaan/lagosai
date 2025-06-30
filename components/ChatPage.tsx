

import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import Header from './Header';
import WelcomeGuide from './WelcomeGuide';
import DownloadModal from './DownloadModal';
import VisionGuideOverlay from './VisionGuideOverlay';
import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';
import Sidebar from './Sidebar';
import LeftSidebar from './LeftSidebar';

const ChatPage: React.FC = () => {
  const {
    themeColors,
    soundEnabled,
    darkMode,
    selectedAI,
    selectedPersonaKey,
    visionGuideActive,
    toggleSound,
    toggleDarkMode,
    exportConversation,
    showWelcomeGuide,
    handleCloseWelcomeGuide,
    showDownloadModal,
    setShowDownloadModal,
    canvasElementRef,
    imageStyle,
    apiKeys,
    apiStatus,
    setSelectedAI,
    setImageStyle,
    updateApiKey,
    setSelectedPersonaKey,
    videoElementRef,
    handleScanSurroundings,
    isAnalyzingFrame,
    messages,
    isTyping,
    handleSend,
    handleRegenerate,
    input,
    isStreaming,
    isListening,
    recognitionAvailable,
    setInput,
    handleStopGenerating,
    startListening,
    isSidebarOpen,
    toggleSidebar,
    toggleVisionGuideMode,
    chats, // From AppContext
    currentChatId, // From AppContext
    startNewChat, // From AppContext
    selectChat, // From AppContext
  } = useAppContext();

  // Placeholder for chat history and selection
  const [] = React.useState<string | null>('1');

  return (
    <div className="flex h-screen bg-[#1a1a1a] text-[#e0e0e0] transition-colors duration-300 font-sans">
      {/* Left Sidebar */}
      <LeftSidebar
        onNewChat={startNewChat}
        onOpenSettings={toggleSidebar}
        chatHistory={chats}
        onSelectChat={selectChat}
        selectedChatId={currentChatId}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <Header
          theme={themeColors}
          toggleSidebar={toggleSidebar}
        />
        <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar">
          {showWelcomeGuide && <WelcomeGuide theme={themeColors} onClose={handleCloseWelcomeGuide} />}

          {showDownloadModal && <DownloadModal theme={themeColors} onClose={() => setShowDownloadModal(false)} />}

          <canvas ref={canvasElementRef} style={{ display: 'none' }} />

          {visionGuideActive && (
            <VisionGuideOverlay
              videoElementRef={videoElementRef}
              onScanSurroundings={handleScanSurroundings}
              onStopVisionGuide={toggleVisionGuideMode}
              isAnalyzingFrame={isAnalyzingFrame}
              theme={themeColors}
            />
          )}
          <ChatWindow
            messages={messages}
            isTyping={isTyping}
            darkMode={darkMode}
            handleSend={handleSend}
            handleRegenerate={handleRegenerate}
          />

          <ChatInput
            input={input}
            isTyping={isStreaming || isAnalyzingFrame}
            isListening={isListening}
            recognitionAvailable={recognitionAvailable}
            theme={themeColors}
            setInput={setInput}
            handleSend={handleSend}
            handleStopGenerating={handleStopGenerating}
            startListening={startListening}
          />
        </div>
      </div>

      {/* Right Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={toggleSidebar}
        theme={themeColors}
        soundEnabled={soundEnabled}
        darkMode={darkMode}
        selectedAI={selectedAI}
        selectedPersonaKey={selectedPersonaKey}
        visionGuideActive={visionGuideActive}
        apiKeys={apiKeys}
        apiStatus={apiStatus}
        imageStyle={imageStyle}
        toggleSound={toggleSound}
        toggleDarkMode={toggleDarkMode}
        exportConversation={exportConversation}
        toggleVisionGuideMode={toggleVisionGuideMode}
        setSelectedAI={setSelectedAI}
        setImageStyle={setImageStyle}
        updateApiKey={updateApiKey}
        setSelectedPersonaKey={setSelectedPersonaKey}
      />
    </div>
  );
};

export default ChatPage;