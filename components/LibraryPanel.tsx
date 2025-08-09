import React from 'react';
import { ThemeColors, Conversation } from '../types';
import { Trash2, FolderOpen } from 'lucide-react';

interface LibraryPanelProps {
  theme: ThemeColors;
  conversations: Conversation[];
  onLoad: (conversation: Conversation) => void;
  onDelete: (conversationId: string) => void;
  onClose: () => void;
}

const LibraryPanel: React.FC<LibraryPanelProps> = ({ theme, conversations, onLoad, onDelete, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`${theme.card} rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col`} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold">Library</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">&times;</button>
        </div>

        <div className="overflow-y-auto p-4 space-y-3">
          {conversations.length === 0 ? (
            <p className={theme.muted}>No saved conversations yet.</p>
          ) : (
            conversations.map(conv => {
              const mediaThumb = conv.messages.find(m => m.media && (m.media.imageUrl || m.media.videoUrl));
              return (
                <div key={conv.id} className={`flex items-center justify-between p-3 rounded-lg border dark:border-gray-700 ${theme.card}`}>
                  <div className="flex items-center gap-3">
                    {mediaThumb?.media?.imageUrl ? (
                      <img src={mediaThumb.media.imageUrl} alt="Thumb" className="w-12 h-12 rounded object-cover" />
                    ) : mediaThumb?.media?.videoUrl ? (
                      <div className="w-12 h-12 rounded bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-xs">Video</div>
                    ) : (
                      <div className="w-12 h-12 rounded bg-gray-200 dark:bg-gray-700" />
                    )}
                    <div>
                      <div className="font-semibold">{conv.title || 'Untitled conversation'}</div>
                      <div className={`text-xs ${theme.muted}`}>{new Date(conv.timestamp).toLocaleString()} • {conv.messages.length} messages</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => onLoad(conv)} className="px-2 py-1 rounded-md text-sm bg-cyan-600 text-white hover:bg-cyan-700 flex items-center gap-1"><FolderOpen size={14} /> Open</button>
                    <button onClick={() => onDelete(conv.id)} className="px-2 py-1 rounded-md text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-1"><Trash2 size={14} /> Delete</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default LibraryPanel;