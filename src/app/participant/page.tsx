'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Ably from 'ably';
import { logSessionData } from '@/utils/sessionLogger';
import Cookies from 'js-cookie';
import { Timestamp } from 'firebase/firestore';

const ably = new Ably.Realtime({ key: process.env.NEXT_PUBLIC_ABLY_API_KEY!, clientId: 'participant-client' });

function ParticipantInner() {
    const searchParams = useSearchParams();
    const side = searchParams?.get('side') as 'left' | 'right' | null;
    const [ringing, setRinging] = useState(false);
    const [ringStartTime, setRingStartTime] = useState<number | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const sessionId = JSON.parse(Cookies.get('ably-session') || '{}')?.sessionId || `session-${Date.now()}`;
    const role = side === 'left' ? 'participant-left' : 'participant-right';

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
                    setRingStartTime(Date.now());
                    setRinging(true);
                }
            }
        };

        const stopHandler = (message: any) => {
            if (message.name === 'stop' && message.data?.side === side) {
                audioRef.current?.pause();
                audioRef.current = null;
                setRinging(false);
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

    const pickup = () => {
        if (ringing && ringStartTime) {
            const pickupDelay = Date.now() - ringStartTime;

            logSessionData({
                sessionId,
                role,
                userAgent: navigator.userAgent,
                events: [{
                    event: 'pickup',
                    side: side ?? undefined,
                    pickupTimeMs: pickupDelay,
                    timestamp: Timestamp.now()
                }]
            });

            ably.channels.get('ring-channel').publish('pickup', { side });
            setRinging(false);
            audioRef.current?.pause();
            audioRef.current = null;
        }
    };

    return (
        <div className="text-center p-6">
            <h1 className="text-2xl font-bold mb-4">Participant Mode</h1>
            <p>This device is the <strong>{side}</strong> phone</p>
            {ringing && (
                <div>
                    <p className="text-green-600 mt-4 font-bold">Ringing!</p>
                    <button onClick={pickup} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        Pickup
                    </button>
                </div>
            )}
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
