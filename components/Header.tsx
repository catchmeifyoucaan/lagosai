import React from 'react';
import { Sparkles, Settings } from 'lucide-react';
import { ThemeColors } from '../types';

interface HeaderProps {
  theme: ThemeColors;
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, toggleSidebar }) => {
  return (
    <div className="bg-[#1a1a1a] p-4 border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Lagos Oracle Ultra</h1>
        </div>
        
        <button
          onClick={toggleSidebar}
          title="Open Settings"
          className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
          aria-label="Open settings and options sidebar"
        >
          <Settings className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default Header;