// src/Entities/Player.ts

import { MovableEntity } from '../Core/MovableEntity';
import { Game } from '../Game';
import { EntityName } from '../Configs/EntityPaths';
import { ViewMode } from '../Enums/ViewMode';
import { PlaneProperty, PlayerProperties, SoundProperty } from '../Configs/EntityProperty';
import * as THREE from 'three';
import { Weapon } from '../Core/Weapon';
import { KeyBoundConfig, KeyBoundConfigs } from '../Configs/KeyBound';
import { updateControlVariable } from '../Utils/MoveUtils'; // Import the function
import { PlaneState, updatePlaneState} from "../Utils/MoveUtils";

export class Player extends MovableEntity {
    public name: EntityName;
    public viewMode: ViewMode;

    public property: PlaneProperty;

    public weapons: Weapon[];
    public selectedWeaponIndex: number = 0; // Index of the currently selected weapon

    // Key mapping configuration
    private keyConfig: KeyBoundConfig;

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
        iFFNumber?: number,
        keyConfigIndex: number = 0 // Index of the key mapping configuration
    ) {
        super(game, entityId, assetName, pos, qua, velocity, iFFNumber);
        this.name = assetName;
        this.viewMode = ViewMode.ThirdPerson;

        // Initialize plane properties
        this.property = PlayerProperties[this.name] as PlaneProperty;

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

        // Initialize key mapping configuration
        this.keyConfig = KeyBoundConfigs[keyConfigIndex] || KeyBoundConfigs[0];

        // Initialize pulsion to defaultPulsion
        this.pulsion = this.property.defaultPulsion;
    }

    public initializeSound(): void {
        const soundConfig = this.property.sound
        const engineSoundProperty = soundConfig['engine']
        if (!engineSoundProperty) {
            return
        }

        this.engineSoundId = `engine_player_${this.entityId}`;

        // Play the engine sound
        this.game.soundManager.playSound(
            this,
            engineSoundProperty.name, // Use the correct SoundEnum value for 'engine'
            {
                loop: engineSoundProperty.loop,
                volume: engineSoundProperty.volume, // Initial volume
                position: this.getPosition(), // If the sound is positional
                refDistance: 20,
                maxDistance: 1000,
                rolloffFactor: 1,
                autoplay: true,
                soundId: this.engineSoundId,
            }
        );
    }

    public update(deltaTime: number): void {
        if (!this.ready || !this.entity) return;

        // Handle input
        this.handleInput(deltaTime);

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

        this.updateSound()

        // Call the parent update to move the entity
        super.update(deltaTime);
    }

    private handleInput(deltaTime: number): void {
        if (!this.ready || !this.entity) return;
        const inputManager = this.game.inputManager;
        const keyConfig = this.keyConfig;

        // Handle weapon selection using new keys
        if (inputManager.checkInput(keyConfig.selectWeapon1)) {
            this.selectWeapon(0);
        }

        if (inputManager.checkInput(keyConfig.selectWeapon2)) {
            this.selectWeapon(1);
        }

        if (inputManager.checkInput(keyConfig.selectWeapon3)) {
            this.selectWeapon(2);
        }

        if (inputManager.checkInput(keyConfig.selectWeapon4)) {
            this.selectWeapon(3);
        }

        // Update control variables using the helper function
        this.pulsion = updateControlVariable(
            this.pulsion,
            this.property.defaultPulsion,
            this.property.minPulsion,
            this.property.maxPulsion,
            this.property.pulsionSensitivity,
            inputManager.checkInput(keyConfig.increaseThrust),
            inputManager.checkInput(keyConfig.decreaseThrust),
            deltaTime
        );

        this.yawSpeed = updateControlVariable(
            this.yawSpeed,
            0,
            this.property.yawMinSpeed,
            this.property.yawMaxSpeed,
            this.property.yawSensitivity,
            inputManager.checkInput(keyConfig.yawLeft),
            inputManager.checkInput(keyConfig.yawRight),
            deltaTime
        );

        this.pitchSpeed = updateControlVariable(
            this.pitchSpeed,
            0,
            this.property.pitchMinSpeed,
            this.property.pitchMaxSpeed,
            this.property.pitchSensitivity,
            inputManager.checkInput(keyConfig.pitchUp),
            inputManager.checkInput(keyConfig.pitchDown),
            deltaTime
        );

        this.rollSpeed = updateControlVariable(
            this.rollSpeed,
            0,
            this.property.rollMinSpeed,
            this.property.rollMaxSpeed,
            this.property.rollSensitivity,
            inputManager.checkInput(keyConfig.rollLeft),
            inputManager.checkInput(keyConfig.rollRight),
            deltaTime
        );

        // Fire weapon
        if (inputManager.checkInput(keyConfig.fireWeapon)) {
            this.fireWeapon();
        }

        // Toggle view mode
        if (inputManager.checkInput(keyConfig.toggleViewMode)) {
            this.game.cameraManager.toggleViewMode(this);
        }

        // Re-target
        if (inputManager.checkInput(keyConfig.reTarget)) {
            this.reTarget();
        }
    }

    private updateSound(): void {
        if (this.engineSoundId){
            const pulsion = this.pulsion;
            const maxPulsion = this.property.maxPulsion;
            const volume = THREE.MathUtils.clamp(pulsion / maxPulsion, 0, 1);

            this.game.soundManager.setVolumeById(this.engineSoundId, volume);

            // Update position if the sound is positional
            const engineSound = this.game.soundManager.getSoundById(this.engineSoundId);
            if (engineSound && engineSound instanceof THREE.PositionalAudio) {
                engineSound.position.copy(this.getPosition());
            }
        }
    }

    public selectWeapon(id: number): void {
        if (id <= this.weapons.length - 1){
            this.selectedWeaponIndex = id
        }
    }


    public fireWeapon(): void {
        // Get the selected weapon
        const weapon = this.weapons[this.selectedWeaponIndex];
        if (!weapon) {
            console.warn('No weapon selected or weapon not found.');
            return;
        }
        weapon.fire();
    }

    public reTarget(): void {

    }

    public dispose(): void {
        // ... existing disposal logic ...

        // Stop and remove the engine sound
        if (this.engineSoundId){
            this.game.soundManager.stopSoundById(this.engineSoundId);
        }
    }

}
