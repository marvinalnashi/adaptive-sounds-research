'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import Ably from 'ably';

const ably = new Ably.Realtime({ key: process.env.NEXT_PUBLIC_ABLY_API_KEY!, clientId: 'controller-client' });
const channel = ably.channels.get('ring-channel');

export default function ControllerPage() {
    const router = useRouter();
    const [ringingSide, setRingingSide] = useState<'left' | 'right' | null>(null);
    const [ringStartTime, setRingStartTime] = useState<number | null>(null);
    const [adaptivity, setAdaptivity] = useState<'yes' | 'no'>('no');
    const [backgroundNoise, setBackgroundNoise] = useState<1 | 2 | 3>(1);
    const [micVolume, setMicVolume] = useState<number>(0);  // Volume variable for the microphones' input sound

    const sessionId = JSON.parse(Cookies.get('ably-session') || '{}')?.sessionId;

    useEffect(() => {
        const handlePickup = (message: any) => {
            if (message.name === 'pickup') {
                setRingingSide(null);
                setRingStartTime(null);
            }
        };

        channel.subscribe('pickup', handlePickup);
        return () => channel.unsubscribe('pickup', handlePickup);
    }, []);

    const getAudioContext = () => {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) {
            console.error('Web Audio API not supported.');
            return null;
        }
        return new AudioContext();
    }

    useEffect(() => {
        // Microphone setup for getting the volume level of the surroundings
        // https://dev.to/tooleroid/building-a-real-time-microphone-level-meter-using-web-audio-api-a-complete-guide-1e0b
        const micSetup = async() => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const audioContext = getAudioContext();
                if (!audioContext) return;

                const analyser = audioContext.createAnalyser();
                analyser.fftSize = 2048;

                const source = audioContext.createMediaStreamSource(stream);
                source.connect(analyser);

                const data = new Float32Array(analyser.fftSize);

                const updateVolume = () => {
                    analyser.getFloatTimeDomainData(data);
                    const rms = Math.sqrt(data.reduce((acc, val) => acc + val * val, 0) / data.length);
                    const dbfs = 20 * Math.log10(rms + 1e-8);

                    // TODO: Maybe add the min and max decibel as on the website, for now -160 seems to be minimum and 0 is maximum
                    setMicVolume(dbfs);
                    // console.log('Microphone Volume (dBFS):', dbfs);
                    requestAnimationFrame(updateVolume);  // NOTE: Under 'Smooth Animation and Updates' this apparently calls the next frame. At this point I don't fully understand
                }

                updateVolume();
            } catch (error) {
                console.error('Mic not accepted or error occurred:', error);
            }
        };

        micSetup();
    })

    const ringPhone = (side: 'left' | 'right') => {
        if (ringingSide || !sessionId) return;

        const timestamp = Date.now();
        channel.publish('ring', {
            side,
            timestamp,
            sessionId,
            adaptiveVolume: adaptivity === 'yes',
            backgroundNoiseLevel: backgroundNoise,
        });

        setRingingSide(side);
        setRingStartTime(timestamp);
    };

    const stopRing = (side: 'left' | 'right') => {
        channel.publish('stop', { side });
        setRingingSide(null);
        setRingStartTime(null);
    };

    const exitSession = () => {
        channel.publish('reset', {});
        Cookies.remove('ably-session');
        router.push('/');
    };

    return (
        <div className="p-6 max-w-lg mx-auto">
            <h1 className="text-2xl font-bold mb-4">Controller Mode</h1>

            <div className="mb-4">
                <p className="font-semibold">Adaptivity of Ringtone Volume:</p>
                <div className="space-x-2 mt-2">
                    <button onClick={() => setAdaptivity('yes')} className={`px-3 py-1 border rounded ${adaptivity === 'yes' ? 'bg-green-300' : 'bg-gray-200'}`}>Yes</button>
                    <button onClick={() => setAdaptivity('no')} className={`px-3 py-1 border rounded ${adaptivity === 'no' ? 'bg-red-300' : 'bg-gray-200'}`}>No</button>
                </div>
            </div>

            <div className="mb-4">
                <p className="font-semibold">Background Noise Level:</p>
                <div className="space-x-2 mt-2">
                    {[1, 2, 3].map((level) => (
                        <button key={level} onClick={() => setBackgroundNoise(level as 1 | 2 | 3)}
                                className={`px-3 py-1 border rounded ${backgroundNoise === level ? 'bg-blue-300' : 'bg-gray-200'}`}>
                            {level}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {(['left', 'right'] as const).map((side) => (
                    <div key={side}>
                        <button onClick={() => ringPhone(side)} disabled={ringingSide !== null}
                                className="px-4 py-2 bg-blue-500 text-white rounded">
                            Ring {side === 'left' ? 'Left' : 'Right'} Phone
                        </button>
                        {ringingSide === side && (
                            <button onClick={() => stopRing(side)}
                                    className="ml-2 px-4 py-2 bg-red-500 text-white rounded">
                                Stop Ringing
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div className="mb-4">
                <p className="font-semibold">Microphone Volume Level:</p>
                <div className="mt-2">
                    <span className="text-gray-700">{micVolume.toFixed(2)} dB</span>
                </div>
            </div>

            <button onClick={exitSession} className="mt-6 bg-black text-white px-4 py-2 rounded">Exit Session</button>
        </div>
    );
}
