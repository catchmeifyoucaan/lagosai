
import React, { useRef } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
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
  const inputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className={`${theme.card} border-t p-3 md:p-4 sticky bottom-0 shadow- ऊपर-md`}> {/* Custom shadow for top */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center space-x-2">
          <button
            onClick={onMicClick}
            disabled={!recognitionAvailable || isListening}
            title={recognitionAvailable ? (isListening ? "Listening..." : "Voice Input") : "Voice input not available"}
            className={`p-3 rounded-xl transition-all duration-200
              ${isListening ? 'bg-red-500 text-white animate-pulse' :
              `${theme.muted} ${recognitionAvailable ? 'hover:text-cyan-400 hover:bg-cyan-500/10' : 'opacity-50 cursor-not-allowed'}`}
            `}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onSend()}
              placeholder="Ask Lagos Oracle anything... (e.g., 'Paint Victoria Island sunset')"
              className={`w-full px-4 py-3 rounded-xl border ${theme.input}
                         focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/80
                         transition-colors duration-200 placeholder-gray-500 dark:placeholder-gray-400/70`}
              disabled={isTyping}
            />
          </div>

          <button
            onClick={onSend}
            disabled={!input.trim() || isTyping}
            title="Send Message"
            className="bg-gradient-to-r from-cyan-400 to-purple-500 text-white p-3 rounded-xl
                       hover:shadow-lg hover:from-cyan-500 hover:to-purple-600
                       transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
