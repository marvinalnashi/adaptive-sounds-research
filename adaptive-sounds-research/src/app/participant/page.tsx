'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Howl } from 'howler';

const sound = new Howl({
    src: ['/ringtone.mp3'],
    loop: true,
});

export default function Participant() {
    const [isRinging, setIsRinging] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [reactionTime, setReactionTime] = useState<number | null>(null);

    useEffect(() => {
        const socket = io();
        socket.on("connect", () => {
            console.log("Connected to socket");
        });
        socket.on("trigger-ring", (data) => {
            if (data.target === "left" || data.target === "right") {
                console.log("Ringing on:", data.target);
                startRing();
            }
        });
    }, []);

    const startRing = () => {
        sound.play();
        const now = Date.now();
        setStartTime(now);
        setIsRinging(true);
    };

    const stopRing = () => {
        sound.stop();
        setIsRinging(false);
    };

    const handlePickup = () => {
        if (startTime) {
            const reaction = Date.now() - startTime;
            setReactionTime(reaction);
            console.log('Pickup reaction time (ms):', reaction);
            stopRing();
        }
    };

    return (
        <div>
            <h1>Participant Mode</h1>
            {isRinging && <button onClick={handlePickup}>Pickup</button>}
            {reactionTime && <p>Reaction time: {reactionTime} ms</p>}
        </div>
    );
}
