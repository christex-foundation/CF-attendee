"use client";

import { useState, useRef, useEffect } from "react";

const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: "Trophies & Awards",
    emojis: ["🏆", "🥇", "🥈", "🥉", "🎖️", "🏅", "👑", "💎", "⭐", "🌟", "✨", "💫"],
  },
  {
    label: "Education",
    emojis: ["📚", "📖", "✏️", "📝", "🎓", "🧠", "💡", "🔬", "🧪", "🧮", "📐", "🗂️"],
  },
  {
    label: "Fire & Energy",
    emojis: ["🔥", "⚡", "💥", "🚀", "💪", "🎯", "🏹", "⚔️", "🛡️", "🗡️", "🔮", "🧲"],
  },
  {
    label: "Fun & Celebration",
    emojis: ["🎉", "🎊", "🥳", "🎈", "🎁", "🎀", "🪅", "🎇", "🎆", "🍾", "🥂", "🍰"],
  },
  {
    label: "Nature & Animals",
    emojis: ["🦁", "🐉", "🦅", "🐺", "🦈", "🐬", "🦋", "🌈", "🌺", "🍀", "🌵", "🌻"],
  },
  {
    label: "Tech & Tools",
    emojis: ["💻", "⌨️", "🖥️", "📱", "🔧", "⚙️", "🔗", "🗄️", "📡", "🤖", "👾", "🕹️"],
  },
  {
    label: "Hands & Gestures",
    emojis: ["👍", "👏", "🙌", "🤝", "✊", "🤞", "🫡", "🫶", "💯", "❤️", "🩷", "💛"],
  },
];

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  className?: string;
}

export default function EmojiPicker({ value, onChange, className = "" }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    if (isOpen) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const allEmojis = EMOJI_CATEGORIES.flatMap((c) => c.emojis);
  const filteredCategories = search.trim()
    ? [{ label: "Results", emojis: allEmojis.filter(() => true) }]
    : EMOJI_CATEGORIES;

  function selectEmoji(emoji: string) {
    onChange(emoji);
    setIsOpen(false);
    setSearch("");
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-4 py-3 border border-[#E8E0D8] rounded-xl bg-[#FDFAF7] text-left transition hover:border-[#C4A265] focus:ring-2 focus:ring-[#C4A265] focus:border-transparent outline-none cursor-pointer"
      >
        {value ? (
          <span className="text-2xl leading-none">{value}</span>
        ) : (
          <span className="text-[#B0A090] text-sm">Pick an emoji</span>
        )}
        <span className="ml-auto text-[#B0A090] text-xs">
          {isOpen ? "▲" : "▼"}
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#E8E0D8] rounded-xl shadow-xl overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-[#F5F0EB]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type emoji directly..."
              className="w-full px-3 py-2 text-sm border border-[#E8E0D8] rounded-lg bg-[#FDFAF7] text-[#1A1A1A] placeholder-[#B0A090] focus:ring-2 focus:ring-[#C4A265] focus:border-transparent outline-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && search.trim()) {
                  e.preventDefault();
                  onChange(search.trim());
                  setIsOpen(false);
                  setSearch("");
                }
              }}
            />
            {search.trim() && (
              <button
                type="button"
                onClick={() => { onChange(search.trim()); setIsOpen(false); setSearch(""); }}
                className="mt-1.5 w-full text-xs text-[#C4A265] font-semibold hover:underline cursor-pointer text-left px-1"
              >
                Use &quot;{search.trim()}&quot; as custom emoji
              </button>
            )}
          </div>

          {/* Emoji grid */}
          <div className="max-h-52 overflow-y-auto p-2 space-y-2">
            {filteredCategories.map((category) => (
              <div key={category.label}>
                <p className="text-[9px] font-semibold text-[#8B7355] uppercase tracking-wider px-1 mb-1">
                  {category.label}
                </p>
                <div className="grid grid-cols-6 gap-0.5">
                  {category.emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => selectEmoji(emoji)}
                      className={`w-full aspect-square flex items-center justify-center text-xl rounded-lg transition cursor-pointer hover:bg-[#F5E6D3] ${
                        value === emoji ? "bg-[#F5E6D3] ring-2 ring-[#C4A265]" : ""
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Clear button */}
          {value && (
            <div className="p-2 border-t border-[#F5F0EB]">
              <button
                type="button"
                onClick={() => { onChange(""); setIsOpen(false); }}
                className="w-full text-xs text-[#8B7355] hover:text-red-500 font-medium cursor-pointer py-1"
              >
                Clear emoji
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
