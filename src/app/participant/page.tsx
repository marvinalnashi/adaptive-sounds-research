'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Howl } from 'howler';

export default function Participant() {
    const [side, setSide] = useState<'left' | 'right' | null>(null);
    const [socket, setSocket] = useState<any>(null);
    const [isRinging, setIsRinging] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [reactionTime, setReactionTime] = useState<number | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const sideParam = params.get("side");
        if (sideParam === 'left' || sideParam === 'right') {
            setSide(sideParam);
            const s = io();
            s.emit("join", `participant-${sideParam}`);
            s.on("trigger-ring", (target: string) => {
                if (target === sideParam) playRingtone();
            });
            setSocket(s);
        }
    }, []);

    const playRingtone = () => {
        const sound = new Howl({
            src: ['/ringtone.mp3'],
            loop: true,
            html5: true,
        });
        sound.play();
        setStartTime(Date.now());
        setIsRinging(true);

        setTimeout(() => {
            sound.stop();
        }, 10000);
    };

    const handlePickup = () => {
        if (startTime) {
            const reaction = Date.now() - startTime;
            setReactionTime(reaction);
            setIsRinging(false);
        }
    };

    if (!side)
        return <p style={{ padding: '2rem', textAlign: 'center' }}>Missing participant side</p>;

    return (
        <main style={{ textAlign: 'center', padding: '2rem' }}>
            <h1>Participant ({side})</h1>
            {isRinging && <button onClick={handlePickup}>Pickup</button>}
            {reactionTime && <p>Reaction time: {reactionTime} ms</p>}
        </main>
    );
}
