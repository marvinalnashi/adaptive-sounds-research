'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Ably from 'ably';
import { Suspense } from 'react';

const ably = new Ably.Realtime({
    key: process.env.NEXT_PUBLIC_ABLY_API_KEY!,
    clientId: 'participant-client',
});

function ParticipantInner() {
    const searchParams = useSearchParams();
    const side = searchParams?.get('side');
    const [ringing, setRinging] = useState(false);

    useEffect(() => {
        if (!side) return;

        const channel = ably.channels.get('ring-channel');

        const handler = (message: any) => {
            if (message.name === 'ring' && message.data?.side === side) {
                const audio = new Audio('/ringtone.mp3');
                audio.play();
                setRinging(true);
                setTimeout(() => setRinging(false), 5000);
            }
        };

        channel.subscribe('ring', handler);

        return () => {
            channel.unsubscribe('ring', handler);
        };
    }, [side]);

    return (
        <div className="text-center p-6">
            <h1 className="text-2xl font-bold mb-4">Participant Mode</h1>
            {side ? (
                <p>This device is the <strong>{side}</strong> phone</p>
            ) : (
                <p className="text-red-500">Error: side not defined</p>
            )}
            {ringing && <p className="text-green-600 mt-4 font-bold">Ringing!</p>}
        </div>
    );
}

export default function ParticipantPage() {
    return (
        <Suspense fallback={<p className="text-center">Loading participant mode...</p>}>
            <ParticipantInner />
        </Suspense>
    );
}
