import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';

export type Role = 'participant-left' | 'participant-right' | 'controller';

export interface SessionEvent {
    event: 'pickup' | 'ring' | 'stop' | 'exit';
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
    const sessionRef = doc(db, 'sessions', data.sessionId);

    try {
        const docSnap = await getDoc(sessionRef);
        const timestampedEvents = data.events.map(e => ({
            ...e,
            timestamp: e.timestamp ?? Timestamp.now(),
        }));

        const isController = data.role === 'controller';

        const updateData: any = {
            endedAt: Timestamp.now(),
            events: timestampedEvents,
        };

        if (!isController) {
            const delayKey = `pickupDelay${data.role.includes('left') ? 'Left' : 'Right'}Ms`;
            updateData[delayKey] = data.events.find(e => e.pickupTimeMs)?.pickupTimeMs || null;
        } else {
            updateData.adaptiveVolume = data.adaptiveVolume;
            updateData.backgroundNoiseLevel = data.backgroundNoiseLevel;
        }

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
                role: data.role,
                userAgents: [data.userAgent],
                startedAt: Timestamp.now(),
                endedAt: Timestamp.now(),
                events: timestampedEvents,
                backgroundNoiseLevel: isController ? data.backgroundNoiseLevel ?? null : null,
                adaptiveVolume: isController ? data.adaptiveVolume ?? null : null,
                [`pickupDelay${data.role.includes('left') ? 'Left' : 'Right'}Ms`]: !isController
                    ? data.events.find(e => e.pickupTimeMs)?.pickupTimeMs || null
                    : null,
            });
        }

        console.log('Session logged:', data.sessionId);
    } catch (error) {
        console.error('Error logging session:', error);
    }
}
