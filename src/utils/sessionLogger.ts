import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';

export type Role = 'controller' | 'participant-left' | 'participant-right';

export interface SessionEvent {
    event: 'start' | 'ring' | 'stop' | 'exit' | 'pickup';
    side?: 'left' | 'right';
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
    try {
        const sessionRef = doc(db, 'sessions', data.sessionId);

        await setDoc(sessionRef, {
            ...data,
            startedAt: data.startedAt ?? Timestamp.now(),
            endedAt: data.endedAt ?? Timestamp.now(),
            events: data.events.map((e) => ({
                ...e,
                timestamp: e.timestamp ?? Timestamp.now(),
            })),
        });

        console.log('Session logged:', data);
    } catch (err) {
        console.error('Failed to log session:', err);
    }
}
