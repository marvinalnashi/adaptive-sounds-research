import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';

export type Role = 'controller' | 'participant-left' | 'participant-right';

export interface SessionLog {
    sessionId: string;
    role: Role;
    userAgent: string;
    timestamp?: Timestamp;
    event: 'start' | 'ring' | 'stop' | 'exit' | 'pickup';
    side?: 'left' | 'right';
    adaptiveVolume?: boolean;
    backgroundNoiseLevel?: 1 | 2 | 3;
    pickupTimeMs?: number;
}

export async function logSessionData(data: SessionLog) {
    try {
        await addDoc(collection(db, 'sessions'), {
            ...data,
            timestamp: data.timestamp || Timestamp.now(),
        });
        console.log('Session data logged:', data);
    } catch (err) {
        console.error('Failed to log session:', err);
    }
}