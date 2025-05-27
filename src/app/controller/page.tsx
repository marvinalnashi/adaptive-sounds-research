'use client';
import { useEffect, useState } from 'react';
import Ably from 'ably';

const ably = new Ably.Realtime({
    key: process.env.NEXT_PUBLIC_ABLY_API_KEY!,
    clientId: 'controller-client',
});

const channelName = 'ring-channel';

export default function ControllerPage() {
    const [channel, setChannel] = useState<any>(null);

    useEffect(() => {
        const ch = ably.channels.get(channelName);
        setChannel(ch);
    }, []);

    const ring = (side: 'left' | 'right') => {
        channel?.publish('ring', side);
    };

    return (
        <div className="text-center p-6">
            <h1 className="text-2xl font-bold mb-4">Controller Mode</h1>
            <button onClick={() => ring('left')} className="m-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Ring Left Phone</button>
            <button onClick={() => ring('right')} className="m-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Ring Right Phone</button>
        </div>
    );
}
