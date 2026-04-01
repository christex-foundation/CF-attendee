import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-brand-pink via-brand-pink-light to-brand-purple">
      <div className="text-center px-6">
        <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4">404</h1>
        <p className="text-white/80 text-base sm:text-lg mb-8">
          This page doesn&apos;t exist
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-3 bg-white text-brand-pink font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
