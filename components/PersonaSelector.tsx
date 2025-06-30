import React from 'react';
import { ThemeColors, PersonaKey } from '../types';
import { PERSONAS } from '../constants';

interface PersonaSelectorProps {
  selectedPersonaKey: PersonaKey | 'default';
  onSelectPersona: (key: PersonaKey | 'default') => void;
}

const PersonaSelector: React.FC<PersonaSelectorProps> = ({
  selectedPersonaKey,
  onSelectPersona,
}) => {
  const handleSelect = (key: PersonaKey | 'default') => {
    onSelectPersona(key);
  };
  return (
    <div className="space-y-4">
        <h3 className="text-lg font-semibold text-blue-400 mb-4">🎭 Choose Your Oracle's Persona</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(PERSONAS).map(([keyStr, persona]) => {
            const key = keyStr as PersonaKey | 'default';
            const isSelected = selectedPersonaKey === key;
            return (
              <button
                key={key}
                onClick={() => handleSelect(key)}
                className={`p-3 rounded-xl border text-left transition-all duration-200 flex flex-col items-start h-full
                  ${isSelected 
                    ? 'bg-blue-600 border-blue-600 text-white font-semibold shadow-lg ring-2 ring-blue-500' 
                    : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500 hover:shadow-md'
                  }
                `}
                aria-pressed={isSelected}
                title={persona.description}
              >
                <div>
                  <div className="flex items-center mb-1">
                    <span className="text-2xl mr-2">{persona.icon}</span>
                    <span className="font-semibold">{persona.name}</span>
                  </div>
                  <p className="text-xs text-gray-300 opacity-90">{persona.description}</p>
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-4 text-center">
          Selecting a persona changes the Oracle's style and language. Voice accents depend on browser capabilities.
        </p>
    </div>
  );
};

export default PersonaSelector;