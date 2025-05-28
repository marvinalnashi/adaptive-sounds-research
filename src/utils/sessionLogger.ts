import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';

export type Role = 'participant-left' | 'participant-right';

export interface SessionEvent {
    event: 'pickup';
    side: 'left' | 'right';
    timestamp: Timestamp;
    pickupTimeMs: number;
}

export interface SessionDocument {
    sessionId: string;
    role: Role;
    userAgent: string;
    adaptiveVolume?: boolean;
    backgroundNoiseLevel?: 1 | 2 | 3;
    events: SessionEvent[];
}

export async function logSessionData(data: SessionDocument) {
    const sessionRef = doc(db, 'sessions', data.sessionId);

    try {
        const docSnap = await getDoc(sessionRef);

        const pickupEvent = data.events.find(e => e.event === 'pickup');
        if (!pickupEvent || pickupEvent.pickupTimeMs < 0) return;

        const eventPayload = {
            ...pickupEvent,
            timestamp: pickupEvent.timestamp,
            pickupTimeMs: pickupEvent.pickupTimeMs,
        };

        if (docSnap.exists()) {
            const existing = docSnap.data();

            await updateDoc(sessionRef, {
                userAgents: Array.from(new Set([...(existing.userAgents || []), data.userAgent])),
                events: [...(existing.events || []), eventPayload],
            });
        } else {
            await setDoc(sessionRef, {
                sessionId: data.sessionId,
                userAgents: [data.userAgent],
                adaptiveVolume: data.adaptiveVolume ?? null,
                backgroundNoiseLevel: data.backgroundNoiseLevel ?? null,
                events: [eventPayload],
            });
        }

        console.log('Session logged:', data.sessionId);
    } catch (error) {
        console.error('Error logging session:', error);
    }
}
