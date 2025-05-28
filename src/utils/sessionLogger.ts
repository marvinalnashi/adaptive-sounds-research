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
        const existingDoc = await getDoc(sessionRef);

        let existingData: any = existingDoc.exists() ? existingDoc.data() : {
            sessionId: data.sessionId,
            events: [],
            userAgents: {},
        };

        const newEvents = data.events.map((event) => {
            const timestamp = event.timestamp ?? Timestamp.now();

            let ringToPickupDurationMs: number | undefined;

            if (event.event === 'pickup' && event.side) {
                const matchingRing = existingData.events.find(
                    (e: SessionEvent) => e.event === 'ring' && e.side === event.side && e.timestamp
                );
                if (matchingRing && matchingRing.timestamp) {
                    ringToPickupDurationMs = timestamp.toMillis() - matchingRing.timestamp.toMillis();
                }
            }

            return {
                ...event,
                timestamp,
                ringToPickupDurationMs,
            };
        });

        const updatedEvents = [...existingData.events, ...newEvents];

        const updatedData = {
            ...existingData,
            sessionId: data.sessionId,
            adaptiveVolume: data.adaptiveVolume ?? existingData.adaptiveVolume,
            backgroundNoiseLevel: data.backgroundNoiseLevel ?? existingData.backgroundNoiseLevel,
            startedAt: existingData.startedAt ?? Timestamp.now(),
            endedAt: Timestamp.now(),
            events: updatedEvents,
            userAgents: {
                ...existingData.userAgents,
                [data.role]: data.userAgent,
            },
        };

        await setDoc(sessionRef, updatedData);
        console.log('Session logged:', data.sessionId);
    } catch (err) {
        console.error('Failed to log session:', err);
    }
}
