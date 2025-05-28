import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';

export type Role = 'controller' | 'participant-left' | 'participant-right';

export interface SessionEvent {
    event: 'start' | 'ring' | 'stop' | 'exit' | 'pickup';
    side?: 'left' | 'right';
    timestamp?: Timestamp;
    pickupTimeMs?: number;
    ringToPickupDurationMs?: number;
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
    try {
        if (!data.role.startsWith('participant')) return;

        const sessionRef = doc(db, 'sessions', data.sessionId);
        const sessionSnap = await getDoc(sessionRef);
        const existingData = sessionSnap.exists() ? sessionSnap.data() : {};

        const allEvents = [
            ...(existingData.events || []),
            ...data.events.map(e => ({
                ...e,
                timestamp: e.timestamp ?? Timestamp.now(),
            })),
        ];

        const startedAt = allEvents[0]?.timestamp ?? Timestamp.now();
        const endedAt = Timestamp.now();

        const ringEvent = allEvents.find(e => e.event === 'ring' && e.side === data.events[0]?.side);
        const pickupEvent = data.events.find(e => e.event === 'pickup');

        if (ringEvent && pickupEvent && !pickupEvent.ringToPickupDurationMs) {
            pickupEvent.ringToPickupDurationMs =
                (pickupEvent.timestamp?.toMillis() || 0) - (ringEvent.timestamp?.toMillis() || 0);
        }

        const updatedData = {
            sessionId: data.sessionId,
            adaptiveVolume: data.adaptiveVolume ?? existingData.adaptiveVolume,
            backgroundNoiseLevel: data.backgroundNoiseLevel ?? existingData.backgroundNoiseLevel,
            startedAt,
            endedAt,
            events: allEvents,
            userAgents: {
                ...(existingData.userAgents || {}),
                [data.role]: data.userAgent,
            },
        };

        await setDoc(sessionRef, updatedData, { merge: true });
        console.log('Session logged successfully:', data.sessionId);
    } catch (err) {
        console.error('Failed to log session:', err);
    }
}