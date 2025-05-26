'use client';

import { useEffect, useState } from 'react';
import { Howl } from 'howler';
import { getAmbientVolume } from '@/utils/microphone';

const sound = new Howl({
    src: ['/ringtone.mp3'],
    loop: true,
});

export default function Participant() {
    const [isRinging, setIsRinging] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [reactionTime, setReactionTime] = useState<number | null>(null);

    const startRing = async () => {
        const volume = (await getAmbientVolume()) / 100;
        sound.volume(Math.min(1, Math.max(0.2, volume)));
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
            // TODO: Store this in Firebase/PostgreSQL
        }
    };

    return (
        <div>
            <h1>Participant Mode</h1>
            <button onClick={startRing}>Simulate Ring</button>
            {isRinging && <button onClick={handlePickup}>Pickup</button>}
            {reactionTime && <p>Reaction time: {reactionTime} ms</p>}
        </div>
    );
}