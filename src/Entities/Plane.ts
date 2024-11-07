// src/Entities/Plane.ts

import { MovableEntity } from '../Core/MovableEntity';
import { Game } from '../Game';
import { EntityName } from '../Configs/EntityPaths';
import { PlaneProperty } from '../Configs/EntityProperty';
import * as THREE from 'three';
import { Weapon } from '../Core/Weapon';
import { PlaneState, updatePlaneState } from '../Utils/MoveUtils';
import { SoundType } from '../Enums/SoundType';
import { soundPropertyToOption } from "../Configs/SoundProperty";
import { Player } from './Player';
import {
    PlaneAnimationBoundConfigs,
    PlaneAnimationBoundConfig,
    initializeEmptyPlaneAnimationBoundConfig
} from '../Configs/AnimationBound';
import { updatePlaneAnimations } from '../Utils/AnimationUtils';
import {SoundEnum} from "../Configs/SoundPaths";
import {Explosion} from "./Explosion";

export class Plane extends MovableEntity {
    public name: EntityName;
    public currentHP: number = 0;
    public property: PlaneProperty;

    public weapons: Weapon[];
    public selectedWeaponIndex: number = 0;

    // Real-time control variables
    public pulsion: number;
    public yawSpeed: number = 0;
    public pitchSpeed: number = 0;
    public rollSpeed: number = 0;

    public pulsionIncreased: boolean = false;
    public pulsionDecreased: boolean = false;
    public lostSpeedNorm: number = 0;

    // Enhanced engineSounds with soundType
    public engineSounds: { soundId: string; soundType: SoundType }[] = [];

    // Animation properties
    public activeAnimations: Map<string, THREE.AnimationAction> = new Map();
    public animationStates: Map<string, boolean> = new Map();
    public previousAnimationStates: Map<string, boolean> = new Map();
    public animationConfig: PlaneAnimationBoundConfig;
    public actionEventListeners: Map<string, (event: THREE.AnimationMixerEventMap["finished"]) => void> = new Map();

    constructor(
        game: Game,
        assetName: EntityName,
        planeProperty: PlaneProperty,
        pos?: THREE.Vector3,
        qua?: THREE.Quaternion,
        velocity?: THREE.Vector3,
        iFFNumber?: number
    ) {
        super(game, assetName, pos, qua, velocity, iFFNumber);
        this.name = assetName;
        this.property = planeProperty;

        // Initialize weapons list
        this.weapons = [];

        // Get the plane's configuration from EntityConfigs
        const planeConfig = this.assetConfig;
        if (planeConfig && planeConfig.children) {
            // For each weapon name in the children list, create a Weapon instance
            for (const weaponName of planeConfig.children) {
                try {
                    const weapon = new Weapon(this.game, this, this.name, weaponName);
                    this.weapons.push(weapon);
                } catch (error) {
                    console.error(error);
                }
            }
        } else {
            console.warn(`No weapons defined for plane ${this.name}`);
        }

        // Initialize pulsion to defaultPulsion
        this.pulsion = this.property.defaultPulsion;

        // Load animation config
        this.animationConfig = PlaneAnimationBoundConfigs[this.name] || initializeEmptyPlaneAnimationBoundConfig();

        const animationTypes = [
            'increaseThrust', 'decreaseThrust', 'yawLeft', 'yawRight',
            'pitchUp', 'pitchDown', 'rollLeft', 'rollRight',
            'fireWeapon', 'openMagazine'
        ];
        for (const animType of animationTypes) {
            this.animationStates.set(animType, false);
            this.previousAnimationStates.set(animType, false);
        }

        this.currentHP = this.property.hp;
    }

    /**
     * Initializes and plays the engine, afterburner, and wind sounds.
     */
    public initializeSound(): void {
        const soundConfig = this.property.sound;
        const flySoundKeys: (keyof PlaneProperty['sound'])[] = [SoundType.Engine, SoundType.Afterburner, SoundType.Wind];

        flySoundKeys.forEach((key) => {
            const soundProperty = soundConfig[key];
            if (!soundProperty) {
                return;
            }

            // Determine the sound type based on the key
            let soundType: SoundType;
            switch (key) {
                case 'engine':
                    soundType = SoundType.Engine;
                    break;
                case 'afterburner':
                    soundType = SoundType.Afterburner;
                    break;
                case 'wind':
                    soundType = SoundType.Wind;
                    break;
                default:
                    console.warn(`Unknown sound key: ${key}`);
                    return;
            }

            // Generate options using soundPropertyToOption
            const options = soundPropertyToOption(soundProperty, this);

            // Play the sound
            this.game.soundManager.playSound(
                this,
                soundProperty.name,
                options,
                soundProperty.targetAll ? undefined : this.getTargetPlayers()
            );

            // Store the soundId and soundType for later reference
            this.engineSounds.push({ soundId: options.soundId, soundType });
        });
    }

    protected getTargetPlayers(): Player[] {
        // Override in subclasses if needed
        return [];
    }

    public update(deltaTime: number): void {
        // Update weapons
        for (const weapon of this.weapons) {
            weapon.update(deltaTime);
        }

        // Update targets (locked targets)
        this.targets = this.game.targetManager.getLockList(this);

        // Prepare plane state for update
        const planeState: PlaneState = {
            quaternion: this.getQuaternion(),
            velocity: this.velocity,
            yawSpeed: this.yawSpeed,
            pitchSpeed: this.pitchSpeed,
            rollSpeed: this.rollSpeed,
            pulsion: this.pulsion,
            xSpeedDecrease: this.property.xSpeedDecrease,
            ySpeedDecrease: this.property.ySpeedDecrease,
            zSpeedDecrease: this.property.zSpeedDecrease,
        };

        // Update plane state
        const updatedState = updatePlaneState(planeState, deltaTime);

        // Apply the updated quaternion and velocity
        this.setQuaternion(updatedState.quaternion);
        this.velocity.copy(updatedState.velocity);

        // Store the lost speed norm for wind sound volume calculation
        this.lostSpeedNorm = updatedState.lostSpeed.length();

        // Update sound volumes based on the new state
        this.updateSound();

        // Update animations
        this.updateAnimation(deltaTime);

        // Call the parent update to move the entity and update animations
        super.update(deltaTime);
    }

    public updateAnimation(deltaTime: number): void {
        // Update plane-specific animations
        if (this.mixer && this.actions.size > 0) {
            updatePlaneAnimations(this, deltaTime);
        }
    }

    protected updateSound(): void {
        this.engineSounds.forEach(({ soundId, soundType }) => {
            const sound = this.game.soundManager.getSoundById(soundId);
            if (!sound) return;

            let volume = 0;

            switch (soundType) {
                case SoundType.Engine:
                    volume = THREE.MathUtils.clamp(this.pulsion / this.property.maxPulsion, 0, 1);
                    break;
                case SoundType.Afterburner:
                    if (!this.pulsionDecreased) {
                        volume = Math.max(0, this.pulsion - this.property.defaultPulsion) / (this.property.maxPulsion - this.property.defaultPulsion);
                    }
                    break;
                case SoundType.Wind:
                    const maxPulsionSpeed = this.property.maxPulsion;
                    volume = Math.min(1, this.lostSpeedNorm / maxPulsionSpeed) * 0.8 + 0.2;
                    break;
                default:
                    console.warn(`Unhandled sound type: ${soundType}`);
                    break;
            }

            this.game.soundManager.setVolumeById(soundId, volume);

            if (sound instanceof THREE.PositionalAudio) {
                sound.position.copy(this.getPosition());
            }
        });
    }

    public setAnimationState(animationType: string, isActive: boolean): void {
        this.previousAnimationStates.set(animationType, this.animationStates.get(animationType) as boolean);
        this.animationStates.set(animationType, isActive);
    }

    public selectWeapon(id: number): void {
        if (id >= 0 && id < this.weapons.length) {
            this.selectedWeaponIndex = id;
        } else {
            console.warn(`Weapon index ${id} is out of bounds for entity ${this.entityId}.`);
        }
    }

    public fireWeapon(): void {
        const weapon = this.weapons[this.selectedWeaponIndex];
        if (!weapon) {
            console.warn(`No weapon selected or weapon not found for entity ${this.entityId}.`);
            return;
        }
        weapon.fire();
    }

    public dispose(): void {
        const explosionSoundProperty = this.property.sound?.explosion;
        if (explosionSoundProperty) {
            const options = soundPropertyToOption(explosionSoundProperty, this);

            // Play the sound and store the sound ID if needed
            this.game.soundManager.playSound(
                this,
                explosionSoundProperty.name as SoundEnum,
                options,
            );
        }

        new Explosion(this.game, this.getPosition(), this.getQuaternion(), 50, 2.0, 0.1, 0.45, 0.8);

        // Stop and remove the engine sounds
        this.engineSounds.forEach(({ soundId }) => {
            this.game.soundManager.stopSoundById(soundId);
        });
        this.engineSounds = [];

        // Dispose of animations
        if (this.mixer) {
            this.activeAnimations.forEach((action) => {
                action.stop();
            });
            this.activeAnimations.clear();
        }

        super.dispose();
    }
}
