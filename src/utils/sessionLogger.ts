import { collection, doc, getDoc, setDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';

export type Role = 'controller' | 'participant-left' | 'participant-right';

export interface SessionLogEvent {
    role: Role;
    userAgent: string;
    event: 'start' | 'ring' | 'stop' | 'exit' | 'pickup';
    timestamp?: Timestamp;
    side?: 'left' | 'right';
    adaptiveVolume?: boolean;
    backgroundNoiseLevel?: 1 | 2 | 3;
    pickupTimeMs?: number;
}

export async function logSessionData(data: { sessionId: string } & SessionLogEvent) {
    try {
        const { sessionId, ...event } = data;
        const sessionRef = doc(collection(db, 'sessions'), sessionId);
        const sessionDoc = await getDoc(sessionRef);

        const eventWithTimestamp = {
            ...event,
            timestamp: event.timestamp ?? Timestamp.now(),
        };

        if (!sessionDoc.exists()) {
            await setDoc(sessionRef, {
                sessionId,
                events: [eventWithTimestamp],
            });
        } else {
            await updateDoc(sessionRef, {
                events: arrayUnion(eventWithTimestamp),
            });
        }

        console.log('Session event logged:', eventWithTimestamp);
    } catch (err) {
        console.error('Failed to log session:', err);
    }
}
