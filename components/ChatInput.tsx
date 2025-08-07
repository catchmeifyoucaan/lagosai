
import React, { useRef, useEffect } from 'react';
import { SendHorizonal, Mic, MicOff } from 'lucide-react';
import { ThemeColors } from '../types';

interface ChatInputProps {
  input: string;
  isTyping: boolean;
  isListening: boolean;
  recognitionAvailable: boolean;
  theme: ThemeColors;
  setInput: (input: string) => void;
  handleSend: () => void;
  startListening: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  input,
  isTyping,
  isListening,
  recognitionAvailable,
  theme,
  setInput,
  handleSend,
  startListening
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const onMicClick = () => {
    if (recognitionAvailable && !isListening) {
      startListening();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className={`bg-transparent p-4 sticky bottom-0`}>
      <div className="max-w-3xl mx-auto">
        <div className={`relative flex items-center ${theme.card} border dark:border-gray-600 rounded-2xl shadow-lg`}>
          <button
            onClick={onMicClick}
            disabled={!recognitionAvailable || isListening}
            title={recognitionAvailable ? (isListening ? "Listening..." : "Voice Input") : "Voice input not available"}
            className={`p-3 rounded-full transition-all duration-200
              ${isListening ? 'bg-red-500 text-white animate-pulse' :
              `${theme.muted} ${recognitionAvailable ? 'hover:text-cyan-400' : 'opacity-50 cursor-not-allowed'}`}
            `}
          >
            <Mic className="w-5 h-5" />
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Lagos Oracle..."
            className={`w-full max-h-48 bg-transparent p-3 resize-none border-none focus:ring-0 ${theme.text} placeholder-gray-500 dark:placeholder-gray-400`}
            rows={1}
            disabled={isTyping}
          />

          <button
            onClick={onSend}
            disabled={!input.trim() || isTyping}
            title="Send Message"
            className="p-3 mr-2 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                       text-white bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-500"
          >
            <SendHorizonal className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
