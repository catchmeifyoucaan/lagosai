
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
  const [customName, setCustomName] = React.useState('');
  const [customIcon, setCustomIcon] = React.useState('');
  const [customColor, setCustomColor] = React.useState('text-yellow-400');

  const saveCustomPersona = () => {
    const key = `custom:${customName.trim().toLowerCase().replace(/\s+/g,'-')}` as PersonaKey;
    const newPersona = {
      name: customName || 'Custom',
      icon: customIcon || '🌟',
      description: 'Custom persona',
      systemPromptModifier: '',
      color: customColor
    };
    try {
      const raw = localStorage.getItem('lagosOracleCustomPersonas_v1');
      const map = raw ? JSON.parse(raw) as Record<string, any> : {};
      map[key] = newPersona;
      localStorage.setItem('lagosOracleCustomPersonas_v1', JSON.stringify(map));
    } catch {}
    onSelectPersona(key);
    onClose();
  };

  const mergedPersonas = React.useMemo(() => {
    try {
      const raw = localStorage.getItem('lagosOracleCustomPersonas_v1');
      const map = raw ? JSON.parse(raw) as Record<string, any> : {};
      return { ...PERSONAS, ...map } as Record<PersonaKey | 'default', any>;
    } catch { return PERSONAS as Record<PersonaKey | 'default', any>; }
  }, []);
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
      </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(mergedPersonas).map(([keyStr, persona]) => {
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
        <div className="mt-4 p-3 rounded-lg border dark:border-gray-700">
          <h4 className="font-semibold mb-2">Create Custom Persona</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input value={customName} onChange={e=>setCustomName(e.target.value)} placeholder="Name" className={`px-3 py-2 rounded-lg border text-sm ${theme.input} border-gray-300 dark:border-gray-600`} />
            <input value={customIcon} onChange={e=>setCustomIcon(e.target.value)} placeholder="Avatar (emoji or image URL)" className={`px-3 py-2 rounded-lg border text-sm ${theme.input} border-gray-300 dark:border-gray-600`} />
            <select value={customColor} onChange={e=>setCustomColor(e.target.value)} className={`px-3 py-2 rounded-lg border text-sm ${theme.input} border-gray-300 dark:border-gray-600`}>
              <option value="text-yellow-400">Yellow</option>
              <option value="text-blue-400">Blue</option>
              <option value="text-green-400">Green</option>
              <option value="text-pink-400">Pink</option>
              <option value="text-purple-400">Purple</option>
              <option value="text-teal-400">Teal</option>
            </select>
          </div>
          <button onClick={saveCustomPersona} disabled={!customName.trim()} className="mt-3 px-3 py-2 rounded-md bg-cyan-600 text-white disabled:bg-gray-500">Save & Use</button>
        </div>
        <p className={`text-xs ${theme.muted} mt-2 text-center`}>
          Selecting a persona changes the Oracle's style and language. Voice accents depend on browser capabilities.
        </p>
      </div>
    );
  };

export default PersonaSelector;
