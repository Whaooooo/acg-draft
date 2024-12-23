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
import {
    f22EngineWakeCloudProperties,
    f22WingWakeCloudProperties,
    missileWakeCloudProperty,
    WakeCloudProperty
} from "./WakeCloudProperty";
import {WakeCloud} from "../Entities/WakeCloud";


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
    wakeCloud: WakeCloudProperty[];
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
    polyEstimate: number;
    lifeTime: number;
    loadTime: number;
    loadNumber: number;
    totalNumber: number;
    firePosition: [number, number, number][];
    sound: { [key in SoundType]? : SoundProperty};
    wakeCloud: WakeCloudProperty[];
}

export const PlayerProperties: {
    [key in EntityName]?: PlaneProperty | MissileProperty;
} = {
    f22: {
        hp: 1000,
        minPulsion: 0.0,
        defaultPulsion: 50.0,
        maxPulsion: 150.0,
        pulsionSensitivity: 10.0,
        xSpeedDecrease: 0.8,
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
        wakeCloud: [...f22EngineWakeCloudProperties, ...f22WingWakeCloudProperties],
    },
    f22_stdm: {
        damage: 300,
        pulsion: 300.0,
        xSpeedDecrease: 0.3,
        ySpeedDecrease: 0.3,
        zSpeedDecrease: 0.8,
        rotationSpeed: 60,
        lockRange: 2000,
        lockAngle: 40,
        lockNumber: 1,
        polyEstimate: 4,
        lifeTime: 20,
        loadTime: 6,
        loadNumber: 2,
        totalNumber: 180,
        firePosition: [[2.5, -2.5, 7], [-2.5, -2.5, 7]],
        sound: {
            'speech' : Fox2Sound,
            'explosion' : ExplosionSound,
            'fire' : MissileShotSound
        },
        wakeCloud: [missileWakeCloudProperty],
    },
    f22_6aam: {
        damage: 600,
        pulsion: 250.0,
        xSpeedDecrease: 0.4,
        ySpeedDecrease: 0.4,
        zSpeedDecrease: 0.7,
        rotationSpeed: 40,
        lockRange: 3000,
        lockAngle: 40,
        lockNumber: 6,
        polyEstimate: 3,
        lifeTime: 20,
        loadTime: 24,
        loadNumber: 6,
        totalNumber: 48,
        firePosition: [[2.0, -3.0, 7], [1.2, -3.0, 7], [0.4, -3.0, 7], [-0.4, -3.0, 7], [-1.2, -3.0, 7], [-2.0, -2.5, 7]],
        sound: {
            'speech' : Fox3Sound,
            'explosion' : ExplosionSound,
            'fire' : MissileShotSound
        },
        wakeCloud: [missileWakeCloudProperty],
    },
    f22_laam: {
        damage: 1000,
        pulsion: 1000.0,
        xSpeedDecrease: 0.2,
        ySpeedDecrease: 0.2,
        zSpeedDecrease: 0.8,
        rotationSpeed: 40,
        lockRange: 10000,
        lockAngle: 60,
        lockNumber: 1,
        polyEstimate: 5,
        lifeTime: 30,
        loadTime: 30,
        loadNumber: 2,
        totalNumber: 12,
        firePosition: [[2.5, -2.5, 7], [-2.5, -2.5, 7]],
        sound: {
            'speech' : Fox3Sound,
            'explosion' : ExplosionSound,
            'fire' : MissileShotSound
        },
        wakeCloud: [missileWakeCloudProperty],
    },
    f22_qaam: {
        damage: 600.0,
        pulsion: 600.0,
        xSpeedDecrease: 0.05,
        ySpeedDecrease: 0.05,
        zSpeedDecrease: 0.9,
        rotationSpeed: 90,
        lockRange: 1500,
        lockAngle: 170,
        lockNumber: 1,
        polyEstimate: 10,
        lifeTime: 20,
        loadTime: 20,
        loadNumber: 2,
        totalNumber: 12,
        firePosition: [[2.5, -2.5, 7], [-2.5, -2.5, 7]],
        sound: {
            'speech' : Fox2Sound,
            'explosion' : ExplosionSound,
            'fire' : MissileShotSound
        },
        wakeCloud: [missileWakeCloudProperty],
    },
    // Add other entities as needed
} as const;

export const NPCProperties: {
    [key in EntityName]?: PlaneProperty | MissileProperty;
} = {
    npc_f22: {
        hp: 600,
        minPulsion: 10.0,
        defaultPulsion: 50.0,
        maxPulsion: 60.0,
        pulsionSensitivity: 5.0,
        xSpeedDecrease: 0.8,
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
        wakeCloud: [...f22EngineWakeCloudProperties, ...f22WingWakeCloudProperties],
    },
    npc_f22_stdm: {
        damage: 300,
        pulsion: 300.0,
        xSpeedDecrease: 0.3,
        ySpeedDecrease: 0.3,
        zSpeedDecrease: 0.8,
        rotationSpeed: 60,
        lockRange: 2000,
        lockAngle: 30,
        lockNumber: 1,
        polyEstimate: 3,
        lifeTime: 30,
        loadTime: 6,
        loadNumber: 2,
        totalNumber: 180,
        firePosition: [[2.5, -2.5, 7], [-2.5, -2.5, 7]],
        sound: {
            'speech' : Fox2Sound,
            'explosion' : ExplosionSound,
            'fire' : MissileShotSound
        },
        wakeCloud: [missileWakeCloudProperty],
    },
    npc_plane: {
        hp: 300,
        minPulsion: 1.0,
        defaultPulsion: 50.0,
        maxPulsion: 60.0,
        pulsionSensitivity: 0.0,
        xSpeedDecrease: 0.3,
        ySpeedDecrease: 0.2,
        zSpeedDecrease: 0.4,
        yawMinSpeed: -10,
        yawMaxSpeed: 10,
        rollMinSpeed: -30,
        rollMaxSpeed: 30,
        pitchMinSpeed: -10,
        pitchMaxSpeed: 10,
        yawSensitivity: 0,
        rollSensitivity: 0,
        pitchSensitivity: 0,
        sound: {
            'engine' : PropellerSound,
            'afterburner': Exs2EngineSound,
            'wind': WindSound,
            'explosion' : ExplosionSound
        },
        wakeCloud: [missileWakeCloudProperty],
    },
    npc_plane_stdm: {
        damage: 100,
        pulsion: 200.0,
        xSpeedDecrease: 0.3,
        ySpeedDecrease: 0.3,
        zSpeedDecrease: 0.6,
        rotationSpeed: 30,
        lockRange: 2000,
        lockAngle: 30,
        lockNumber: 1,
        polyEstimate: 3,
        lifeTime: 20,
        loadTime: 3,
        loadNumber: 1,
        totalNumber: 180,
        firePosition: [[2.5, -2.5, 7], [-2.5, -2.5, 7]],
        sound: {
            'speech' : Fox2Sound,
            'explosion' : ExplosionSound,
            'fire' : MissileShotSound
        },
        wakeCloud: [missileWakeCloudProperty],
    },
    // Add other entities as needed
} as const;
