import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';

export type Role = 'participant-left' | 'participant-right';

export interface SessionEvent {
    event: 'pickup';
    side: 'left' | 'right';
    timestamp?: Timestamp;
    pickupTimeMs?: number;
}

export interface SessionDocument {
    sessionId: string;
    role: Role;
    userAgent: string;
    events: SessionEvent[];
}

export async function logSessionData(data: SessionDocument) {
    const sessionRef = doc(db, 'sessions', data.sessionId);

    try {
        const docSnap = await getDoc(sessionRef);
        const eventWithTimestamp = data.events.map((e) => ({
            ...e,
            timestamp: e.timestamp ?? Timestamp.now(),
        }));

        if (docSnap.exists()) {
            const existing = docSnap.data();

            await updateDoc(sessionRef, {
                userAgents: Array.from(new Set([...(existing.userAgents || []), data.userAgent])),
                events: [...(existing.events || []), ...eventWithTimestamp],
                [`pickupDelay${data.role.includes('left') ? 'Left' : 'Right'}Ms`]: data.events.find(e => e.pickupTimeMs)?.pickupTimeMs || null,
                endedAt: Timestamp.now(),
            });
        } else {
            await setDoc(sessionRef, {
                sessionId: data.sessionId,
                userAgents: [data.userAgent],
                startedAt: Timestamp.now(),
                endedAt: Timestamp.now(),
                events: eventWithTimestamp,
                [`pickupDelay${data.role.includes('left') ? 'Left' : 'Right'}Ms`]: data.events.find(e => e.pickupTimeMs)?.pickupTimeMs || null,
            });
        }

        console.log('Session data successfully logged for', data.sessionId);
    } catch (error) {
        console.error('Error saving session:', error);
    }
}
