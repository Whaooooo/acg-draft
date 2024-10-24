// src/Configs/SoundPaths.ts

export const SoundPaths = {
    engine: 'dcs/plane/SA342Engine_cut.wav',
    f14engine: 'dcs/plane/F14_Engine_Rear_Close_New.wav',
    f14afterburner: 'dcs/plane/F14_Afterburner_Rear_Close.wav',
    wind: 'dcs/plane/PlaneWind.wav',
    exs2engine: 'dcs/plane/Exs2.wav',
    missileshot: 'dcs/missile/rocket-loop-99748_cut.mp3',
    propeller: 'plane/engine.mp3', //https://github.com/NikLever/threejs-games-course
    explosion: 'plane/explosion-47821.mp3', //https://cdn.pixabay.com/download/audio/2022/03/10/audio_3c625ab051.mp3?filename=explosion-47821.mp3
    fox2: 'dcs/British-WWII-radio/Sounds/Speech/Sound/ENG/Common/Wingman/2/Messages/FOX 2.wav',
    // Add other sounds and their paths
} as const; // The 'as const' assertion ensures the object is deeply immutable

export type SoundEnum = keyof typeof SoundPaths;
