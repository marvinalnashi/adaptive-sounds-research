'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import Ably from 'ably';
import { logSessionData } from '@/utils/sessionLogger';

const ably = new Ably.Realtime({ key: process.env.NEXT_PUBLIC_ABLY_API_KEY!, clientId: 'controller-client' });
const channel = ably.channels.get('ring-channel');

export default function ControllerPage() {
    const router = useRouter();
    const [ringingSide, setRingingSide] = useState<'left' | 'right' | null>(null);
    const [ringStartTime, setRingStartTime] = useState<number | null>(null);
    const [adaptivity, setAdaptivity] = useState<'yes' | 'no'>('no');
    const [backgroundNoise, setBackgroundNoise] = useState<1 | 2 | 3>(1);

    const sessionCookie = Cookies.get('ably-session');
    const sessionData = sessionCookie ? JSON.parse(sessionCookie) : null;
    const sessionId = sessionData?.sessionId || '';
    const role = sessionData?.role || 'controller';

    useEffect(() => {
        const handlePickup = (message: any) => {
            if (message.name === 'pickup') {
                const pickupTime = Date.now();
                const duration = ringStartTime ? pickupTime - ringStartTime : null;

                logSessionData({
                    sessionId,
                    role,
                    userAgent: navigator.userAgent,
                    event: 'pickup',
                    side: message.data.side,
                    pickupTimeMs: duration || undefined,
                });

                setRingingSide(null);
                setRingStartTime(null);
            }
        };

        channel.subscribe('pickup', handlePickup);

        return () => {
            channel.unsubscribe('pickup', handlePickup);
        };
    }, [ringStartTime]);

    const ringPhone = async (side: 'left' | 'right') => {
        if (ringingSide) return;
        const timestamp = Date.now();

        channel.publish('ring', { side, timestamp });
        setRingingSide(side);
        setRingStartTime(timestamp);

        await logSessionData({
            sessionId,
            role,
            userAgent: navigator.userAgent,
            event: 'ring',
            side,
            adaptiveVolume: adaptivity === 'yes',
            backgroundNoiseLevel: backgroundNoise,
        });
    };

    const stopRing = async (side: 'left' | 'right') => {
        channel.publish('stop', { side });
        setRingingSide(null);
        setRingStartTime(null);

        await logSessionData({
            sessionId,
            role,
            userAgent: navigator.userAgent,
            event: 'stop',
            side,
        });
    };

    const exitSession = async () => {
        await logSessionData({
            sessionId,
            role,
            userAgent: navigator.userAgent,
            event: 'exit',
        });

        Cookies.remove('ably-session');
        channel.publish('reset', {});
        router.push('/');
    };

    return (
        <div className="p-6 max-w-lg mx-auto">
            <h1 className="text-2xl font-bold mb-4">Controller Mode</h1>

            <div className="mb-4">
                <p className="font-semibold">Adaptivity of Ringtone Volume:</p>
                <div className="space-x-2 mt-2">
                    <button className={`px-3 py-1 border rounded ${adaptivity === 'yes' ? 'bg-green-300' : 'bg-gray-200'}`} onClick={() => setAdaptivity('yes')}>Yes</button>
                    <button className={`px-3 py-1 border rounded ${adaptivity === 'no' ? 'bg-red-300' : 'bg-gray-200'}`} onClick={() => setAdaptivity('no')}>No</button>
                </div>
            </div>

            <div className="mb-4">
                <p className="font-semibold">Background Noise Level:</p>
                <div className="space-x-2 mt-2">
                    {[1, 2, 3].map((level) => (
                        <button
                            key={level}
                            className={`px-3 py-1 border rounded ${backgroundNoise === level ? 'bg-blue-300' : 'bg-gray-200'}`}
                            onClick={() => setBackgroundNoise(level as 1 | 2 | 3)}
                        >
                            {level}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {(['left', 'right'] as const).map((side) => (
                    <div key={side}>
                        <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={() => ringPhone(side)} disabled={ringingSide !== null}>
                            Ring {side === 'left' ? 'Left' : 'Right'} Phone
                        </button>
                        {ringingSide === side && (
                            <button className="ml-2 px-4 py-2 bg-red-500 text-white rounded" onClick={() => stopRing(side)}>
                                Stop Ringing
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <button onClick={exitSession} className="mt-6 bg-black text-white px-4 py-2 rounded">Exit Session</button>
        </div>
    );
}
