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
    startedAt?: Timestamp;
    endedAt?: Timestamp;
    events: SessionEvent[];
}

export async function logSessionData(data: SessionDocument) {
    const sessionRef = doc(db, 'sessions', data.sessionId);

    try {
        const docSnap = await getDoc(sessionRef);
        const timestampedEvents = data.events.map(e => ({
            ...e,
            timestamp: e.timestamp ?? Timestamp.now(),
        }));

        const updateData: any = {
            events: timestampedEvents,
            endedAt: Timestamp.now(),
            [`pickupDelay${data.role.includes('left') ? 'Left' : 'Right'}Ms`]: data.events.find(e => e.pickupTimeMs)?.pickupTimeMs || null,
        };

        if (docSnap.exists()) {
            const existing = docSnap.data();
            await updateDoc(sessionRef, {
                ...updateData,
                userAgents: Array.from(new Set([...(existing.userAgents || []), data.userAgent])),
                events: [...(existing.events || []), ...timestampedEvents],
            });
        } else {
            await setDoc(sessionRef, {
                sessionId: data.sessionId,
                userAgents: [data.userAgent],
                startedAt: Timestamp.now(),
                endedAt: Timestamp.now(),
                events: timestampedEvents,
                [`pickupDelay${data.role.includes('left') ? 'Left' : 'Right'}Ms`]: data.events.find(e => e.pickupTimeMs)?.pickupTimeMs || null,
                backgroundNoiseLevel: null,
                adaptiveVolume: null,
            });
        }

        console.log('Session data successfully logged for', data.sessionId);
    } catch (error) {
        console.error('Error saving session:', error);
    }
}
