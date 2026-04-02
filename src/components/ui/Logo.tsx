interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: { icon: 24, text: "text-base", gap: "gap-2" },
  md: { icon: 32, text: "text-xl", gap: "gap-2.5" },
  lg: { icon: 40, text: "text-2xl", gap: "gap-3" },
};

export default function Logo({ size = "md", className = "" }: LogoProps) {
  const s = sizes[size];

  return (
    <div className={`flex items-center ${s.gap} ${className}`}>
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shield shape */}
        <path
          d="M20 2L4 10v10c0 10.55 6.82 20.42 16 23 9.18-2.58 16-12.45 16-23V10L20 2z"
          fill="url(#shield-grad)"
        />
        {/* Inner highlight */}
        <path
          d="M20 5L7 12v8.5c0 8.94 5.55 17.3 13 19.5 7.45-2.2 13-10.56 13-19.5V12L20 5z"
          fill="#1A1A1A"
        />
        {/* C letter */}
        <path
          d="M23.5 14.5a7 7 0 1 0 0 11"
          stroke="url(#c-grad)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        {/* Checkmark accent */}
        <path
          d="M18 20l2.5 2.5L25 17"
          stroke="#C4A265"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="shield-grad" x1="20" y1="2" x2="20" y2="35" gradientUnits="userSpaceOnUse">
            <stop stopColor="#C4A265" />
            <stop offset="1" stopColor="#8B7355" />
          </linearGradient>
          <linearGradient id="c-grad" x1="14" y1="14" x2="24" y2="26" gradientUnits="userSpaceOnUse">
            <stop stopColor="#C4A265" />
            <stop offset="1" stopColor="#E8D5B0" />
          </linearGradient>
        </defs>
      </svg>
      <div className="flex flex-col leading-tight">
        <span className={`${s.text} font-extrabold tracking-tight`}>
          <span className="text-[#C4A265]">Quest</span>
          <span className="text-white">Log</span>
        </span>
      </div>
    </div>
  );
}
