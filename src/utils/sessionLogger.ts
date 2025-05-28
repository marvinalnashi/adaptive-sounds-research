import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';

export type Role = 'participant-left' | 'participant-right';

export interface SessionEvent {
    event: 'pickup' | 'ring' | 'stop';
    side: 'left' | 'right';
    timestamp?: Timestamp;
    pickupTimeMs?: number;
}

export interface SessionDocument {
    sessionId: string;
    role: Role;
    userAgent: string;
    adaptiveVolume?: boolean;
    backgroundNoiseLevel?: 1 | 2 | 3;
    startedAt?: Timestamp;
    endedAt?: Timestamp;
    events: SessionEvent[];
}

export async function logSessionData(data: SessionDocument) {
    const sessionRef = doc(db, 'sessions', data.sessionId);

    try {
        const docSnap = await getDoc(sessionRef);
        const timestampedEvents = data.events.map((e) => ({
            ...e,
            timestamp: e.timestamp ?? Timestamp.now(),
        }));

        const delayKey = `pickupDelay${data.role === 'participant-left' ? 'Left' : 'Right'}Ms`;
        const pickupDelay = data.events.find(e => e.pickupTimeMs)?.pickupTimeMs || null;

        if (docSnap.exists()) {
            const existing = docSnap.data();
            await updateDoc(sessionRef, {
                endedAt: Timestamp.now(),
                userAgents: Array.from(new Set([...(existing.userAgents || []), data.userAgent])),
                events: [...(existing.events || []), ...timestampedEvents],
                [delayKey]: pickupDelay,
            });
        } else {
            await setDoc(sessionRef, {
                sessionId: data.sessionId,
                role: data.role,
                userAgents: [data.userAgent],
                startedAt: Timestamp.now(),
                endedAt: Timestamp.now(),
                events: timestampedEvents,
                adaptiveVolume: data.adaptiveVolume ?? null,
                backgroundNoiseLevel: data.backgroundNoiseLevel ?? null,
                [delayKey]: pickupDelay,
            });
        }

        console.log('Session logged:', data.sessionId);
    } catch (error) {
        console.error('Error logging session:', error);
    }
}
