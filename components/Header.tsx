
import React from 'react';
import { Settings, Volume2, VolumeX, Sun, Moon, Download, Sparkles, Eye, Drama } from 'lucide-react';
import { ThemeColors, AIModelKey, PersonaInfo } from '../types';
import { AI_MODELS, DEFAULT_PERSONA_KEY } from '../constants';

interface HeaderProps {
  theme: ThemeColors;
  personas: Record<string, PersonaInfo>;
  soundEnabled: boolean;
  darkMode: boolean;
  showSettings: boolean;
  selectedAI: AIModelKey;
  selectedPersonaKey: string;
  showPersonaSelector: boolean;
  visionGuideActive: boolean;
  toggleSound: () => void;
  toggleDarkMode: () => void;
  exportConversation: () => void;
  toggleSettings: () => void;
  togglePersonaSelector: () => void;
  toggleVisionGuideMode: () => void;
}

const Header: React.FC<HeaderProps> = ({
  theme,
  personas,
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
  const currentPersonaInfo = personas[selectedPersonaKey] || personas[DEFAULT_PERSONA_KEY];

  return (
    <div className={`border-b dark:border-gray-700 p-3 sticky top-0 z-50 ${theme.card}`}>
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        {/* Left Side: Title and Persona */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">
              Lagos Oracle
            </h1>
            <span className={`text-xs font-medium flex items-center ${currentPersonaInfo.color || theme.text}`}>
              {currentPersonaInfo.icon}
              <span className="ml-1">{currentPersonaInfo.name.split('(')[0].trim()}</span>
            </span>
          </div>
        </div>
        
        {/* Right Side: Action Buttons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={togglePersonaSelector}
            title="Select Persona"
            className={`p-2 rounded-full transition-colors duration-200 ${showPersonaSelector ? `${currentPersonaInfo.color || theme.primaryAccent} ${(currentPersonaInfo.color || theme.primaryAccent).replace('text-','bg-')}/20` : `${theme.muted} hover:bg-gray-200 dark:hover:bg-gray-700`}`}
          >
            <Drama className="w-5 h-5" />
          </button>
          <button
            onClick={toggleVisionGuideMode}
            title={visionGuideActive ? "Stop Vision Guide" : "Activate Vision Guide"}
            className={`p-2 rounded-full transition-colors duration-200 ${visionGuideActive ? `text-green-500 bg-green-500/20` : `${theme.muted} hover:bg-gray-200 dark:hover:bg-gray-700`}`}
            aria-pressed={visionGuideActive}
          >
            <Eye className="w-5 h-5" />
          </button>
          <button onClick={toggleSettings} title="Settings"
            className={`p-2 rounded-full transition-colors duration-200 ${showSettings ? `text-cyan-500 bg-cyan-500/20` : `${theme.muted} hover:bg-gray-200 dark:hover:bg-gray-700`}`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;