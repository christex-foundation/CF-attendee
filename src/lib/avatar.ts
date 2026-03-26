export function getDiceBearUrl(slug: string): string {
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(slug)}`;
}
