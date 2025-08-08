
import React, { useState, useRef, useEffect } from 'react';
import { SendHorizonal, Mic, ChevronUp } from 'lucide-react';
import { ThemeColors, AIModelKey } from '../types';
import ModelSelector from './ModelSelector';
import { AI_MODELS } from '../constants';

interface ChatInputProps {
  input: string;
  isTyping: boolean;
  isListening: boolean;
  recognitionAvailable: boolean;
  theme: ThemeColors;
  selectedAI: AIModelKey;
  setInput: (input: string) => void;
  handleSend: () => void;
  startListening: () => void;
  setSelectedAI: (model: AIModelKey) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  input,
  isTyping,
  isListening,
  recognitionAvailable,
  theme,
  selectedAI,
  setInput,
  handleSend,
  startListening,
  setSelectedAI
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showModelSelector, setShowModelSelector] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const onSend = () => {
    if (input.trim() && !isTyping) {
      handleSend();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="bg-transparent px-4 pb-4 sticky bottom-0">
      <div className="max-w-3xl mx-auto">
        <div className="relative">
          {showModelSelector && (
            <ModelSelector
              theme={theme}
              selectedAI={selectedAI}
              onSelectAI={setSelectedAI}
              onClose={() => setShowModelSelector(false)}
            />
          )}
          <div className={`relative flex items-center ${theme.card} border dark:border-gray-600 rounded-2xl shadow-lg`}>
            <button
              onClick={() => setShowModelSelector(s => !s)}
              className="p-3 rounded-full transition-all duration-200 flex items-center gap-1 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <span className="text-lg">{AI_MODELS[selectedAI].icon}</span>
              <ChevronUp size={16} className={`transition-transform duration-200 ${showModelSelector ? 'rotate-0' : 'rotate-180'}`} />
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${AI_MODELS[selectedAI].name}...`}
              className={`w-full max-h-48 bg-transparent p-3 resize-none border-none focus:ring-0 ${theme.text} placeholder-gray-500 dark:placeholder-gray-400`}
              rows={1}
              disabled={isTyping}
            />

            <button
              onClick={onSend}
              disabled={!input.trim() || isTyping}
              title="Send Message"
              className="p-3 mr-2 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                         text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500"
            >
              <SendHorizonal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
