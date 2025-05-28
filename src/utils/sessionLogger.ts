import { doc, setDoc, Timestamp, getDoc } from 'firebase/firestore';
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
    const { sessionId, event, ...rest } = data;

    if (!sessionId) {
        console.warn('Missing sessionId for log data');
        return;
    }

    const sessionRef = doc(db, 'sessions', sessionId);
    const snapshot = await getDoc(sessionRef);
    const timestamp = data.timestamp ?? Timestamp.now();

    const baseData = {
        sessionId,
        role: data.role,
        userAgent: data.userAgent,
    };

    const eventData: Record<string, any> = {
        [`events.${event}-${timestamp.toMillis()}`]: {
            event,
            timestamp,
            ...rest,
        },
    };

    const mergedData = snapshot.exists() ? eventData : { ...baseData, ...eventData };

    await setDoc(sessionRef, mergedData, { merge: true });
}