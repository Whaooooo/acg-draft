// src/Entities/NPC.ts

import { Game } from '../Game';
import * as THREE from 'three';
import { EntityName } from '../Configs/EntityPaths';
import { MovableEntity } from '../Core/MovableEntity';
import { PlaneProperty, NPCProperties, SoundProperty } from '../Configs/EntityProperty';
import { Weapon } from '../Core/Weapon';
import { PlaneState, updatePlaneState} from "../Utils/MoveUtils";
import { SoundEnum } from '../Configs/SoundPaths';

export class NPC extends MovableEntity {
    public name: EntityName;

    public property: PlaneProperty;

    public weapons: Weapon[];
    public selectedWeaponIndex: number = 0;

    // Real-time control variables
    public pulsion: number;
    public yawSpeed: number = 0;
    public pitchSpeed: number = 0;
    public rollSpeed: number = 0;

    public engineSoundId?: string;

    constructor(
        game: Game,
        entityId: number,
        assetName: EntityName,
        pos?: THREE.Vector3,
        qua?: THREE.Quaternion,
        velocity?: THREE.Vector3,
        iFFNumber?: number
    ) {
        super(game, entityId, assetName, pos, qua, velocity, iFFNumber);
        this.name = assetName;

        // Initialize plane properties
        this.property = NPCProperties[this.name] as PlaneProperty;

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
     * Initializes and plays the engine sound for the NPC.
     */
    public initializeSound(): void {
        const soundConfig = this.property.sound;
        const engineSoundProperty = soundConfig['engine'];
        if (!engineSoundProperty) {
            console.warn(`Engine sound property not defined for NPC ${this.entityId}`);
            return;
        }

        this.engineSoundId = `engine_npc_${this.entityId}`;

        // Play the engine sound
        this.game.soundManager.playSound(
            this, // soundCreator is the NPC itself
            engineSoundProperty.name, // Use the correct SoundEnum value for 'engine'
            {
                loop: engineSoundProperty.loop,
                volume: engineSoundProperty.volume, // Initial volume
                position: new THREE.Vector3(this.getPosition().x, this.getPosition().y, this.getPosition().z + 4),
                // position is optional; if not provided, it will use soundCreator's position
                refDistance: 20,
                maxDistance: 1000,
                rolloffFactor: 1,
                autoplay: true,
                soundId: this.engineSoundId,
            }
            // targetPlayers is optional; if not provided, sound plays for all players
        );
    }

    /**
     * Updates the NPC's state, including sound and movement.
     * @param deltaTime - Time elapsed since the last update.
     */
    public update(deltaTime: number): void {
        if (!this.ready || !this.entity) return;

        // Implement AI-specific update logic here
        this.controlAI(deltaTime);

        // Update weapons
        for (const weapon of this.weapons) {
            weapon.update(deltaTime);
        }

        // Update targets (locked targets)
        this.targets = this.game.targetManager.getLockList(this);

        // Prepare the plane state for updating movement
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

        // Use the existing updatePlaneState function to calculate the new state
        const updatedState = updatePlaneState(planeState, deltaTime);

        // Apply the updated quaternion and velocity to the NPC's entity
        this.entity.quaternion.copy(updatedState.quaternion);
        this.velocity.copy(updatedState.velocity);

        // Update sound
        this.updateSound();

        // Call the parent update to move the entity
        super.update(deltaTime);
    }

    /**
     * Updates the sound properties of the NPC, such as volume and position.
     */
    private updateSound(): void {
        if (this.engineSoundId) {
            const pulsion = this.pulsion;
            const maxPulsion = this.property.maxPulsion;
            const volume = THREE.MathUtils.clamp(pulsion / maxPulsion, 0, 1);

            this.game.soundManager.setVolumeById(this.engineSoundId, volume);

            // Update position if the sound is positional
            const engineSound = this.game.soundManager.getSoundById(this.engineSoundId);
            if (engineSound && engineSound instanceof THREE.PositionalAudio) {
                engineSound.position.copy(new THREE.Vector3(this.getPosition().x, this.getPosition().y, this.getPosition().z + 4));
            }
        }
    }

    /**
     * Placeholder for AI control logic to manipulate NPC's movement.
     * Implement your AI algorithms here to set yawSpeed, pitchSpeed, rollSpeed, and pulsion.
     * @param deltaTime - Time elapsed since the last update.
     */
    private controlAI(deltaTime: number): void {
        // Example AI behavior (to be implemented)
        // This function should update yawSpeed, pitchSpeed, rollSpeed, and pulsion based on AI decisions
    }

    /**
     * Disposes of the NPC's resources, including sounds.
     */
    public dispose(): void {
        // ... existing disposal logic ...

        // Stop and remove the engine sound
        if (this.engineSoundId) {
            this.game.soundManager.stopSoundById(this.engineSoundId);
        }
    }

    /**
     * Selects a weapon by its index.
     * @param id - The index of the weapon to select.
     */
    public selectWeapon(id: number): void {
        if (id >= 0 && id < this.weapons.length) {
            this.selectedWeaponIndex = id;
        } else {
            console.warn(`Weapon index ${id} is out of bounds for NPC ${this.entityId}.`);
        }
    }

    /**
     * Fires the currently selected weapon.
     */
    public fireWeapon(): void {
        // Get the selected weapon
        const weapon = this.weapons[this.selectedWeaponIndex];
        if (!weapon) {
            console.warn(`No weapon selected or weapon not found for NPC ${this.entityId}.`);
            return;
        }
        weapon.fire();
    }
}
