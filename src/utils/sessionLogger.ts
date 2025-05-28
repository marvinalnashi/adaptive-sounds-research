import { collection, doc, setDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';

export type Role = 'controller' | 'participant-left' | 'participant-right';

export interface SessionLogEntry {
    role: Role;
    userAgent: string;
    timestamp: Timestamp;
    event: 'start' | 'ring' | 'stop' | 'exit' | 'pickup';
    side?: 'left' | 'right';
    adaptiveVolume?: boolean;
    backgroundNoiseLevel?: 1 | 2 | 3;
    pickupTimeMs?: number;
}

export async function logSessionData(data: Omit<SessionLogEntry, 'timestamp'> & { sessionId: string }) {
    try {
        const { sessionId, ...entry } = data;
        const logEntry: SessionLogEntry = {
            ...entry,
            timestamp: Timestamp.now(),
        };

        const docRef = doc(db, 'sessions', sessionId);

        await setDoc(docRef, { sessionId }, { merge: true });
        await updateDoc(docRef, {
            events: arrayUnion(logEntry),
        });

        console.log('Session data logged:', logEntry);
    } catch (err) {
        console.error('Failed to log session:', err);
    }
}
