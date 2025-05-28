'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Ably from 'ably';
import Cookies from 'js-cookie';
import { Timestamp } from 'firebase/firestore';
import { logSessionData } from '@/utils/sessionLogger';

const ably = new Ably.Realtime({ key: process.env.NEXT_PUBLIC_ABLY_API_KEY!, clientId: 'participant-client' });
const channel = ably.channels.get('ring-channel');

function ParticipantInner() {
    const searchParams = useSearchParams();
    const side = searchParams?.get('side') as 'left' | 'right' | null;

    const [ringing, setRinging] = useState(false);
    const [ringStartTime, setRingStartTime] = useState<number | null>(null);
    const [sessionInfo, setSessionInfo] = useState<any>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const sessionId = JSON.parse(Cookies.get('ably-session') || '{}')?.sessionId;
    const role = side === 'left' ? 'participant-left' : 'participant-right';

    useEffect(() => {
        const ringHandler = (message: any) => {
            if (message.name === 'ring' && message.data?.side === side) {
                const audio = new Audio('/ringtone.mp3');
                audio.loop = true;
                audio.play();
                audioRef.current = audio;
                setRingStartTime(message.data.timestamp);
                setRinging(true);
                setSessionInfo(message.data);
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
            audioRef.current?.pause();
            audioRef.current = null;
            setRinging(false);
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
    }, [side]);

    const pickup = () => {
        if (!ringStartTime || !side || !sessionInfo) return;

        const pickupTimestamp = Date.now();
        const pickupDelay = pickupTimestamp - ringStartTime;

        logSessionData({
            sessionId: sessionInfo.sessionId,
            role,
            userAgent: navigator.userAgent,
            events: [{
                event: 'pickup',
                side,
                timestamp: Timestamp.fromMillis(pickupTimestamp),
                pickupTimeMs: pickupDelay,
            }],
            adaptiveVolume: sessionInfo.adaptiveVolume,
            backgroundNoiseLevel: sessionInfo.backgroundNoiseLevel
        });

        channel.publish('pickup', { side });
        setRinging(false);
        audioRef.current?.pause();
        audioRef.current = null;
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
