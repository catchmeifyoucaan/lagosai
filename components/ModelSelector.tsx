import React from 'react';
import { AI_MODELS } from '../constants';
import { AIModelKey, ThemeColors } from '../types';

interface ModelSelectorProps {
  theme: ThemeColors;
  selectedAI: AIModelKey;
  onSelectAI: (model: AIModelKey) => void;
  onClose: () => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ theme, selectedAI, onSelectAI, onClose }) => {
  return (
    <div className="absolute bottom-full mb-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700">
      <div className="p-2">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 mb-1">Choose a model</p>
        {Object.entries(AI_MODELS).map(([key, model]) => (
          <button
            key={key}
            onClick={() => {
              onSelectAI(key as AIModelKey);
              onClose();
            }}
            className={`w-full flex items-center gap-2 p-2 rounded-md text-sm text-left
                        ${selectedAI === key
                          ? `font-semibold ${model.color}`
                          : `${theme.text} hover:bg-gray-100 dark:hover:bg-gray-700`
                        }`}
          >
            <span className="text-lg">{model.icon}</span>
            <span>{model.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ModelSelector;
