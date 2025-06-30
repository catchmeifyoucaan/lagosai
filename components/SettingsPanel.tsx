import React from 'react';
import { ThemeColors, AIModelKey, ImageStyleKey, ApiKeys, ApiStatus } from '../types';
import { AI_MODELS, IMAGE_STYLES } from '../constants'; // Changed from '@/constants'

interface SettingsPanelProps {
  selectedAI: AIModelKey;
  imageStyle: ImageStyleKey;
  apiKeys: ApiKeys;
  apiStatus: ApiStatus;
  setSelectedAI: (model: AIModelKey) => void;
  setImageStyle: (style: ImageStyleKey) => void;
  updateApiKey: (provider: keyof ApiKeys, value: string) => void;
}

const ApiKeyInput: React.FC<{ 
    placeholder: string;
    value: string;
    isValid: boolean;
    onChange: (value: string) => void;
    ariaLabel: string;
}> = ({ placeholder, value, isValid, onChange, ariaLabel }) => (
    <div className="relative">
        <input type="password" placeholder={placeholder}
            value={value}
            aria-label={ariaLabel}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3 py-2 pr-16 rounded-lg border text-sm bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200`}
        />
        {isValid && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-green-400" aria-hidden="true">✓ VALID</div>
        )}
    </div>
);

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  selectedAI,
  imageStyle,
  apiKeys,
  apiStatus,
  setSelectedAI,
  setImageStyle,
  updateApiKey
}) => {
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="ai-model-select" className="block text-sm font-medium mb-1 text-gray-200">AI Model</label>
        <div className="grid grid-cols-2 gap-2">
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
                  selectedAI === key ? 'bg-blue-600 border-blue-600 text-white font-semibold' : 
                  'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 hover:border-gray-500'
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
        <label htmlFor="image-style-select" className="block text-sm font-medium mb-1 text-gray-200">Image Style (DALL-E)</label>
          <div id="image-style-select" role="group" aria-label="Select Image Style" className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(IMAGE_STYLES).map(([key, style]) => (
            <button key={key} onClick={() => setImageStyle(key as ImageStyleKey)}
              aria-pressed={imageStyle === key}
              className={`p-2 rounded-lg border text-sm transition-all duration-200 ${
                imageStyle === key ? 'bg-blue-600 border-blue-600 text-white font-semibold' : 
                'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 hover:border-gray-500'
              }`}>
              {style}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1 flex items-center space-x-2 text-gray-200">
          <span>API Keys & Status</span>
          <div className="flex space-x-1.5" aria-label="API Status Indicators">
            <div className={`w-2.5 h-2.5 rounded-full ${apiStatus.openai ? 'bg-green-400' : 'bg-gray-400'}`} title={`OpenAI API ${apiStatus.openai ? 'Active' : 'Inactive'}`}></div>
            <div className={`w-2.5 h-2.5 rounded-full ${apiStatus.gemini ? 'bg-blue-400' : 'bg-gray-400'}`} title={`Gemini API ${apiStatus.gemini ? 'Active' : 'Inactive'}`}></div>
            <div className={`w-2.5 h-2.5 rounded-full ${apiStatus.claude ? 'bg-purple-400' : 'bg-gray-400'}`} title={`Claude API ${apiStatus.claude ? 'Active' : 'Inactive'}`}></div>
          </div>
        </label>
        <div className="grid md:grid-cols-3 gap-2"> {/* Changed to md:grid-cols-3 for Gemini */}
          <ApiKeyInput
            placeholder="OpenAI API Key (sk-...)"
            ariaLabel="OpenAI API Key Input"
            value={apiKeys.openai}
            isValid={apiStatus.openai}
            onChange={(value) => updateApiKey('openai', value)}
          />
          <ApiKeyInput
            placeholder="Gemini API Key (AIza...)"
            ariaLabel="Gemini API Key Input"
            value={apiKeys.gemini}
            isValid={apiStatus.gemini}
            onChange={(value) => updateApiKey('gemini', value)}
          />
          <ApiKeyInput
            placeholder="Claude API Key (sk-ant-...)"
            ariaLabel="Claude API Key Input"
            value={apiKeys.claude}
            isValid={apiStatus.claude}
            onChange={(value) => updateApiKey('claude', value)}
          />
        </div>
          <div className="mt-2 text-xs text-gray-400 space-y-1">
          <p>
            Your API keys are <strong className="text-white font-semibold">saved automatically</strong> to your browser's local storage as you type. They are not sent to any server other than the respective API providers when you make a request.
          </p>
          <p>
            If an API key is also set as an environment variable (e.g., for Gemini: `REACT_APP_GEMINI_API_KEY`), the value entered here will take precedence if provided.
          </p>
          {!apiStatus.openai && !apiStatus.claude && !apiStatus.gemini && (
            <p className="mt-2 p-2 rounded-md bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
              <strong>Get Started:</strong> Enter at least one API key to begin chatting with the Oracle. You can get keys from Google AI Studio, OpenAI, and Anthropic.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
