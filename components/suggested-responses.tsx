import React from 'react';

export function SuggestedResponses({ suggestions, onSelect }: { suggestions: string[]; onSelect: (text: string) => void }) {
  if (!suggestions || suggestions.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2 mb-4 justify-center">
      {suggestions.map((s, i) => (
        <button
          key={s}
          className="px-4 py-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-900 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
          onClick={() => onSelect(s)}
          tabIndex={0}
          aria-label={`Select suggested response: ${s}`}
        >
          {s}
        </button>
      ))}
    </div>
  );
} 