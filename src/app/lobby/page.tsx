'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Ably from 'ably';
import Cookies from 'js-cookie';
import { v4 as uuidv4 } from 'uuid';

const ably = new Ably.Realtime({
    key: process.env.NEXT_PUBLIC_ABLY_API_KEY!,
    clientId: `lobby-client-${uuidv4()}`,
});

const channelName = 'role-selection';

export default function LobbyPage() {
    const [connectedRoles, setConnectedRoles] = useState<string[]>([]);
    const [role, setRole] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const channel = ably.channels.get(channelName);

        const handleMessage = (message: any) => {
            const newRole = message.data;
            setConnectedRoles((prev) => {
                if (!prev.includes(newRole)) {
                    return [...prev, newRole];
                }
                return prev;
            });
        };

        channel.subscribe('role', handleMessage);

        return () => {
            channel.unsubscribe('role', handleMessage);
        };
    }, []);

    useEffect(() => {
        if (
            role &&
            connectedRoles.includes('controller') &&
            connectedRoles.includes('participant-left') &&
            connectedRoles.includes('participant-right')
        ) {
            const sessionId = uuidv4();
            Cookies.set('ably-session', JSON.stringify({ role, sessionId }), { expires: 1 });

            if (role === 'controller') router.push('/controller');
            if (role === 'participant-left') router.push('/participant?side=left');
            if (role === 'participant-right') router.push('/participant?side=right');
        }
    }, [role, connectedRoles, router]);

    const selectRole = (selectedRole: string) => {
        if (!connectedRoles.includes(selectedRole)) {
            setRole(selectedRole);
            const channel = ably.channels.get(channelName);
            channel.publish('role', selectedRole);
        }
    };

    return (
        <div className="text-center p-6">
            <h1 className="text-2xl font-bold mb-4">Lobby</h1>
            <p>Connected roles: {connectedRoles.join(', ') || 'None'}</p>
            {!role && (
                <div>
                    <button onClick={() => selectRole('controller')} className="mt-6 px-6 py-2 mr-2 bg-green-600 text-white rounded hover:bg-green-700">Enter as Controller</button>
                    <button onClick={() => selectRole('participant-left')} className="mt-6 px-6 py-2 mr-2 bg-green-600 text-white rounded hover:bg-green-700">Enter as Participant Left</button>
                    <button onClick={() => selectRole('participant-right')} className="mt-6 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">Enter as Participant Right</button>
                </div>
            )}
            {role && (
                <p className="mt-4">
                    You have entered as <strong>{role}</strong>. Waiting for all roles to join...
                </p>
            )}
        </div>
    );
}
