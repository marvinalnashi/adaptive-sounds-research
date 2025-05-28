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
        if (data.role === 'controller') return;

        const sessionRef = doc(db, 'sessions', data.sessionId);
        const sessionSnap = await getDoc(sessionRef);

        let existingData: any = sessionSnap.exists() ? sessionSnap.data() : {};

        const allEvents = [...(existingData.events || []), ...data.events.map(e => ({
            ...e,
            timestamp: e.timestamp ?? Timestamp.now(),
        }))];

        const startedAt = allEvents[0]?.timestamp || Timestamp.now();
        const endedAt = Timestamp.now();

        const ringEvent = allEvents.find(e => e.event === 'ring' && e.side === data.events[0].side);
        const pickupEvent = data.events.find(e => e.event === 'pickup');

        if (ringEvent && pickupEvent) {
            pickupEvent.ringToPickupDurationMs =
                pickupEvent.timestamp?.toMillis()! - ringEvent.timestamp?.toMillis()!;
        }

        await setDoc(sessionRef, {
            sessionId: data.sessionId,
            userAgent: data.userAgent,
            role: data.role,
            adaptiveVolume: data.adaptiveVolume,
            backgroundNoiseLevel: data.backgroundNoiseLevel,
            startedAt,
            endedAt,
            events: allEvents,
        });

        console.log('Session logged:', data.sessionId);
    } catch (err) {
        console.error('Failed to log session:', err);
    }
}
