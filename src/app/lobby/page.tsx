'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';

let socket: any;

export default function LobbyPage() {
    const [status, setStatus] = useState<string[]>([]);
    const [connected, setConnected] = useState(false);
    const [roleSelected, setRoleSelected] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        socket = io();
        socket.on('connect', () => setConnected(true));
        socket.on('status-update', (clients: string[]) => setStatus(clients));
    }, []);

    const handleSelectRole = (role: string) => {
        socket.emit("join", role);
        setRoleSelected(role);
    };

    const ready = status.includes('controller') &&
        status.includes('participant-left') &&
        status.includes('participant-right');

    const enterApp = () => {
        if (roleSelected === 'controller') router.push('/controller');
        if (roleSelected === 'participant-left' || roleSelected === 'participant-right') router.push('/participant?side=' + roleSelected.split('-')[1]);
    };

    return (
        <main style={{ textAlign: 'center', padding: '2rem' }}>
            <h1>Lobby</h1>
            <p>{connected ? 'Connected to server' : 'Connecting...'}</p>
            <div style={{ marginTop: '1rem' }}>
                <p>Select your role:</p>
                <button onClick={() => handleSelectRole('controller')}>Controller</button>
                <button onClick={() => handleSelectRole('participant-left')}>Participant Left</button>
                <button onClick={() => handleSelectRole('participant-right')}>Participant Right</button>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <h3>Connected roles:</h3>
                <ul>
                    {status.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
            </div>

            {ready && roleSelected && (
                <div style={{ marginTop: '2rem' }}>
                    <button onClick={enterApp}>Enter {roleSelected}</button>
                </div>
            )}
        </main>
    );
}
