
import React from 'react';
import { ThemeColors, AIModelKey, ImageStyleKey, ApiKeys, ApiStatus } from '../types';
import { AI_MODELS, IMAGE_STYLES } from '../constants';
import { Sun, Moon, Volume2, VolumeX } from 'lucide-react';

interface SettingsPanelProps {
  theme: ThemeColors;
  selectedAI: AIModelKey;
  imageStyle: ImageStyleKey;
  apiKeys: ApiKeys;
  apiStatus: ApiStatus;
  darkMode: boolean;
  soundEnabled: boolean;
  setSelectedAI: (model: AIModelKey) => void;
  setImageStyle: (style: ImageStyleKey) => void;
  updateApiKey: (provider: keyof ApiKeys, value: string) => void;
  toggleDarkMode: () => void;
  toggleSound: () => void;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  theme,
  selectedAI,
  imageStyle,
  apiKeys,
  apiStatus,
  darkMode,
  soundEnabled,
  setSelectedAI,
  setImageStyle,
  updateApiKey,
  toggleDarkMode,
  toggleSound,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`${theme.card} rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col`} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold">Settings</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">&times;</button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          {/* Appearance Section */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Appearance</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="darkModeToggle" className="font-medium">Dark Mode</label>
                <button onClick={toggleDarkMode} id="darkModeToggle" className={`p-2 rounded-full ${theme.muted} hover:bg-gray-200 dark:hover:bg-gray-700`}>
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="soundToggle" className="font-medium">Sound Enabled</label>
                <button onClick={toggleSound} id="soundToggle" className={`p-2 rounded-full ${theme.muted} hover:bg-gray-200 dark:hover:bg-gray-700`}>
                  {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>
              </div>
            </div>
          </section>

          {/* AI Model Section */}
          <section>
            <h3 className="text-lg font-semibold mb-3">AI Model</h3>
            <div role="group" className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(AI_MODELS).map(([key, model]) => (
                <button key={key} onClick={() => setSelectedAI(key as AIModelKey)}
                  className={`p-3 rounded-lg border text-sm transition-all duration-200 ${
                    selectedAI === key ? `${model.color} border-current bg-current/10 font-semibold` :
                    `${theme.muted} border-gray-300 dark:border-gray-600 hover:border-current hover:bg-gray-500/10`
                  }`}>
                  {model.icon} {model.name}
                </button>
              ))}
            </div>
          </section>

          {/* Image Style Section */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Image Style (DALL-E)</h3>
            <div role="group" className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(IMAGE_STYLES).map(([key, style]) => (
                <button key={key} onClick={() => setImageStyle(key as ImageStyleKey)}
                  className={`p-3 rounded-lg border text-sm transition-all duration-200 ${
                    imageStyle === key ? 'text-pink-400 border-pink-400 bg-pink-400/10 font-semibold' :
                    `${theme.muted} border-gray-300 dark:border-gray-600 hover:border-current hover:text-pink-400 hover:border-pink-400/50 hover:bg-pink-400/10`
                  }`}>
                  {style}
                </button>
              ))}
            </div>
          </section>

          {/* API Keys Section */}
          <section>
            <h3 className="text-lg font-semibold mb-3">API Keys</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">OpenAI API Key</label>
                <input type="password" placeholder="sk-..." value={apiKeys.openai}
                  onChange={(e) => updateApiKey('openai', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${theme.input} border-gray-300 dark:border-gray-600`} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gemini API Key</label>
                <input type="password" placeholder="AIza..." value={apiKeys.gemini}
                  onChange={(e) => updateApiKey('gemini', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${theme.input} border-gray-300 dark:border-gray-600`} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Claude API Key</label>
                <input type="password" placeholder="sk-ant-..." value={apiKeys.claude}
                  onChange={(e) => updateApiKey('claude', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${theme.input} border-gray-300 dark:border-gray-600`} />
              </div>
            </div>
             <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Your API keys are saved automatically to your browser's local storage. They are never sent to our servers.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;