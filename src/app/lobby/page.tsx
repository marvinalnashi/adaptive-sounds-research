'use client';

export const dynamic = "force-dynamic";
import '@/utils/ablyConfig';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChannel } from '@ably-labs/react-hooks';

const roles = ['controller', 'participant-left', 'participant-right'] as const;

export default function LobbyPage() {
    const router = useRouter();
    const [role, setRole] = useState<string | null>(null);
    const [connectedRoles, setConnectedRoles] = useState<string[]>([]);
    const [channel] = useChannel('lobby', (message) => {
        if (message.name === 'roles') {
            setConnectedRoles(message.data);
        }
    });

    useEffect(() => {
        if (role) {
            const updated = [...new Set([...connectedRoles, role])];
            channel.publish('roles', updated);
        }
    }, [role]);

    const enter = () => {
        if (role === 'controller') router.push('/controller');
        else if (role?.startsWith('participant')) {
            const side = role.split('-')[1];
            router.push(`/participant?side=${side}`);
        }
    };

    const ready = roles.every((r) => connectedRoles.includes(r));

    return (
        <main className="text-center p-6">
            <h1 className="text-2xl font-bold mb-4">Lobby</h1>
            <p>Select your role:</p>
            {roles.map((r) => (
                <button key={r} onClick={() => setRole(r)} className="m-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    {r.replace('-', ' ')}
                </button>
            ))}
            <div className="mt-6">
                <h3 className="text-lg font-semibold">Connected Roles</h3>
                <ul>{connectedRoles.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </div>
            {ready && role && (
                <button onClick={enter} className="mt-6 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                    Enter as {role}
                </button>
            )}
        </main>
    );
}
