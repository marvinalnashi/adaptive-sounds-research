'use client';

import { useEffect, useState } from 'react';
import { Howl } from 'howler';
import { useChannel } from '@ably-labs/react-hooks';

export default function ParticipantPage() {
    const [side, setSide] = useState<'left' | 'right' | null>(null);
    const [ringing, setRinging] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [reactionTime, setReactionTime] = useState<number | null>(null);

    const [channel] = useChannel('ring-channel', (message) => {
        if (message.name === 'ring' && message.data.target === side) {
            const sound = new Howl({ src: ['/ringtone.mp3'], loop: true });
            sound.play();
            setStartTime(Date.now());
            setRinging(true);
            setTimeout(() => {
                sound.stop();
                setRinging(false);
            }, 10000);
        }
    });

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const s = params.get('side');
        if (s === 'left' || s === 'right') setSide(s);
    }, []);

    const handlePickup = () => {
        if (startTime) {
            setReactionTime(Date.now() - startTime);
            setRinging(false);
        }
    };

    if (!side) return <p className="p-6 text-center">No side specified</p>;

    return (
        <main className="text-center p-6">
            <h1 className="text-2xl font-bold">Participant ({side})</h1>
            {ringing && <button onClick={handlePickup} className="mt-4 px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700">Pickup</button>}
            {reactionTime !== null && <p className="mt-4">Reaction Time: {reactionTime} ms</p>}
        </main>
    );
}
