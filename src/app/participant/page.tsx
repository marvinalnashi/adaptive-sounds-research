'use client';
import { useEffect, useRef, useState } from 'react';
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
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (!side) return;

        const channel = ably.channels.get('ring-channel');

        const ringHandler = (message: any) => {
            if (message.name === 'ring' && message.data?.side === side) {
                if (!ringing) {
                    const audio = new Audio('/ringtone.mp3');
                    audio.loop = true;
                    audio.play();
                    audioRef.current = audio;
                    setRinging(true);
                }
            }
        };

        const stopHandler = (message: any) => {
            if (message.name === 'stop' && message.data?.side === side) {
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                    setRinging(false);
                }
            }
        };

        const resetHandler = () => {
            setRinging(false);
            audioRef.current?.pause();
            audioRef.current = null;
            window.location.href = '/';
        };

        channel.subscribe('ring', ringHandler);
        channel.subscribe('stop', stopHandler);
        channel.subscribe('reset', resetHandler);

        return () => {
            channel.unsubscribe('ring', ringHandler);
            channel.unsubscribe('stop', stopHandler);
            channel.unsubscribe('reset', resetHandler);
        };
    }, [side, ringing]);

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
