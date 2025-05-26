'use client';

export default function Controller() {
    const triggerPhone = async (phone: 'left' | 'right') => {
        await fetch(`/api/ring?device=${phone}`);
    };

    return (
        <div>
            <h1>Controller Mode</h1>
            <button onClick={() => triggerPhone('left')}>Ring Left Phone</button>
            <button onClick={() => triggerPhone('right')}>Ring Right Phone</button>
        </div>
    );
}