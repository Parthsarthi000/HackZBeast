export function EmptyStateIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Book/Flashcard Stack */}
      <rect x="60" y="70" width="80" height="60" rx="4" fill="#E5E7EB" />
      <rect x="65" y="65" width="80" height="60" rx="4" fill="#D1D5DB" />
      <rect x="70" y="60" width="80" height="60" rx="4" fill="#3B82F6" fillOpacity="0.2" />
      
      {/* Lines representing text */}
      <line x1="85" y1="75" x2="135" y2="75" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
      <line x1="85" y1="85" x2="125" y2="85" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
      <line x1="85" y1="95" x2="130" y2="95" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
      
      {/* Sparkle effect */}
      <circle cx="165" cy="45" r="3" fill="#FBBF24" />
      <circle cx="35" cy="90" r="2" fill="#14B8A6" />
      <circle cx="170" cy="140" r="2.5" fill="#F97316" />
    </svg>
  );
}
