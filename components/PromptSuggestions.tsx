import React from 'react';
import { ThemeColors } from '../types';
import { Lightbulb, MessageSquare, Image, Globe } from 'lucide-react';

interface PromptSuggestionsProps {
  onPromptClick: (prompt: string) => void;
}

const suggestions = [
  {
    text: "Tell me about Lekki traffic today",
    icon: <Globe className="w-5 h-5" />,
  },
  {
    text: "Draw a vibrant Lagos market scene",
    icon: <Image className="w-5 h-5" />,
  },
  {
    text: "What's the history of Eko?",
    icon: <Lightbulb className="w-5 h-5" />,
  },
  {
    text: "Explain the concept of 'Owambe'",
    icon: <MessageSquare className="w-5 h-5" />,
  },
];

const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({ onPromptClick }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-center text-4xl font-bold mb-10 text-white">
        How can I help you today?
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onPromptClick(suggestion.text)}
            className="flex flex-col items-start p-4 rounded-xl bg-gray-800 text-white text-left transition-all duration-200 hover:bg-gray-700 hover:shadow-lg border border-gray-700"
          >
            <div className="mb-2 text-blue-400">
              {suggestion.icon}
            </div>
            <p className="font-medium text-sm">{suggestion.text}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PromptSuggestions;