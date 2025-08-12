import React from 'react';
import { Sparkles, Bot } from 'lucide-react';
import { ThemeColors } from '../types';

interface WelcomeGuideProps {
  theme: ThemeColors;
  onPromptClick: (prompt: string) => void;
}

const WelcomeGuide: React.FC<WelcomeGuideProps> = ({ theme, onPromptClick }) => {
  const prompts = [
    "What's the best place to get suya in Lekki?",
    "Paint a picture of a futuristic Lagos with flying danfo buses.",
    "Tell me a story about the Eyo festival, but in the style of a wise Igbo elder.",
    "Plan a 3-day tourist itinerary for someone visiting Lagos for the first time."
  ];
  const [logoError, setLogoError] = React.useState(false);

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      {logoError ? (
        <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg mb-4">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
      ) : (
        <img src="/logo.png" alt="Logo" className="w-24 h-24 rounded-full object-cover shadow-lg mb-4" onError={() => setLogoError(true)} />
      )}
      <h1 className={`text-3xl font-bold ${theme.text} mb-2`}>Lagos Oracle</h1>
      <p className={`${theme.muted} mb-8`}>Your AI companion for all things Lagos and beyond.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
        {prompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onPromptClick(prompt)}
            className={`p-4 rounded-lg text-left transition-all duration-200
                        ${theme.card} border dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700/50
                        flex items-start space-x-3`}
          >
            <Bot className={`w-5 h-5 mt-1 ${theme.secondaryAccent} shrink-0`} />
            <span className={`text-sm ${theme.text}`}>{prompt}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default WelcomeGuide;
