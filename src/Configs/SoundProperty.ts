// src/Configs/SoundProperty.ts

import * as THREE from 'three';
import { SoundEnum } from './SoundPaths';
import { Entity } from "../Core/Entity";

export interface _SoundProperty {
    name: SoundEnum;
    cooldown?: number;
    volume?: number;
    loop?: boolean;
    displacement?: THREE.Vector3;
    refDistance?: number;
    maxDistance?: number;
    rolloffFactor?: number;
    autoplay?: boolean;
    targetAll?: boolean;
}

export interface SoundProperty {
    name: SoundEnum;
    cooldown: number;
    volume: number;
    loop: boolean;
    displacement: THREE.Vector3;
    refDistance: number;
    maxDistance: number;
    rolloffFactor: number;
    autoplay: boolean;
    targetAll: boolean;
}

export type SoundPropertyName = keyof _SoundProperty;

export function soundPropertyToOption(
    prop: SoundProperty,
    entity: Entity,
    options?: {
        loop?: boolean;
        volume?: number;
        position?: THREE.Vector3;
        refDistance?: number;
        maxDistance?: number;
        rolloffFactor?: number;
        autoplay?: boolean;
        soundId?: string;
    }
): {
    loop: boolean;
    volume: number;
    position: THREE.Vector3;
    refDistance: number;
    maxDistance: number;
    rolloffFactor: number;
    autoplay: boolean;
    soundId: string;
} {
    return {
        loop: options?.loop ?? prop.loop,
        volume: options?.volume ?? prop.volume,
        position: options?.position ?? entity.getPosition().clone().add(prop.displacement),
        refDistance: options?.refDistance ?? prop.refDistance,
        maxDistance: options?.maxDistance ?? prop.maxDistance,
        rolloffFactor: options?.rolloffFactor ?? prop.rolloffFactor,
        autoplay: options?.autoplay ?? prop.autoplay,
        soundId: options?.soundId ?? `${prop.name}_${entity.assetName}_${entity.entityId}`,
    };
}


export function createSoundProperty(props: _SoundProperty): SoundProperty {
    return {
        cooldown: 0,
        volume: 1,
        loop: false,
        displacement: new THREE.Vector3(0, 0, 0),
        refDistance: 20,
        maxDistance: 20,
        rolloffFactor: 1,
        autoplay: true,
        targetAll: true,
        ...props, // Overwrite defaults with provided values
    };
}

// SoundProperty Instances

export const F14EngineSound: SoundProperty = createSoundProperty({
    name: 'f14engine',
    loop: true,
    refDistance: 40,
    maxDistance: 300,
    displacement: new THREE.Vector3(0, 0, 4),
});

export const F14AfterburnerSound: SoundProperty = createSoundProperty({
    name: 'f14afterburner',
    loop: true,
    volume: 0,
    refDistance: 60,
    maxDistance: 500,
    displacement: new THREE.Vector3(0, 0, 4),
});

export const WindSound: SoundProperty = createSoundProperty({
    name: 'wind',
    loop: true,
    refDistance: 40,
    maxDistance: 40,
    targetAll: false,
});

export const ExplosionSound: SoundProperty = createSoundProperty({
    name: 'explosion',
    refDistance: 200,
    maxDistance: 4000,
});

export const Fox2Sound: SoundProperty = createSoundProperty({
    name: 'fox2',
    cooldown: 30,
    refDistance: 1000,
    maxDistance: 1000,
    loop: false,
    targetAll: false,
});

export const Fox3Sound: SoundProperty = createSoundProperty({
    name: 'fox3',
    cooldown: 30,
    refDistance: 1000,
    maxDistance: 1000,
    loop: false,
    targetAll: false,
});

export const MissileShotSound: SoundProperty = createSoundProperty({
    name: 'missileshot',
    loop: true,
    refDistance: 5,
    maxDistance: 100,
    targetAll: true,
});

export const PropellerSound: SoundProperty = createSoundProperty({
    name: 'propeller',
    loop: true,
    maxDistance: 100,
    targetAll: true,
    displacement: new THREE.Vector3(0, 0, -1),
});

export const Exs2EngineSound: SoundProperty = createSoundProperty({
    name: 'exs2engine',
    volume: 0,
    maxDistance: 200,
    loop: true,
    targetAll: true,
    displacement: new THREE.Vector3(0, 0, -1),
});