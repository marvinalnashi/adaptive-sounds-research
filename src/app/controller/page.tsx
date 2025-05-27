'use client';
import { useEffect, useRef, useState } from 'react';
import Ably from 'ably';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

const ably = new Ably.Realtime({
    key: process.env.NEXT_PUBLIC_ABLY_API_KEY!,
    clientId: 'controller-client',
});

export default function ControllerPage() {
    const channelRef = useRef<any>(null);
    const [ringingLeft, setRingingLeft] = useState(false);
    const [ringingRight, setRingingRight] = useState(false);
    const router = useRouter();

    useEffect(() => {
        channelRef.current = ably.channels.get('ring-channel');
    }, []);

    const ring = (side: 'left' | 'right') => {
        channelRef.current?.publish('ring', { side });
        if (side === 'left') setRingingLeft(true);
        if (side === 'right') setRingingRight(true);
    };

    const stopRing = (side: 'left' | 'right') => {
        channelRef.current?.publish('stop', { side });
        if (side === 'left') setRingingLeft(false);
        if (side === 'right') setRingingRight(false);
    };

    const exitSession = () => {
        Cookies.remove('ably-session');
        channelRef.current?.publish('reset', {});
        router.push('/');
    };

    return (
        <div className="text-center p-6">
            <h1 className="text-2xl font-bold mb-4">Controller Mode</h1>

            <div className="mb-6">
                <button onClick={() => ring('left')} className="m-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                    Ring Left Phone
                </button>
                {ringingLeft && (
                    <button onClick={() => stopRing('left')} className="m-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                        Stop Ringing Left
                    </button>
                )}
            </div>

            <div className="mb-6">
                <button onClick={() => ring('right')} className="m-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                    Ring Right Phone
                </button>
                {ringingRight && (
                    <button onClick={() => stopRing('right')} className="m-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                        Stop Ringing Right
                    </button>
                )}
            </div>

            <button onClick={exitSession} className="mt-4 px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-900">
                Exit Session
            </button>
        </div>
    );
}
