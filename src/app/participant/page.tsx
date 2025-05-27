'use client';

import { useEffect, useState } from 'react';
import { Howl } from 'howler';
import { AblyProvider, useChannel } from 'ably/react';
import { Realtime } from 'ably';

const client = new Realtime({ key: process.env.NEXT_PUBLIC_ABLY_API_KEY! });

function ParticipantPage() {
    const [side, setSide] = useState<'left' | 'right' | null>(null);
    const [ringing, setRinging] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [reactionTime, setReactionTime] = useState<number | null>(null);
    const { channel } = useChannel('ring-channel', (msg) => {
        if (msg.name === 'ring' && msg.data.target === side) {
            play();
        }
    });

    useEffect(() => {
        const p = new URLSearchParams(window.location.search);
        const s = p.get('side');
        if (s === 'left' || s === 'right') setSide(s);
    }, []);

    const play = () => {
        const sound = new Howl({ src: ['/ringtone.mp3'], loop: true, html5: true });
        sound.play();
        setStartTime(Date.now());
        setRinging(true);
        setTimeout(() => sound.stop(), 10000);
    };

    const pickup = () => {
        if (startTime) {
            setReactionTime(Date.now() - startTime);
            setRinging(false);
        }
    };

    if (!side) return <p className="p-6 text-center">No side specified</p>;

    return (
        <main className="text-center p-6">
            <h1 className="text-2xl font-bold">Participant ({side})</h1>
            {ringing && <button onClick={pickup} className="mt-4 px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700">Pickup</button>}
            {reactionTime !== null && <p className="mt-4">Reaction Time: {reactionTime} ms</p>}
        </main>
    );
}

export default function Participant() {
    return (
        <AblyProvider client={client}>
            <ParticipantPage />
        </AblyProvider>
    );
}
