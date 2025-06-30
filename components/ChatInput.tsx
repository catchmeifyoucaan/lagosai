
import React, { useRef, useEffect } from 'react';
import { Send, Mic, Square } from 'lucide-react';
import { ThemeColors } from '../types';

interface ChatInputProps {
  input: string;
  isTyping: boolean;
  isListening: boolean;
  recognitionAvailable: boolean;
  theme: ThemeColors;
  setInput: (value: string) => void;
  handleSend: () => void;
  handleStopGenerating: () => void;
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
  handleStopGenerating,
  startListening
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
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

  return (
    <div className={`relative p-4 ${theme.bg} border-t ${theme.muted}`}>
      <div className={`max-w-4xl mx-auto flex items-end gap-2 ${theme.input} rounded-3xl pr-2 border ${theme.muted} shadow-lg`}>
        <button
          onClick={onMicClick}
          disabled={!recognitionAvailable || isListening || isTyping}
          className={`p-3 rounded-full transition-colors duration-200 ${isListening ? `${theme.secondaryAccent} text-${theme.text} animate-pulse` : `text-${theme.text} hover:${theme.primaryAccent}`} ${!recognitionAvailable || isTyping ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label={isListening ? "Stop listening" : "Start voice input"}
        >
          <Mic className="w-5 h-5" />
        </button>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="Message Lagos Oracle..."
          className={`flex-1 px-4 py-2.5 bg-transparent text-${theme.text} resize-none max-h-40 focus:outline-none placeholder-${theme.muted}`}
          rows={1}
          disabled={isTyping}
        />
        {!isTyping ? (
          <button
            onClick={onSend}
            className={`p-3 rounded-full transition-colors duration-200 ${input.trim() ? `${theme.primaryAccent} hover:${theme.secondaryAccent}` : `${theme.muted} cursor-not-allowed`} text-${theme.text}`}
            disabled={!input.trim()}
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleStopGenerating}
            className={`p-3 rounded-full transition-colors duration-200 ${theme.secondaryAccent} hover:${theme.secondaryAccent} text-${theme.text}`}
            aria-label="Stop generating response"
          >
            <Square className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatInput;
