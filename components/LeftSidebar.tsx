import React from 'react';
import { Plus, MessageSquare, Settings, LogOut } from 'lucide-react';

interface LeftSidebarProps {
  onNewChat: () => void;
  onOpenSettings: () => void;
  chatHistory: { id: string; title: string; }[];
  onSelectChat: (id: string) => void;
  selectedChatId: string | null;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({
  onNewChat,
  onOpenSettings,
  chatHistory,
  onSelectChat,
  selectedChatId,
}) => {
  return (
    <div className="flex flex-col w-64 bg-[#1a1a1a] border-r border-gray-700 h-screen p-4">
      {/* New Chat Button */}
      <button
        onClick={onNewChat}
        className="flex items-center justify-center w-full px-4 py-3 mb-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md"
      >
        <Plus className="w-5 h-5 mr-2" />
        New Chat
      </button>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto custom-scrollbar mb-4">
        {chatHistory.length === 0 ? (
          <p className="text-gray-400 text-sm text-center mt-4">No chats yet. Start a new one!</p>
        ) : (
          <nav>
            {chatHistory.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`flex items-center w-full p-3 rounded-lg text-left transition-colors duration-200 mb-2
                  ${selectedChatId === chat.id ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-800'}
                `}
              >
                <MessageSquare className="w-4 h-4 mr-3" />
                <span className="flex-1 truncate">{chat.title}</span>
              </button>
            ))}
          </nav>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="border-t border-gray-700 pt-4 space-y-2">
        <button
          onClick={onOpenSettings}
          className="flex items-center w-full p-3 rounded-lg text-left text-gray-300 hover:bg-gray-800 transition-colors duration-200"
        >
          <Settings className="w-4 h-4 mr-3" />
          Settings
        </button>
        <button
          onClick={() => alert('Logout functionality not implemented.')}
          className="flex items-center w-full p-3 rounded-lg text-left text-gray-300 hover:bg-gray-800 transition-colors duration-200"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default LeftSidebar;
