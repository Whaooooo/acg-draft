// src/Configs/EntityProperty.ts

import {EntityName} from './EntityPaths';
import { SoundType } from "../Enums/SoundType";

import {
    ExplosionSound, Exs2EngineSound,
    F14AfterburnerSound,
    F14EngineSound,
    Fox2Sound, MissileShotSound, PropellerSound,
    SoundProperty,
    WindSound
} from './SoundProperty';


export type SoundPropertyName = keyof SoundProperty;

export interface PlaneProperty {
    hp: number;
    minPulsion: number;
    defaultPulsion: number;
    maxPulsion: number;
    pulsionSensitivity: number;
    xSpeedDecrease: number; // Speed along this direction will decrease to SpeedDecrease * CurrentSpeed after 1s.
    ySpeedDecrease: number;
    zSpeedDecrease: number;
    yawMinSpeed: number;
    yawMaxSpeed: number;
    rollMinSpeed: number;
    rollMaxSpeed: number;
    pitchMinSpeed: number;
    pitchMaxSpeed: number;
    yawSensitivity: number;
    rollSensitivity: number;
    pitchSensitivity: number;
    sound: { [key in SoundType]? : SoundProperty};
}

export interface MissileProperty {
    damage: number;
    pulsion: number;
    xSpeedDecrease: number;
    ySpeedDecrease: number;
    zSpeedDecrease: number;
    rotationSpeed: number;
    lockRange: number;
    lockAngle: number;
    lockNumber: number;
    loadTime: number;
    loadNumber: number;
    totalNumber: number;
    firePosition: [number, number, number][];
    sound: { [key in SoundType]? : SoundProperty};
}

export const PlayerProperties: {
    [key in EntityName]?: PlaneProperty | MissileProperty;
} = {
    f22: {
        hp: 10000,
        minPulsion: 0,
        defaultPulsion: 100,
        maxPulsion: 250,
        pulsionSensitivity: 15,
        xSpeedDecrease: 0.7,
        ySpeedDecrease: 0.5,
        zSpeedDecrease: 0.9,
        yawMinSpeed: -20,
        yawMaxSpeed: 20,
        rollMinSpeed: -120,
        rollMaxSpeed: 120,
        pitchMinSpeed: -30,
        pitchMaxSpeed: 60,
        yawSensitivity: 40,
        rollSensitivity: 180,
        pitchSensitivity: 120,
        sound: {
            'engine' : F14EngineSound,
            'afterburner': F14AfterburnerSound,
            'wind': WindSound,
            'explosion' : ExplosionSound,
        },
    },
    f22_stdm: {
        damage: 300,
        pulsion: 200,
        xSpeedDecrease: 0.5,
        ySpeedDecrease: 0.5,
        zSpeedDecrease: 0.9,
        rotationSpeed: 90,
        lockRange: 2000,
        lockAngle: 30,
        lockNumber: 1,
        loadTime: 6,
        loadNumber: 2,
        totalNumber: 180,
        firePosition: [[2.5, -2.5, 7], [-2.5, -2.5, 7]],
        sound: {
            'speech' : Fox2Sound,
            'explosion' : ExplosionSound,
            'fire' : MissileShotSound
        },
    },
    // Add other entities as needed
} as const;

export const NPCProperties: {
    [key in EntityName]?: PlaneProperty | MissileProperty;
} = {
    f22: {
        hp: 600,
        minPulsion: 50,
        defaultPulsion: 70,
        maxPulsion: 150,
        pulsionSensitivity: 150,
        xSpeedDecrease: 0.4,
        ySpeedDecrease: 0.3,
        zSpeedDecrease: 0.5,
        yawMinSpeed: -10,
        yawMaxSpeed: 10,
        rollMinSpeed: -80,
        rollMaxSpeed: 80,
        pitchMinSpeed: -15,
        pitchMaxSpeed: 30,
        yawSensitivity: 40,
        rollSensitivity: 180,
        pitchSensitivity: 120,
        sound: {
            'engine' : F14EngineSound,
            'afterburner': F14AfterburnerSound,
            'wind': WindSound,
            'explosion' : ExplosionSound,
        },
    },
    f22_stdm: {
        damage: 300,
        pulsion: 80,
        xSpeedDecrease: 0.3,
        ySpeedDecrease: 0.3,
        zSpeedDecrease: 0.5,
        rotationSpeed: 60,
        lockRange: 2000,
        lockAngle: 30,
        lockNumber: 1,
        loadTime: 6,
        loadNumber: 2,
        totalNumber: 180,
        firePosition: [[2.5, -2.5, 7], [-2.5, -2.5, 7]],
        sound: {
            'speech' : Fox2Sound,
            'explosion' : ExplosionSound,
            'fire' : MissileShotSound
        },
    },
    plane: {
        hp: 300,
        minPulsion: 1,
        defaultPulsion: 1,
        maxPulsion: 2,
        pulsionSensitivity: 150,
        xSpeedDecrease: 0.3,
        ySpeedDecrease: 0.2,
        zSpeedDecrease: 0.4,
        yawMinSpeed: 0,
        yawMaxSpeed: 0,
        rollMinSpeed: 0,
        rollMaxSpeed: 0,
        pitchMinSpeed: 0,
        pitchMaxSpeed: 0,
        yawSensitivity: 0,
        rollSensitivity: 0,
        pitchSensitivity: 0,
        sound: {
            'engine' : PropellerSound,
            'afterburner': Exs2EngineSound,
            'wind': WindSound,
            'explosion' : ExplosionSound
        },
    },
    plane_stdm: {
        damage: 300,
        pulsion: 80,
        xSpeedDecrease: 0.3,
        ySpeedDecrease: 0.3,
        zSpeedDecrease: 0.5,
        rotationSpeed: 60,
        lockRange: 2000,
        lockAngle: 30,
        lockNumber: 1,
        loadTime: 6,
        loadNumber: 2,
        totalNumber: 180,
        firePosition: [[2.5, -2.5, 7], [-2.5, -2.5, 7]],
        sound: {
            'speech' : Fox2Sound,
            'explosion' : ExplosionSound,
            'fire' : MissileShotSound
        },
    },
    // Add other entities as needed
} as const;
