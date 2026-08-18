export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"
          fill="currentColor"
          className="text-brand"
        />
      </svg>
      <span className="text-foreground">Lead</span>
      <span className="text-brand lv-glow-text">Volt</span>
    </span>
  );
}
