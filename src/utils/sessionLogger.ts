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
    startedAt?: Timestamp;
    endedAt?: Timestamp;
    events: SessionEvent[];
}

export async function logSessionData(data: SessionDocument) {
    try {
        if (data.role === 'controller') return;

        const sessionRef = doc(db, 'sessions', data.sessionId);
        const sessionSnap = await getDoc(sessionRef);

        let existing: Partial<SessionDocument> = sessionSnap.exists() ? sessionSnap.data() as SessionDocument : {
            sessionId: data.sessionId,
            events: [],
        };

        const newEvents = data.events.map(e => ({
            ...e,
            timestamp: e.timestamp ?? Timestamp.now(),
        }));

        const allEvents = [...(existing.events || []), ...newEvents];

        const pickup = newEvents.find(e => e.event === 'pickup');
        if (pickup?.timestamp) {
            const ring = allEvents.find(e =>
                e.event === 'ring' && e.side === pickup.side
            );
            if (ring?.timestamp) {
                pickup.ringToPickupDurationMs = pickup.timestamp.toMillis() - ring.timestamp.toMillis();
            }
        }

        const mergedDoc: SessionDocument = {
            sessionId: data.sessionId,
            userAgent: data.userAgent,
            role: data.role,
            adaptiveVolume: data.adaptiveVolume ?? existing.adaptiveVolume,
            backgroundNoiseLevel: data.backgroundNoiseLevel ?? existing.backgroundNoiseLevel,
            startedAt: existing.startedAt ?? Timestamp.now(),
            endedAt: Timestamp.now(),
            events: allEvents,
        };

        await setDoc(sessionRef, mergedDoc);
        console.log('Session saved:', mergedDoc);

    } catch (err) {
        console.error('Failed to log session:', err);
    }
}
