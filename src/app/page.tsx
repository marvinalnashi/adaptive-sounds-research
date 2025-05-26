'use client';

import Link from 'next/link';

export default function Home() {
  return (
      <main style={{ textAlign: 'center', padding: '2rem' }}>
        <h1>Adaptive Sounds Application</h1>
        <p>Select a mode to begin:</p>
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <Link href="/controller">
            <button style={{ padding: '1rem', fontSize: '1rem' }}>Controller mode</button>
          </Link>
          <Link href="/participant">
            <button style={{ padding: '1rem', fontSize: '1rem' }}>Participant mode</button>
          </Link>
        </div>
      </main>
  );
}
