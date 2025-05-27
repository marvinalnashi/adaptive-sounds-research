'use client';
import { useEffect, useState } from 'react';
import Ably from 'ably';

const ably = new Ably.Realtime({
    key: process.env.NEXT_PUBLIC_ABLY_API_KEY!,
    clientId: 'participant-client',
});

const channelName = 'ring-channel';

export default function ParticipantPage() {
    const [side, setSide] = useState<string | null>(null);
    const [ringing, setRinging] = useState(false);

    useEffect(() => {
        const channel = ably.channels.get(channelName);

        const handler = (message: any) => {
            if (message.name === 'ring' && message.data === side) {
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
            <h1>Participant Mode</h1>
            {!side && (
                <div>
                    <button onClick={() => setSide('left')}>Set Side: Left</button>
                    <button onClick={() => setSide('right')}>Set Side: Right</button>
                </div>
            )}
            {side && <p>This device is the <strong>{side}</strong> phone</p>}
            {ringing && <p>Ringing!</p>}
        </div>
    );
}
