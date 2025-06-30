import React from 'react';
import { ThemeColors } from '../types';

interface WelcomeGuideProps {
  theme: ThemeColors;
  onClose: () => void;
}

const WelcomeGuide: React.FC<WelcomeGuideProps> = ({ theme, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full border border-gray-700 text-white">
        <div className="p-6 space-y-4">
          <h2 className="text-2xl font-bold text-blue-400">
            Welcome to Lagos Oracle Ultra!
          </h2>
          <p className="text-gray-300">
            Your AI companion for all things Lagos and beyond. Here's a quick guide to get you started:
          </p>
          <ul className="space-y-3 text-sm list-disc list-inside text-gray-200">
            <li>
              <strong>Configure APIs:</strong> Click the <strong>⚙️ icon</strong> to enter your API keys for Gemini, OpenAI, and Claude to unlock the full experience.
            </li>
            <li>
              <strong>Choose a Persona:</strong> Click the <strong>🎭 icon</strong> to change the Oracle's personality and speaking style.
            </li>
            <li>
              <strong>Generate Images:</strong> Ask the Oracle to "draw," "paint," or "visualize" something. This uses OpenAI's DALL-E 3.
            </li>
            <li>
              <strong>Vision Guide:</strong> Click the <strong>👁️ icon</strong> to activate your camera and have the Oracle describe your surroundings (requires Gemini API).
            </li>
          </ul>
          <button
            onClick={onClose}
            className="w-full py-2 px-4 rounded-lg font-semibold transition-colors bg-blue-600 hover:bg-blue-700 text-white"
          >
            Got it, let's begin!
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeGuide;