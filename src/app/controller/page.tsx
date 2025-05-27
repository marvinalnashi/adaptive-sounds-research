'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export default function Controller() {
    const [socket, setSocket] = useState<any>(null);

    useEffect(() => {
        const s = io();
        setSocket(s);
        s.emit("join", "controller");
    }, []);

    const triggerPhone = (target: 'left' | 'right') => {
        socket?.emit("ring", target);
    };

    return (
        <main style={{ textAlign: 'center', padding: '2rem' }}>
            <h1>Controller Mode</h1>
            <button onClick={() => triggerPhone('left')}>Ring left</button>
            <button onClick={() => triggerPhone('right')}>Ring right</button>
        </main>
    );
}
