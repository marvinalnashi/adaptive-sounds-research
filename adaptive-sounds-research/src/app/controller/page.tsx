'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export default function Controller() {
    const [socket, setSocket] = useState<any>(null);

    useEffect(() => {
        const s = io();
        setSocket(s);
    }, []);

    const triggerPhone = (device: 'left' | 'right') => {
        socket?.emit("ring", { target: device });
    };

    return (
        <div>
            <h1>Controller Mode</h1>
            <button onClick={() => triggerPhone('left')}>Ring left phone</button>
            <button onClick={() => triggerPhone('right')}>Ring right phone</button>
        </div>
    );
}
