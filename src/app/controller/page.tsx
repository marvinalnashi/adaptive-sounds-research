'use client';

export const dynamic = "force-dynamic";
import '@/utils/ablyConfig';
import { useChannel } from '@ably-labs/react-hooks';

export default function ControllerPage() {
    const [channel] = useChannel('ring-channel', () => {});

    const ring = (target: 'left' | 'right') => {
        channel.publish('ring', { target });
    };

    return (
        <main className="text-center p-6">
            <h1 className="text-2xl font-bold mb-4">Controller Mode</h1>
            <button onClick={() => ring('left')} className="m-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                Ring Left
            </button>
            <button onClick={() => ring('right')} className="m-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                Ring Right
            </button>
        </main>
    );
}
