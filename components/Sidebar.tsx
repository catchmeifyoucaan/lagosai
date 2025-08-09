import React from 'react';
import { Plus, Settings, Search, Library, Drama } from 'lucide-react';
import { ThemeColors } from '../types';

interface SidebarProps {
  theme: ThemeColors;
  showSettings: boolean;
  showPersonaSelector: boolean;
  toggleSettings: () => void;
  togglePersonaSelector: () => void;
  onNewChat: () => void;
  showSearch?: boolean;
  showLibrary?: boolean;
  toggleSearch?: () => void;
  toggleLibrary?: () => void;
  // We will add more props as we implement the other features
}

const Sidebar: React.FC<SidebarProps> = ({
  theme,
  showSettings,
  showPersonaSelector,
  toggleSettings,
  togglePersonaSelector,
  onNewChat,
  showSearch,
  showLibrary,
  toggleSearch,
  toggleLibrary
}) => {
  return (
    <div className={`h-screen w-64 ${theme.card} border-r dark:border-gray-700 flex flex-col p-2`}>
      <div className="flex-1 space-y-2">
        {/* New Chat Button */}
        <button onClick={onNewChat} className="w-full flex items-center gap-2 p-2 rounded-md text-sm font-medium bg-cyan-600 text-white hover:bg-cyan-700">
          <Plus size={18} />
          New Chat
        </button>

        {/* Placeholder Links */}
        <div className="pt-4 space-y-1">
          <button onClick={toggleSearch} className={`w-full flex items-center gap-2 p-2 rounded-md text-sm ${showSearch ? `bg-cyan-500/20 ${theme.primaryAccent}` : theme.muted} hover:bg-gray-200 dark:hover:bg-gray-700`}>
            <Search size={18} />
            Search
          </button>
          <button onClick={toggleLibrary} className={`w-full flex items-center gap-2 p-2 rounded-md text-sm ${showLibrary ? `bg-cyan-500/20 ${theme.primaryAccent}` : theme.muted} hover:bg-gray-200 dark:hover:bg-gray-700`}>
            <Library size={18} />
            Library
          </button>
          <button
            onClick={togglePersonaSelector}
            className={`w-full flex items-center gap-2 p-2 rounded-md text-sm ${showPersonaSelector ? `bg-cyan-500/20 ${theme.primaryAccent}` : theme.muted} hover:bg-gray-200 dark:hover:bg-gray-700`}
          >
            <Drama size={18} />
            Personas
          </button>
        </div>
      </div>

      {/* Settings Button */}
      <div className="mt-auto">
        <button
          onClick={toggleSettings}
          className={`w-full flex items-center gap-2 p-2 rounded-md text-sm ${showSettings ? `bg-cyan-500/20 ${theme.primaryAccent}` : theme.muted} hover:bg-gray-200 dark:hover:bg-gray-700`}
        >
          <Settings size={18} />
          Settings
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
