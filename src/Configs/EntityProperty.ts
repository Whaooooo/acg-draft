// src/Configs/EntityProperty.ts

import {EntityConfigs, EntityName} from './EntityPaths';
import { SoundEnum } from "./SoundPaths";

export interface SoundProperty {
    name: SoundEnum;
    cooldown: number;
    volume: number;
    loop: boolean;
}

export type SoundPropertyName = keyof SoundProperty;

export interface PlaneProperty {
    hP: number;
    minPulsion: number;
    defaultPulsion: number;
    maxPulsion: number;
    xSpeedDecrease: number; // Speed along this direction will decrease to SpeedDecrease * CurrentSpeed after 1s.
    ySpeedDecrease: number;
    zSpeedDecrease: number;
    yawMaxSpeed: number;
    rollMaxSpeed: number;
    pitchMaxSpeed: number;
    yawSensitivity: number;
    rollSensitivity: number;
    pitchSensitivity: number;
    sound: { [key in string]? : SoundProperty};
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
    sound: { [key in string]? : SoundProperty};
}

export const PlayerProperties: {
    [key in EntityName]?: PlaneProperty | MissileProperty;
} = {
    f22: {
        hP: 1000,
        minPulsion: 50,
        defaultPulsion: 100,
        maxPulsion: 250,
        xSpeedDecrease: 0.4,
        ySpeedDecrease: 0.3,
        zSpeedDecrease: 0.5,
        yawMaxSpeed: 20,
        rollMaxSpeed: 120,
        pitchMaxSpeed: 60,
        yawSensitivity: 40,
        rollSensitivity: 180,
        pitchSensitivity: 120,
        sound: {
            'engine' : {
                name: 'engine',
                cooldown: 30,
                volume: 1,
                loop: false,
            },
            'explode' : {
                name: 'explosion',
                cooldown: 0,
                volume: 1,
                loop: false,
            }
        },
    },
    f22_stdm: {
        damage: 300,
        pulsion: 200,
        xSpeedDecrease: 0.3,
        ySpeedDecrease: 0.3,
        zSpeedDecrease: 0.5,
        rotationSpeed: 90,
        lockRange: 2000,
        lockAngle: 30,
        lockNumber: 1,
        loadTime: 6,
        loadNumber: 2,
        totalNumber: 180,
        firePosition: [[2.5, -2.5, 7], [-2.5, -2.5, 7]],
        sound: {
            'fire' : {
                name: 'fox2',
                cooldown: 30,
                volume: 1,
                loop: false,
            },
            'explode' : {
                name: 'explosion',
                cooldown: 0,
                volume: 1,
                loop: false,
            }
        },
    },
    // Add other entities as needed
} as const;

export const NPCProperties: {
    [key in EntityName]?: PlaneProperty | MissileProperty;
} = {
    f22: {
        hP: 600,
        minPulsion: 50,
        defaultPulsion: 70,
        maxPulsion: 150,
        xSpeedDecrease: 0.4,
        ySpeedDecrease: 0.3,
        zSpeedDecrease: 0.5,
        yawMaxSpeed: 20,
        rollMaxSpeed: 90,
        pitchMaxSpeed: 40,
        yawSensitivity: 40,
        rollSensitivity: 180,
        pitchSensitivity: 120,
        sound: {
            'engine' : {
                name: 'engine',
                cooldown: 30,
                volume: 1,
                loop: false,
            },
            'explode' : {
                name: 'explosion',
                cooldown: 0,
                volume: 1,
                loop: false,
            }
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
            'fire' : {
                name: 'fox2',
                cooldown: 30,
                volume: 1,
                loop: false,
            },
        },
    },
    plane: {
        hP: 300,
        minPulsion: 50,
        defaultPulsion: 50,
        maxPulsion: 50,
        xSpeedDecrease: 0.3,
        ySpeedDecrease: 0.2,
        zSpeedDecrease: 0.4,
        yawMaxSpeed: 0,
        rollMaxSpeed: 0,
        pitchMaxSpeed: 0,
        yawSensitivity: 0,
        rollSensitivity: 0,
        pitchSensitivity: 0,
        sound: {
            'engine' : {
                name: 'propeller',
                cooldown: 30,
                volume: 1,
                loop: false,
            },
            'explode' : {
                name: 'explosion',
                cooldown: 0,
                volume: 1,
                loop: false,
            }
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
            'fire' : {
                name: 'fox2',
                cooldown: 30,
                volume: 1,
                loop: false,
            },
        },
    },
    // Add other entities as needed
} as const;
