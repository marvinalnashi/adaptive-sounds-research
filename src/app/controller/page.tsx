'use client';

import { AblyProvider, useChannel } from 'ably/react';
import { Realtime } from 'ably';

const client = new Realtime({ key: process.env.NEXT_PUBLIC_ABLY_API_KEY! });

function ControllerPage() {
    const { channel } = useChannel('ring-channel');

    const ring = (target: 'left' | 'right') => {
        channel.publish('ring', { target });
    };

    return (
        <main className="text-center p-6">
            <h1 className="text-2xl font-bold mb-4">Controller Mode</h1>
            <button onClick={() => ring('left')} className="m-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Ring Left</button>
            <button onClick={() => ring('right')} className="m-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Ring Right</button>
        </main>
    );
}

export default function Controller() {
    return (
        <AblyProvider client={client}>
            <ControllerPage />
        </AblyProvider>
    );
}
