
import React from 'react';
import { ThemeColors, AIModelKey, ImageStyleKey, ApiKeys, ApiStatus } from '../types';
import { AI_MODELS, IMAGE_STYLES } from '../constants'; // Changed from '@/constants'

interface SettingsPanelProps {
  theme: ThemeColors;
  selectedAI: AIModelKey;
  imageStyle: ImageStyleKey;
  apiKeys: ApiKeys;
  apiStatus: ApiStatus;
  setSelectedAI: (model: AIModelKey) => void;
  setImageStyle: (style: ImageStyleKey) => void;
  updateApiKey: (provider: keyof ApiKeys, value: string) => void;
}

const ApiKeyInput: React.FC<{
  provider: keyof ApiKeys;
  placeholder: string;
  value: string;
  isValid: boolean;
  theme: ThemeColors;
  statusColor: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}> = ({ provider, placeholder, value, isValid, theme, statusColor, onChange, ariaLabel }) => (
  <div className="relative">
    <input type="password" placeholder={placeholder}
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 pr-16 rounded-lg border text-sm ${theme.input} ${ /* Increased pr for "VALID" text */
        isValid ? `border-${statusColor} focus:ring-${statusColor}` : `border-gray-600/50 focus:ring-cyan-400/50`
      } focus:border-transparent focus:ring-2 transition-colors duration-200`}
    />
    {isValid && (
      <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-${statusColor}`} aria-hidden="true">✓ VALID</div>
    )}
  </div>
);

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  theme,
  selectedAI,
  imageStyle,
  apiKeys,
  apiStatus,
  setSelectedAI,
  setImageStyle,
  updateApiKey
}) => {
  return (
    <div className={`${theme.card} border-b p-4 shadow-md`}>
      <div className="max-w-6xl mx-auto space-y-4">
        <h3 className="text-lg font-semibold text-cyan-400">⚙️ Configuration</h3>

        <div>
          <label htmlFor="ai-model-select" className="block text-sm font-medium mb-1">AI Model</label>
          <div id="ai-model-select" role="group" aria-label="Select AI Model" className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(AI_MODELS).map(([keyStr, model]) => {
              const key = keyStr as AIModelKey;
              const isSpecificModelUnconfigured =
                (key === 'gemini' && !apiStatus.gemini) ||
                (key === 'openai' && !apiStatus.openai) ||
                (key === 'claude' && !apiStatus.claude);

              return (
                <button key={key} onClick={() => setSelectedAI(key)}
                  aria-pressed={selectedAI === key}
                  className={`p-2 rounded-lg border text-sm transition-all duration-200 ${
                    selectedAI === key ? `${model.color} border-current bg-current/10 font-semibold` :
                    `${theme.muted} border-gray-500/30 hover:border-current hover:bg-gray-500/10`
                  } ${isSpecificModelUnconfigured && selectedAI !== key ? 'opacity-60 cursor-not-allowed' : ''}`}
                  title={isSpecificModelUnconfigured ? `${model.name} API not configured or key invalid. Check settings.` : model.name}
                  disabled={isSpecificModelUnconfigured}
                >
                  {model.icon} {model.name}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="image-style-select" className="block text-sm font-medium mb-1">Image Style (DALL-E)</label>
           <div id="image-style-select" role="group" aria-label="Select Image Style" className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(IMAGE_STYLES).map(([key, style]) => (
              <button key={key} onClick={() => setImageStyle(key as ImageStyleKey)}
                aria-pressed={imageStyle === key}
                className={`p-2 rounded-lg border text-sm transition-all duration-200 ${
                  imageStyle === key ? 'text-pink-400 border-pink-400 bg-pink-400/10 font-semibold' :
                  `${theme.muted} border-gray-500/30 hover:border-current hover:text-pink-400 hover:border-pink-400/50 hover:bg-pink-400/10`
                }`}>
                {style}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 flex items-center space-x-2">
            <span>API Keys & Status</span>
            <div className="flex space-x-1.5" aria-label="API Status Indicators">
              <div className={`w-2.5 h-2.5 rounded-full ${apiStatus.openai ? 'bg-green-400' : 'bg-gray-400'}`} title={`OpenAI API ${apiStatus.openai ? 'Active' : 'Inactive'}`}></div>
              <div className={`w-2.5 h-2.5 rounded-full ${apiStatus.gemini ? 'bg-blue-400' : 'bg-gray-400'}`} title={`Gemini API ${apiStatus.gemini ? 'Active' : 'Inactive'}`}></div>
              <div className={`w-2.5 h-2.5 rounded-full ${apiStatus.claude ? 'bg-purple-400' : 'bg-gray-400'}`} title={`Claude API ${apiStatus.claude ? 'Active' : 'Inactive'}`}></div>
            </div>
          </label>
          <div className="grid md:grid-cols-3 gap-2"> {/* Changed to md:grid-cols-3 for Gemini */}
            <ApiKeyInput
              provider="openai"
              placeholder="OpenAI API Key (sk-...)"
              ariaLabel="OpenAI API Key Input"
              value={apiKeys.openai}
              isValid={apiStatus.openai}
              theme={theme}
              statusColor="green-400"
              onChange={(value) => updateApiKey('openai', value)}
            />
            <ApiKeyInput
              provider="gemini"
              placeholder="Gemini API Key (AIza...)"
              ariaLabel="Gemini API Key Input"
              value={apiKeys.gemini}
              isValid={apiStatus.gemini}
              theme={theme}
              statusColor="blue-400"
              onChange={(value) => updateApiKey('gemini', value)}
            />
            <ApiKeyInput
              provider="claude"
              placeholder="Claude API Key (sk-ant-...)"
              ariaLabel="Claude API Key Input"
              value={apiKeys.claude}
              isValid={apiStatus.claude}
              theme={theme}
              statusColor="purple-400"
              onChange={(value) => updateApiKey('claude', value)}
            />
          </div>
           <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>
              Your API keys are <strong className={`${theme.text} font-semibold`}>saved automatically</strong> to your browser's local storage as you type. They are not sent to any server other than the respective API providers when you make a request.
            </p>
            <p>
              If an API key is also set as an environment variable (e.g., for Gemini: `REACT_APP_GEMINI_API_KEY`), the value entered here will take precedence if provided.
            </p>
            {!apiStatus.openai && !apiStatus.claude && !apiStatus.gemini ? (
              <span> Enter API keys to unlock full AI features.</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;