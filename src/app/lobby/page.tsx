'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AblyProvider, useChannel } from 'ably/react';
import { Realtime } from 'ably';

const client = new Realtime({ key: process.env.NEXT_PUBLIC_ABLY_API_KEY! });

const roles = ['controller', 'participant-left', 'participant-right'] as const;

function LobbyInner() {
    const router = useRouter();
    const [connectedRoles, setConnectedRoles] = useState<string[]>([]);
    const [role, setRole] = useState<string | null>(null);
    const { channel } = useChannel('lobby', (msg) => {
        if (msg.name === 'roles') setConnectedRoles(msg.data);
    });

    useEffect(() => {
        if (role) channel.publish('roles', [...new Set([...connectedRoles, role])]);
    }, [role]);

    const handleSelect = (r: string) => setRole(r);
    const ready = roles.every(r => connectedRoles.includes(r));

    const enter = () => {
        if (role === 'controller') router.push('/controller');
        else if (role?.startsWith('participant')) {
            const side = role.split('-')[1];
            router.push(`/participant?side=${side}`);
        }
    };

    return (
        <main className="text-center p-6">
            <h1 className="text-2xl font-bold mb-4">Lobby</h1>
            <p className="mb-2">Select your role:</p>
            {roles.map(r => (
                <button key={r} onClick={() => handleSelect(r)} className="m-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    {r.replace('-', ' ')}
                </button>
            ))}
            <div className="mt-6">
                <h3 className="text-lg font-semibold">Connected Roles</h3>
                <ul>{connectedRoles.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </div>
            {ready && role && (
                <button onClick={enter} className="mt-6 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">Enter as {role}</button>
            )}
        </main>
    );
}

export default function LobbyPage() {
    return (
        <AblyProvider client={client}>
            <LobbyInner />
        </AblyProvider>
    );
}
