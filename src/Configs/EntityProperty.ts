// src/Configs/EntityProperty.ts

import {EntityName} from './EntityPaths';
import { SoundType } from "../Enums/SoundType";

import {
    ExplosionSound, Exs2EngineSound,
    F14AfterburnerSound,
    F14EngineSound,
    Fox2Sound, Fox3Sound, MissileShotSound, PropellerSound,
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
        hp: 1000,
        minPulsion: 0,
        defaultPulsion: 10,
        maxPulsion: 25,
        pulsionSensitivity: 5,
        xSpeedDecrease: 0.7,
        ySpeedDecrease: 0.6,
        zSpeedDecrease: 0.9,
        yawMinSpeed: -10,
        yawMaxSpeed: 10,
        rollMinSpeed: -60,
        rollMaxSpeed: 60,
        pitchMinSpeed: -15,
        pitchMaxSpeed: 30,
        yawSensitivity: 20,
        rollSensitivity: 90,
        pitchSensitivity: 60,
        sound: {
            'engine' : F14EngineSound,
            'afterburner': F14AfterburnerSound,
            'wind': WindSound,
            'explosion' : ExplosionSound,
        },
    },
    f22_stdm: {
        damage: 300,
        pulsion: 220,
        xSpeedDecrease: 0.05,
        ySpeedDecrease: 0.05,
        zSpeedDecrease: 0.8,
        rotationSpeed: 120,
        lockRange: 2000,
        lockAngle: 40,
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
    f22_6aam: {
        damage: 600,
        pulsion: 200,
        xSpeedDecrease: 0.2,
        ySpeedDecrease: 0.2,
        zSpeedDecrease: 0.7,
        rotationSpeed: 90,
        lockRange: 3000,
        lockAngle: 40,
        lockNumber: 6,
        loadTime: 24,
        loadNumber: 6,
        totalNumber: 48,
        firePosition: [[2.0, -3.0, 7], [1.2, -3.0, 7], [0.4, -3.0, 7], [-0.4, -3.0, 7], [-1.2, -3.0, 7], [-2.0, -2.5, 7]],
        sound: {
            'speech' : Fox3Sound,
            'explosion' : ExplosionSound,
            'fire' : MissileShotSound
        },
    },
    f22_laam: {
        damage: 1000,
        pulsion: 500,
        xSpeedDecrease: 0.02,
        ySpeedDecrease: 0.02,
        zSpeedDecrease: 0.8,
        rotationSpeed: 90,
        lockRange: 10000,
        lockAngle: 60,
        lockNumber: 1,
        loadTime: 30,
        loadNumber: 2,
        totalNumber: 12,
        firePosition: [[2.5, -2.5, 7], [-2.5, -2.5, 7]],
        sound: {
            'speech' : Fox3Sound,
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
        minPulsion: 10,
        defaultPulsion: 10,
        maxPulsion: 25,
        pulsionSensitivity: 5,
        xSpeedDecrease: 0.7,
        ySpeedDecrease: 0.6,
        zSpeedDecrease: 0.9,
        yawMinSpeed: -10,
        yawMaxSpeed: 10,
        rollMinSpeed: -40,
        rollMaxSpeed: 40,
        pitchMinSpeed: -10,
        pitchMaxSpeed: 20,
        yawSensitivity: 20,
        rollSensitivity: 90,
        pitchSensitivity: 60,
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
    f22_6aam: {
        damage: 600,
        pulsion: 200,
        xSpeedDecrease: 0.4,
        ySpeedDecrease: 0.4,
        zSpeedDecrease: 0.7,
        rotationSpeed: 90,
        lockRange: 3000,
        lockAngle: 40,
        lockNumber: 6,
        loadTime: 24,
        loadNumber: 6,
        totalNumber: 60,
        firePosition: [[2.0, -3.0, 7], [1.2, -3.0, 7], [0.4, -3.0, 7], [-0.4, -3.0, 7], [-1.2, -3.0, 7], [-2.0, -2.5, 7]],
        sound: {
            'speech' : Fox3Sound,
            'explosion' : ExplosionSound,
            'fire' : MissileShotSound
        },
    },
    f22_laam: {
        damage: 1000,
        pulsion: 500,
        xSpeedDecrease: 0.02,
        ySpeedDecrease: 0.02,
        zSpeedDecrease: 0.8,
        rotationSpeed: 90,
        lockRange: 10000,
        lockAngle: 60,
        lockNumber: 1,
        loadTime: 30,
        loadNumber: 2,
        totalNumber: 12,
        firePosition: [[2.5, -2.5, 7], [-2.5, -2.5, 7]],
        sound: {
            'speech' : Fox3Sound,
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
