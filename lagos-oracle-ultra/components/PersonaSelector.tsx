
import React from 'react';
import { ThemeColors, PersonaKey } from '../types';
import { PERSONAS, DEFAULT_PERSONA_KEY } from '../constants';

interface PersonaSelectorProps {
  theme: ThemeColors;
  selectedPersonaKey: PersonaKey | 'default';
  onSelectPersona: (key: PersonaKey | 'default') => void;
  onClose: () => void; // Added for explicit close, e.g., on selecting a persona
}

const PersonaSelector: React.FC<PersonaSelectorProps> = ({
  theme,
  selectedPersonaKey,
  onSelectPersona,
  onClose
}) => {
  const handleSelect = (key: PersonaKey | 'default') => {
    onSelectPersona(key);
    onClose(); // Close selector after selection
  };
  return (
    <div className={`${theme.card} border-b p-4 shadow-md`}>
      <div className="max-w-6xl mx-auto space-y-3">
        <div className="flex justify-between items-center">
          <h3 className={`text-lg font-semibold ${theme.primaryAccent}`}>🎭 Choose Your Oracle's Persona</h3>
           <button 
            onClick={onClose} 
            className={`${theme.muted} hover:text-red-500 text-sm p-1 rounded-md`}
            title="Close Persona Selector"
            aria-label="Close Persona Selector"
          >
            &times; Close
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(PERSONAS).map(([keyStr, persona]) => {
            const key = keyStr as PersonaKey | 'default';
            const isSelected = selectedPersonaKey === key;
            return (
              <button
                key={key}
                onClick={() => handleSelect(key)}
                className={`p-3 rounded-lg border text-left transition-all duration-200 flex flex-col items-start h-full
                  ${isSelected 
                    ? `${persona.color || theme.primaryAccent} border-current bg-current/10 font-semibold shadow-lg ring-2 ring-current` 
                    : `${theme.text} ${theme.card.replace('bg-', 'hover:bg-opacity-80 hover:border-')} border-gray-500/30 hover:shadow-md hover:border-current ${(persona.color || theme.primaryAccent).replace('text-', 'hover:border-')}`
                  }
                `}
                aria-pressed={isSelected}
                title={persona.description}
              >
                <div className="flex items-center mb-1">
                  <span className="text-2xl mr-2">{persona.icon}</span>
                  <span className={`font-semibold ${isSelected ? (persona.color || theme.primaryAccent) : theme.text}`}>{persona.name}</span>
                </div>
                <p className={`text-xs ${isSelected ? (persona.color || theme.primaryAccent) : theme.muted} opacity-90`}>{persona.description}</p>
              </button>
            );
          })}
        </div>
        <p className={`text-xs ${theme.muted} mt-2 text-center`}>
          Selecting a persona changes the Oracle's style and language. Voice accents depend on browser capabilities.
        </p>
      </div>
    </div>
  );
};

export default PersonaSelector;
