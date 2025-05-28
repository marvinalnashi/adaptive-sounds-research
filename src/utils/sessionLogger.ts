import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';

export type Role = 'controller' | 'participant-left' | 'participant-right';

export interface SessionEvent {
    event: 'start' | 'ring' | 'stop' | 'exit' | 'pickup';
    side?: 'left' | 'right';
    timestamp?: Timestamp;
    pickupTimeMs?: number;
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
    if (!data.sessionId) {
        console.error('Session ID is required');
        return;
    }

    const sessionRef = doc(db, 'sessions', data.sessionId);

    try {
        const docSnap = await getDoc(sessionRef);

        if (docSnap.exists()) {
            const existingData = docSnap.data();

            const mergedEvents = [
                ...(existingData.events || []),
                ...data.events.map((e) => ({
                    ...e,
                    timestamp: e.timestamp ?? Timestamp.now(),
                })),
            ];

            const pickupEvent = mergedEvents.find((e) => e.event === 'pickup');
            let delayMs: number | undefined;
            if (pickupEvent && data.startedAt) {
                const start = data.startedAt.toMillis();
                const end = pickupEvent.timestamp?.toMillis();
                if (end && start) delayMs = end - start;
            }

            await updateDoc(sessionRef, {
                userAgents: Array.from(new Set([...(existingData.userAgents || []), data.userAgent])),
                adaptiveVolume: data.adaptiveVolume ?? existingData.adaptiveVolume,
                backgroundNoiseLevel: data.backgroundNoiseLevel ?? existingData.backgroundNoiseLevel,
                startedAt: existingData.startedAt ?? data.startedAt ?? Timestamp.now(),
                endedAt: Timestamp.now(),
                pickupDelayMs: delayMs ?? existingData.pickupDelayMs,
                events: mergedEvents,
            });
        } else {
            await setDoc(sessionRef, {
                sessionId: data.sessionId,
                userAgents: [data.userAgent],
                role: data.role,
                adaptiveVolume: data.adaptiveVolume ?? null,
                backgroundNoiseLevel: data.backgroundNoiseLevel ?? null,
                startedAt: data.startedAt ?? Timestamp.now(),
                endedAt: data.endedAt ?? Timestamp.now(),
                pickupDelayMs: data.events.find(e => e.event === 'pickup')?.pickupTimeMs ?? null,
                events: data.events.map((e) => ({
                    ...e,
                    timestamp: e.timestamp ?? Timestamp.now(),
                })),
            });
        }

        console.log('Session successfully logged to Firestore:', data.sessionId);
    } catch (err) {
        console.error('Error logging session:', err);
    }
}
