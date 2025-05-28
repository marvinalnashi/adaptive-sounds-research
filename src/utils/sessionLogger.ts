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

        const existingEvents: SessionEvent[] = existingData.events || [];

        const newEvents = data.events.map(event => ({
            ...event,
            timestamp: event.timestamp ?? Timestamp.now()
        }));

        for (const event of newEvents) {
            if (event.event === 'pickup') {
                const ringEvent = existingEvents.find(
                    e => e.event === 'ring' && e.side === event.side
                );
                if (ringEvent && ringEvent.timestamp && event.timestamp) {
                    event.ringToPickupDurationMs = event.timestamp.toMillis() - ringEvent.timestamp.toMillis();
                }
            }
        }

        const mergedEvents = [...existingEvents, ...newEvents];

        const updatedData = {
            sessionId: data.sessionId,
            adaptiveVolume: data.adaptiveVolume ?? existingData.adaptiveVolume,
            backgroundNoiseLevel: data.backgroundNoiseLevel ?? existingData.backgroundNoiseLevel,
            startedAt: existingData.startedAt ?? Timestamp.now(),
            endedAt: Timestamp.now(),
            events: mergedEvents,
            userAgents: {
                ...(existingData.userAgents || {}),
                [data.role]: data.userAgent
            }
        };

        await setDoc(sessionRef, updatedData, { merge: true });
        console.log('Session logged:', data.sessionId);
    } catch (err) {
        console.error('Failed to log session:', err);
    }
}
