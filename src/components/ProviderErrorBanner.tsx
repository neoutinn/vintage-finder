import type { ProviderError } from '@/lib/providers/types';

export default function ProviderErrorBanner({ errors }: { errors: ProviderError[] }) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="terminal-box" style={{ opacity: 0.8 }}>
      {errors.map((error) => (
        <div key={error.source}>
          [!] {error.source.toUpperCase()} UNAVAILABLE — {error.message}
        </div>
      ))}
    </div>
  );
}
