// src/Configs/SoundPaths.ts

export const SoundPaths = {
    engine: 'dcs/SA342/SA342Engine.ogg',
    explosion: 'plane/explosion.mp3',
    fox2: 'dcs/British-WWII-radio/Sounds/Speech/Sound/ENG/Common/Wingman/2/Messages/FOX 2.wav',
    // Add other sounds and their paths
} as const; // The 'as const' assertion ensures the object is deeply immutable

export type SoundEnum = keyof typeof SoundPaths;
