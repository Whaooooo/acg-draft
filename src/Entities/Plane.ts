// src/Entities/Plane.ts

import { MovableEntity } from '../Core/MovableEntity';
import { Game } from '../Game';
import { EntityName } from '../Configs/EntityPaths';
import { PlaneProperty } from '../Configs/EntityProperty';
import * as THREE from 'three';
import { Weapon } from '../Core/Weapon';
import { PlaneState, updatePlaneState, updateControlVariable } from '../Utils/MoveUtils';
import { SoundProperty, soundPropertyToOption } from '../Configs/SoundProperty';
import { SoundEnum } from '../Configs/SoundPaths';
import { SoundType } from '../Enums/SoundType'; // Import the new SoundType enum
import { Player } from './Player'; // Import for type checking in sound

export class Plane extends MovableEntity {
    public name: EntityName;
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

    constructor(
        game: Game,
        entityId: number,
        assetName: EntityName,
        planeProperty: PlaneProperty,
        pos?: THREE.Vector3,
        qua?: THREE.Quaternion,
        velocity?: THREE.Vector3,
        iFFNumber?: number
    ) {
        super(game, entityId, assetName, pos, qua, velocity, iFFNumber);
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
        if (!this.ready || !this.entity) return;

        // Update weapons
        for (const weapon of this.weapons) {
            weapon.update(deltaTime);
        }

        // Update targets (locked targets)
        this.targets = this.game.targetManager.getLockList(this);

        // Prepare plane state for update
        const planeState: PlaneState = {
            quaternion: this.entity.quaternion,
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
        this.entity.quaternion.copy(updatedState.quaternion);
        this.velocity.copy(updatedState.velocity);

        // Store the lost speed norm for wind sound volume calculation
        this.lostSpeedNorm = updatedState.lostSpeed.length();

        this.updateSound();

        // Call the parent update to move the entity
        super.update(deltaTime);
    }

    protected updateSound(): void {
        this.engineSounds.forEach(({ soundId, soundType }) => {
            const sound = this.game.soundManager.getSoundById(soundId);
            if (!sound) return;

            let volume = 0;

            switch (soundType) {
                case SoundType.Engine:
                    // Volume based on pulsion: 0 pulsion => volume 0, maxPulsion => volume 1
                    volume = THREE.MathUtils.clamp(this.pulsion / this.property.maxPulsion, 0, 1);
                    break;
                case SoundType.Afterburner:
                    // Volume is 1 if pulsion is increased or reaches maxPulsion, else 0
                    volume = (!this.pulsionDecreased && this.pulsion > this.property.defaultPulsion) ? 1 : 0;
                    break;
                case SoundType.Wind:
                    // Volume based on lost speed: min(1, lostSpeedNorm / maxPulsionSpeed)
                    const maxPulsionSpeed = this.property.maxPulsion; // Adjust if different
                    volume = Math.min(1, this.lostSpeedNorm / maxPulsionSpeed);
                    break;
                default:
                    console.warn(`Unhandled sound type: ${soundType}`);
                    break;
            }

            // Set the calculated volume
            this.game.soundManager.setVolumeById(soundId, volume);

            // Update position if the sound is positional
            if (sound instanceof THREE.PositionalAudio) {
                sound.position.copy(this.getPosition());
            }
        });
    }

    public selectWeapon(id: number): void {
        if (id >= 0 && id < this.weapons.length) {
            this.selectedWeaponIndex = id;
        } else {
            console.warn(`Weapon index ${id} is out of bounds for entity ${this.entityId}.`);
        }
    }

    public fireWeapon(): void {
        // Get the selected weapon
        const weapon = this.weapons[this.selectedWeaponIndex];
        if (!weapon) {
            console.warn(`No weapon selected or weapon not found for entity ${this.entityId}.`);
            return;
        }
        weapon.fire();
    }

    public dispose(): void {
        // ... existing disposal logic ...

        // Stop and remove the engine sounds
        this.engineSounds.forEach(({ soundId }) => {
            this.game.soundManager.stopSoundById(soundId);
        });
        this.engineSounds = [];
    }
}
