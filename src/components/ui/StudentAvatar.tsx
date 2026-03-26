"use client";

import { useState } from "react";
import { getDiceBearUrl } from "@/lib/avatar";

interface StudentAvatarProps {
  slug: string;
  name: string;
  size?: number;
  className?: string;
}

export default function StudentAvatar({
  slug,
  name,
  size = 32,
  className = "",
}: StudentAvatarProps) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div
        className={`rounded-full bg-[#F5E6D3] flex items-center justify-center font-bold text-[#8B7355] shrink-0 ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={getDiceBearUrl(slug)}
      alt={name}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setError(true)}
      className={`rounded-full shrink-0 ${className}`}
    />
  );
}
