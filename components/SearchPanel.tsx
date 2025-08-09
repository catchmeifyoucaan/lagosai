import React, { useMemo, useState } from 'react';
import { ThemeColors, Conversation, Message } from '../types';

interface SearchPanelProps {
  theme: ThemeColors;
  conversations: Conversation[];
  currentMessages: Message[];
  onOpenConversation: (conversation: Conversation) => void;
  onClose: () => void;
}

const highlight = (text: string, query: string) => {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    text.slice(0, idx) + '[[' + text.slice(idx, idx + query.length) + ']]' + text.slice(idx + query.length)
  );
};

const SearchPanel: React.FC<SearchPanelProps> = ({ theme, conversations, currentMessages, onOpenConversation, onClose }) => {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return [] as Array<{ where: string; title: string; snippet: string; conv?: Conversation }>;
    const inCurrent = currentMessages
      .filter(m => typeof m.content === 'string' && m.content.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 20)
      .map(m => ({ where: 'Current chat', title: new Date(m.timestamp).toLocaleString(), snippet: highlight(m.content.slice(0, 140), query) }));

    const inLibrary = conversations.flatMap(conv =>
      conv.messages
        .filter(m => typeof m.content === 'string' && m.content.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 3)
        .map(m => ({ where: 'Library', title: conv.title || new Date(conv.timestamp).toLocaleString(), snippet: highlight(m.content.slice(0, 140), query), conv }))
    ).slice(0, 50);

    return [...inCurrent, ...inLibrary];
  }, [query, currentMessages, conversations]);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`${theme.card} rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 p-4 border-b dark:border-gray-700">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search current chat and library..."
            className={`w-full px-3 py-2 rounded-lg border text-sm ${theme.input} border-gray-300 dark:border-gray-600`}
          />
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">&times;</button>
        </div>
        <div className="overflow-y-auto p-4 space-y-2">
          {results.length === 0 ? (
            <p className={theme.muted}>Type to search...</p>
          ) : (
            results.map((r, idx) => (
              <div key={idx} className="p-3 rounded-lg border dark:border-gray-700">
                <div className="text-xs text-gray-500">{r.where}</div>
                <div className="font-medium">{r.title}</div>
                <div className={`${theme.muted} text-sm whitespace-pre-wrap`}>{r.snippet.replaceAll('[[', '**').replaceAll(']]', '**')}</div>
                {r.conv && (
                  <button onClick={() => onOpenConversation(r.conv!)} className="mt-2 text-sm px-2 py-1 rounded-md bg-cyan-600 text-white hover:bg-cyan-700">Open conversation</button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPanel;