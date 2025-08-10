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
  onExportLibrary?: () => void;
  onImportLibrary?: (file: File) => void;
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
  toggleLibrary,
  onExportLibrary,
  onImportLibrary
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setOpen(true); };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return (
    <div className={`h-screen ${open ? 'w-64' : 'w-14'} ${theme.card} border-r dark:border-gray-700 flex flex-col p-2 transition-all duration-200`}>
      <button className={`md:hidden lg:block mb-2 p-2 rounded-md ${theme.muted} hover:bg-gray-200 dark:hover:bg-gray-700`} onClick={() => setOpen(o=>!o)} aria-label="Toggle sidebar">
        {open ? '⟨⟨' : '⟩⟩'}
      </button>
      <div className="flex-1 space-y-2">
        {/* New Chat Button */}
        <button onClick={onNewChat} className={`w-full flex items-center ${open ? 'gap-2' : 'justify-center'} p-2 rounded-md text-sm font-medium bg-cyan-600 text-white hover:bg-cyan-700`}>
          <Plus size={18} />
          {open && 'New Chat'}
        </button>

        {/* Placeholder Links */}
        <div className="pt-4 space-y-1">
          <button onClick={toggleSearch} className={`w-full flex items-center ${open ? 'gap-2' : 'justify-center'} p-2 rounded-md text-sm ${showSearch ? `bg-cyan-500/20 ${theme.primaryAccent}` : theme.muted} hover:bg-gray-200 dark:hover:bg-gray-700`}>
            <Search size={18} />
            {open && 'Search'}
          </button>
          <button onClick={toggleLibrary} className={`w-full flex items-center ${open ? 'gap-2' : 'justify-center'} p-2 rounded-md text-sm ${showLibrary ? `bg-cyan-500/20 ${theme.primaryAccent}` : theme.muted} hover:bg-gray-200 dark:hover:bg-gray-700`}>
            <Library size={18} />
            {open && 'Library'}
          </button>
          <button
            onClick={togglePersonaSelector}
            className={`w-full flex items-center ${open ? 'gap-2' : 'justify-center'} p-2 rounded-md text-sm ${showPersonaSelector ? `bg-cyan-500/20 ${theme.primaryAccent}` : theme.muted} hover:bg-gray-200 dark:hover:bg-gray-700`}
          >
            <Drama size={18} />
            {open && 'Personas'}
          </button>
        </div>
      </div>

      {/* Settings Button */}
      <div className="mt-auto space-y-2">
        <div className={`flex items-center ${open ? 'gap-2' : 'justify-center'}`}>
          <button onClick={onExportLibrary} className={`p-2 rounded-md text-sm ${theme.muted} hover:bg-gray-200 dark:hover:bg-gray-700`}>{open ? 'Export' : '⬇'}</button>
          <button onClick={() => fileInputRef.current?.click()} className={`p-2 rounded-md text-sm ${theme.muted} hover:bg-gray-200 dark:hover:bg-gray-700`}>{open ? 'Import' : '⬆'}</button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={e => e.target.files && onImportLibrary && onImportLibrary(e.target.files[0])} />
        </div>
        <button
          onClick={toggleSettings}
          className={`w-full flex items-center ${open ? 'gap-2' : 'justify-center'} p-2 rounded-md text-sm ${showSettings ? `bg-cyan-500/20 ${theme.primaryAccent}` : theme.muted} hover:bg-gray-200 dark:hover:bg-gray-700`}
        >
          <Settings size={18} />
          {open && 'Settings'}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
