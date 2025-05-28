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
    userAgent?: string;
    adaptiveVolume?: boolean;
    backgroundNoiseLevel?: 1 | 2 | 3;
    startedAt?: Timestamp;
    endedAt?: Timestamp;
    events: SessionEvent[];
}

export async function logSessionData(data: SessionDocument) {
    try {
        const sessionRef = doc(db, 'sessions', data.sessionId);
        const snapshot = await getDoc(sessionRef);

        if (!snapshot.exists()) {
            const initialDoc: SessionDocument = {
                sessionId: data.sessionId,
                userAgent: data.userAgent,
                adaptiveVolume: data.adaptiveVolume,
                backgroundNoiseLevel: data.backgroundNoiseLevel,
                startedAt: Timestamp.now(),
                endedAt: Timestamp.now(),
                events: data.events.map((e) => ({
                    ...e,
                    timestamp: e.timestamp ?? Timestamp.now(),
                })),
            };

            await setDoc(sessionRef, initialDoc);
            console.log('Session created and logged:', initialDoc);
            return;
        }

        const existingData = snapshot.data() as SessionDocument;

        const existingEvents = existingData.events || [];
        const newEvents = data.events.map((e) => ({
            ...e,
            timestamp: e.timestamp ?? Timestamp.now(),
        }));
        const allEvents = [...existingEvents, ...newEvents];
        
        for (const event of allEvents) {
            if (event.event === 'pickup' && event.side && event.timestamp && !event.ringToPickupDurationMs) {
                const matchingRing = allEvents.find(
                    (e) => e.event === 'ring' && e.side === event.side && e.timestamp
                );
                if (matchingRing?.timestamp) {
                    event.ringToPickupDurationMs =
                        event.timestamp.toMillis() - matchingRing.timestamp.toMillis();
                }
            }
        }

        const updatedDoc: SessionDocument = {
            sessionId: data.sessionId,
            userAgent: existingData.userAgent ?? data.userAgent,
            adaptiveVolume: existingData.adaptiveVolume ?? data.adaptiveVolume,
            backgroundNoiseLevel: existingData.backgroundNoiseLevel ?? data.backgroundNoiseLevel,
            startedAt: existingData.startedAt ?? Timestamp.now(),
            endedAt: Timestamp.now(),
            events: allEvents,
        };

        await setDoc(sessionRef, updatedDoc);
        console.log('Session updated:', updatedDoc);
    } catch (err) {
        console.error('Failed to log session:', err);
    }
}
