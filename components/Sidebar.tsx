import React from 'react';
import { X, Volume2, VolumeX, Sun, Moon, Download, Eye, Drama, Settings as SettingsIcon } from 'lucide-react';
import { ThemeColors, AIModelKey, ImageStyleKey, ApiKeys, ApiStatus, PersonaKey } from '../types';
import SettingsPanel from './SettingsPanel';
import PersonaSelector from './PersonaSelector';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeColors;
  soundEnabled: boolean;
  darkMode: boolean;
  selectedAI: AIModelKey;
  selectedPersonaKey: PersonaKey | 'default';
  visionGuideActive: boolean;
  apiKeys: ApiKeys;
  apiStatus: ApiStatus;
  imageStyle: ImageStyleKey;
  toggleSound: () => void;
  toggleDarkMode: () => void;
  exportConversation: () => void;
  toggleVisionGuideMode: () => void;
  setSelectedAI: (model: AIModelKey) => void;
  setImageStyle: (style: ImageStyleKey) => void;
  updateApiKey: (provider: keyof ApiKeys, value: string) => void;
  setSelectedPersonaKey: (key: PersonaKey | 'default') => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  soundEnabled,
  darkMode,
  selectedAI,
  selectedPersonaKey,
  visionGuideActive,
  apiKeys,
  apiStatus,
  imageStyle,
  toggleSound,
  toggleDarkMode,
  exportConversation,
  toggleVisionGuideMode,
  setSelectedAI,
  setImageStyle,
  updateApiKey,
  setSelectedPersonaKey,
}) => {
  const [activeTab, setActiveTab] = React.useState<'settings' | 'persona'>('settings');

  return (
    <div
      className={`fixed inset-y-0 right-0 w-80 bg-[#1a1a1a] border-l border-gray-800 z-50 transform ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } transition-transform duration-300 ease-in-out flex flex-col shadow-lg`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h2 className="text-xl font-semibold text-white">Settings</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex border-b border-gray-800">
        <button
          className={`flex-1 py-3 text-center text-sm font-medium ${
            activeTab === 'settings' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('settings')}
        >
          <SettingsIcon className="inline-block w-4 h-4 mr-2" /> General
        </button>
        <button
          className={`flex-1 py-3 text-center text-sm font-medium ${
            activeTab === 'persona' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('persona')}
        >
          <Drama className="inline-block w-4 h-4 mr-2" /> Persona
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Quick Toggles */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={toggleSound} title={soundEnabled ? "Mute" : "Unmute"}
                className="p-3 rounded-lg bg-gray-700 text-white flex items-center justify-center space-x-2 hover:bg-gray-600 transition-colors">
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                <span>{soundEnabled ? "Sound On" : "Sound Off"}</span>
              </button>
              <button onClick={toggleDarkMode} title={darkMode ? "Light Mode" : "Dark Mode"}
                className="p-3 rounded-lg bg-gray-700 text-white flex items-center justify-center space-x-2 hover:bg-gray-600 transition-colors">
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                <span>{darkMode ? "Dark Mode" : "Light Mode"}</span>
              </button>
              <button onClick={exportConversation} title="Export Conversation"
                className="p-3 rounded-lg bg-gray-700 text-white flex items-center justify-center space-x-2 hover:bg-gray-600 transition-colors">
                <Download className="w-5 h-5" />
                <span>Export Chat</span>
              </button>
              <button onClick={toggleVisionGuideMode} title={visionGuideActive ? "Stop Vision Guide" : "Activate Vision Guide"}
                className={`p-3 rounded-lg text-white flex items-center justify-center space-x-2 transition-colors ${visionGuideActive ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'}`}>
                <Eye className="w-5 h-5" />
                <span>Vision Guide</span>
              </button>
            </div>

            <SettingsPanel
              selectedAI={selectedAI}
              imageStyle={imageStyle}
              apiKeys={apiKeys}
              apiStatus={apiStatus}
              setSelectedAI={setSelectedAI}
              setImageStyle={setImageStyle}
              updateApiKey={updateApiKey}
            />
          </div>
        )}

        {activeTab === 'persona' && (
          <PersonaSelector
            selectedPersonaKey={selectedPersonaKey}
            onSelectPersona={setSelectedPersonaKey}
          />
        )}
      </div>
    </div>
  );
};

export default Sidebar;

