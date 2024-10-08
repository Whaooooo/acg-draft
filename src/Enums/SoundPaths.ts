// src/Enums/SoundPaths.ts

export const SoundPaths = {
    engine: 'sounds/engine.mp3',
    explosion: 'sounds/explosion.mp3',
    missileLaunch: 'sounds/missileLaunch.mp3',
    // Add other sounds and their paths
} as const; // The 'as const' assertion ensures the object is deeply immutable

export type SoundEnum = keyof typeof SoundPaths;
