"use client";

import { useState } from "react";

const DICEBEAR_STYLES = [
  "adventurer",
  "avataaars",
  "bottts",
  "fun-emoji",
  "lorelei",
  "notionists",
  "open-peeps",
  "thumbs",
];

interface AvatarPickerModalProps {
  open: boolean;
  onClose: () => void;
  slug: string;
  currentAvatarUrl: string | null;
  onUpdated: (newUrl: string) => void;
}

export default function AvatarPickerModal({
  open,
  onClose,
  slug,
  currentAvatarUrl,
  onUpdated,
}: AvatarPickerModalProps) {
  const [selected, setSelected] = useState<string | null>(currentAvatarUrl);
  const [customUrl, setCustomUrl] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  function getDiceBearUrl(style: string, seed: string) {
    return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
  }

  // Generate style-based options
  const styleOptions = DICEBEAR_STYLES.map((style) => ({
    label: style,
    url: getDiceBearUrl(style, slug),
  }));

  // Generate seed-variant options for more variety
  const seedVariants = [`${slug}-v2`, `${slug}-v3`, `${slug}-v4`, `${slug}-v5`];
  const variantOptions = seedVariants.map((seed, i) => ({
    label: `variant-${i + 2}`,
    url: getDiceBearUrl("adventurer", seed),
  }));

  const allOptions = [...styleOptions, ...variantOptions];

  async function handleSave() {
    const avatarUrl = showCustom ? customUrl.trim() : selected;

    if (!avatarUrl) {
      setError("Please select an avatar or enter a URL");
      return;
    }

    if (showCustom && !avatarUrl.startsWith("https://")) {
      setError("URL must start with https://");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/student/${slug}/avatar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update avatar");
        return;
      }

      onUpdated(avatarUrl);
      onClose();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-white mb-4">Change Avatar</h2>

        {error && (
          <div className="bg-red-500/20 text-red-400 text-sm p-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {/* Current preview */}
        <div className="flex justify-center mb-4">
          <img
            src={showCustom && customUrl.trim() ? customUrl.trim() : (selected || allOptions[0].url)}
            alt="Preview"
            width={72}
            height={72}
            className="rounded-full border-2 border-[#C4A265]"
            onError={(e) => {
              (e.target as HTMLImageElement).src = allOptions[0].url;
            }}
          />
        </div>

        {/* Toggle between picker and custom URL */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setShowCustom(false)}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition cursor-pointer ${
              !showCustom
                ? "bg-[#C4A265] text-white"
                : "bg-[#2A2A2A] text-[#999] hover:text-white"
            }`}
          >
            Pick Avatar
          </button>
          <button
            type="button"
            onClick={() => setShowCustom(true)}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition cursor-pointer ${
              showCustom
                ? "bg-[#C4A265] text-white"
                : "bg-[#2A2A2A] text-[#999] hover:text-white"
            }`}
          >
            Custom Image
          </button>
        </div>

        {!showCustom ? (
          /* Avatar grid */
          <div className="grid grid-cols-4 gap-2 mb-4">
            {allOptions.map((opt) => (
              <button
                key={opt.url}
                type="button"
                onClick={() => setSelected(opt.url)}
                className={`p-1.5 rounded-xl transition cursor-pointer ${
                  selected === opt.url
                    ? "ring-2 ring-[#C4A265] bg-[#333]"
                    : "hover:bg-[#2A2A2A]"
                }`}
              >
                <img
                  src={opt.url}
                  alt={opt.label}
                  width={48}
                  height={48}
                  className="rounded-full mx-auto"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        ) : (
          /* Custom URL input */
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#999] mb-1">
              Image URL
            </label>
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://example.com/my-photo.jpg"
              className="w-full px-4 py-3 border border-[#333] rounded-xl focus:ring-2 focus:ring-[#C4A265] focus:border-transparent outline-none transition text-white bg-[#2A2A2A] placeholder-[#666]"
            />
            <p className="text-xs text-[#666] mt-1">
              Paste a link to any image (JPG, PNG, GIF, WebP)
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-[#333] text-[#999] font-medium rounded-xl hover:bg-[#2A2A2A] transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-2.5 bg-[#C4A265] text-white font-semibold rounded-xl hover:bg-[#B08F50] transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
