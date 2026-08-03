'use client';

import { useState } from 'react';

type Props = {
  platform: 'depop' | 'facebook';
  label: string;
  connected: boolean;
  onConnected: () => void;
};

export default function ConnectAccountButton({ platform, label, connected, onConnected }: Props) {
  const [isConnecting, setIsConnecting] = useState(false);

  async function handleClick() {
    setIsConnecting(true);
    try {
      await fetch('/api/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      });
      onConnected();
    } finally {
      setIsConnecting(false);
    }
  }

  return (
    <button type="button" onClick={handleClick} disabled={isConnecting}>
      {isConnecting
        ? 'COMPLETE LOGIN IN THE OPENED WINDOW...'
        : connected
          ? `${label}: CONNECTED (RECONNECT)`
          : `CONNECT ${label}`}
    </button>
  );
}
