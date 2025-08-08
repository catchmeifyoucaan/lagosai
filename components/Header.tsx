
import React from 'react';
import { Settings, Volume2, VolumeX, Sun, Moon, Download, Sparkles, Eye, Camera, Users, Drama } from 'lucide-react'; // Added Drama for Persona
import { ThemeColors, AIModelKey, AIModelInfo, PersonaKey } from '../types';
import { AI_MODELS, PERSONAS, DEFAULT_PERSONA_KEY } from '../constants';

interface HeaderProps {
  theme: ThemeColors;
  soundEnabled: boolean;
  darkMode: boolean;
  showSettings: boolean;
  selectedAI: AIModelKey;
  selectedPersonaKey: PersonaKey | 'default';
  showPersonaSelector: boolean;
  visionGuideActive: boolean; // New prop
  toggleSound: () => void;
  toggleDarkMode: () => void;
  exportConversation: () => void;
  toggleSettings: () => void;
  togglePersonaSelector: () => void;
  toggleVisionGuideMode: () => void; // New prop
}

const Header: React.FC<HeaderProps> = ({
  theme,
  soundEnabled,
  darkMode,
  showSettings,
  selectedAI,
  selectedPersonaKey,
  showPersonaSelector,
  visionGuideActive,
  toggleSound,
  toggleDarkMode,
  exportConversation,
  toggleSettings,
  togglePersonaSelector,
  toggleVisionGuideMode
}) => {
  const currentAIModelInfo = AI_MODELS[selectedAI] || AI_MODELS['auto'];
  const currentPersonaInfo = PERSONAS[selectedPersonaKey] || PERSONAS[DEFAULT_PERSONA_KEY];

  return (
    <div className={`${theme.card} border-b p-3 md:p-4 sticky top-0 z-50 shadow-sm`}>
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2 md:space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse border-2 border-slate-900 dark:border-white"></div>
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Lagos Oracle Ultra
            </h1>
            <div className="flex items-center space-x-1.5 text-xs">
              <Camera className="w-3 h-3 text-pink-400" />
              <span className={`${currentAIModelInfo.color} font-medium`}>
                {currentAIModelInfo.icon} {currentAIModelInfo.name}
              </span>
              <span className="text-gray-400">|</span>
              <span className={`${currentPersonaInfo.color || theme.text} font-medium flex items-center`}>
                {currentPersonaInfo.icon}
                <span className="ml-1 hidden sm:inline">{currentPersonaInfo.name.split('(')[0].trim()}</span>
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 md:space-x-2">
           <button
            onClick={toggleVisionGuideMode}
            title={visionGuideActive ? "Stop Vision Guide" : "Activate Vision Guide"}
            className={`p-2 rounded-lg transition-colors duration-200 ${visionGuideActive ? `${theme.primaryAccent} ${theme.primaryAccent.replace('text-','bg-')}/10` : `${theme.muted} hover:text-green-500 hover:bg-green-500/10`}`}
            aria-pressed={visionGuideActive}
            >
            <Eye className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <button
            onClick={togglePersonaSelector}
            title="Select Persona"
            className={`p-2 rounded-lg transition-colors duration-200 ${showPersonaSelector ? `${PERSONAS[selectedPersonaKey]?.color || theme.primaryAccent} ${(PERSONAS[selectedPersonaKey]?.color || theme.primaryAccent).replace('text-','bg-')}/10` : `${theme.muted} hover:text-yellow-500 hover:bg-yellow-500/10`}`}
            >
            <Drama className="w-4 h-4 md:w-5 md:h-5" /> {/* Changed from Users to Drama */}
          </button>
          <button onClick={toggleSound} title={soundEnabled ? "Mute" : "Unmute"}
            className={`p-2 rounded-lg transition-colors duration-200 ${soundEnabled ? 'text-green-400 hover:bg-green-400/10' : `${theme.muted} hover:text-gray-500 hover:bg-gray-500/10`}`}>
            {soundEnabled ? <Volume2 className="w-4 h-4 md:w-5 md:h-5" /> : <VolumeX className="w-4 h-4 md:w-5 md:h-5" />}
          </button>
          <button onClick={toggleDarkMode} title={darkMode ? "Light Mode" : "Dark Mode"}
            className={`p-2 rounded-lg ${theme.muted} hover:text-yellow-400 dark:hover:text-yellow-300 hover:bg-yellow-400/10 transition-colors duration-200`}>
            {darkMode ? <Sun className="w-4 h-4 md:w-5 md:h-5" /> : <Moon className="w-4 h-4 md:w-5 md:h-5" />}
          </button>
          <button onClick={exportConversation} title="Export Conversation"
            className={`p-2 rounded-lg ${theme.muted} hover:text-blue-400 hover:bg-blue-400/10 transition-colors duration-200`}>
            <Download className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <button onClick={toggleSettings} title="Settings"
            className={`p-2 rounded-lg transition-colors duration-200 ${showSettings ? 'text-cyan-400 bg-cyan-400/10' : `${theme.muted} hover:text-cyan-400 hover:bg-cyan-400/10`}`}>
            <Settings className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;