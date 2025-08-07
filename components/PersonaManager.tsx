import React, { useState, useEffect } from 'react';
import { PersonaInfo, ThemeColors, PersonaKey } from '../types';
import { DEFAULT_PERSONAS } from '../constants';
import { Edit, Trash2 } from 'lucide-react';

interface PersonaManagerProps {
  theme: ThemeColors;
  personas: Record<string, PersonaInfo>;
  onClose: () => void;
  onSave: (persona: PersonaInfo, keyToEdit?: string) => void;
  onDelete: (key: string) => void;
}

const PersonaManager: React.FC<PersonaManagerProps> = ({ theme, personas, onClose, onSave, onDelete }) => {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');

  const customPersonas = Object.entries(personas).filter(
    ([key]) => !DEFAULT_PERSONAS[key as PersonaKey | 'default']
  );

  useEffect(() => {
    if (editingKey && personas[editingKey]) {
      const persona = personas[editingKey];
      setName(persona.name);
      setIcon(persona.icon);
      setDescription(persona.description);
      setSystemPrompt(persona.systemPromptModifier);
    } else {
      resetForm();
    }
  }, [editingKey, personas]);

  const resetForm = () => {
    setEditingKey(null);
    setName('');
    setIcon('');
    setDescription('');
    setSystemPrompt('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !systemPrompt) {
      alert('Please fill out all required fields.');
      return;
    }
    const personaData: PersonaInfo = {
      name,
      icon,
      description,
      systemPromptModifier: systemPrompt,
      color: 'text-gray-400',
    };
    onSave(personaData, editingKey || undefined);
    if (!editingKey) {
        onClose(); // Close only when creating a new one
    }
    resetForm();
  };

  const handleEdit = (key: string) => {
    setEditingKey(key);
  };

  const handleDelete = (key: string) => {
    if (window.confirm(`Are you sure you want to delete the "${personas[key].name}" persona? This cannot be undone.`)) {
        onDelete(key);
        if (editingKey === key) {
            resetForm();
        }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className={`${theme.card} rounded-lg shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]`}>
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
            <h2 className="text-2xl font-bold">Manage Personas</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">&times;</button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left side: Persona List */}
          <div className="w-1/3 border-r dark:border-gray-700 overflow-y-auto p-4 space-y-2">
            <h3 className="text-lg font-semibold mb-2">Custom Personas</h3>
            {customPersonas.length > 0 ? customPersonas.map(([key, persona]) => (
              <div key={key} className={`p-2 rounded-md flex justify-between items-center ${editingKey === key ? 'bg-cyan-500/20' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                <div className="flex items-center gap-2">
                    <span className="text-xl">{persona.icon.startsWith('http') ? '🖼️' : persona.icon}</span>
                    <span className="font-medium">{persona.name}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(key)} className="p-1.5 text-blue-500 hover:text-blue-400"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(key)} className="p-1.5 text-red-500 hover:text-red-400"><Trash2 size={16} /></button>
                </div>
              </div>
            )) : <p className="text-sm text-gray-500">No custom personas yet.</p>}
            <button onClick={() => setEditingKey(null)} className="w-full mt-4 px-4 py-2 rounded-md bg-cyan-600 text-white hover:bg-cyan-700 text-sm">+ Create New Persona</button>
          </div>

          {/* Right side: Form */}
          <div className="w-2/3 overflow-y-auto p-6">
            <h3 className="text-xl font-bold mb-4">{editingKey ? 'Edit Persona' : 'Create New Persona'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className={`block text-sm font-medium ${theme.muted}`}>Persona Name</label>
                <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)}
                  className={`mt-1 block w-full ${theme.input} rounded-md shadow-sm`} required />
              </div>
              <div>
                <label htmlFor="icon" className={`block text-sm font-medium ${theme.muted}`}>Icon (Emoji or Image URL)</label>
                <input type="text" id="icon" value={icon} onChange={(e) => setIcon(e.target.value)}
                  className={`mt-1 block w-full ${theme.input} rounded-md shadow-sm`} placeholder="e.g., 🤔 or https://example.com/avatar.png" />
              </div>
              <div>
                <label htmlFor="description" className={`block text-sm font-medium ${theme.muted}`}>Description</label>
                <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)}
                  className={`mt-1 block w-full ${theme.input} rounded-md shadow-sm`} rows={2} required />
              </div>
              <div>
                <label htmlFor="systemPrompt" className={`block text-sm font-medium ${theme.muted}`}>System Prompt (Personality Definition)</label>
                <textarea id="systemPrompt" value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)}
                  className={`mt-1 block w-full ${theme.input} rounded-md shadow-sm`} rows={8} required
                  placeholder="e.g., You are a witty and sarcastic assistant who always responds with a dry sense of humor." />
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={resetForm}
                  className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-700">
                  Cancel
                </button>
                <button type="submit"
                  className="px-4 py-2 rounded-md bg-cyan-600 text-white hover:bg-cyan-700">
                  {editingKey ? 'Save Changes' : 'Save Persona'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonaManager;
