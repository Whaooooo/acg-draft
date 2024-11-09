// src/Entities/Player.ts

import { Plane } from './Plane';
import { Game } from '../Game';
import { EntityName } from '../Configs/EntityPaths';
import { ViewMode } from '../Enums/ViewMode';
import { PlaneProperty, PlayerProperties } from '../Configs/EntityProperty';
import { KeyBoundConfig, KeyBoundConfigs } from '../Configs/KeyBound';
import * as THREE from 'three';
import { updateControlVariable } from '../Utils/MoveUtils';

export class Player extends Plane {
    public viewMode: ViewMode;
    public shakingFactor = 0.4;

    // Key mapping configuration
    private keyConfig: KeyBoundConfig;

    constructor(
        game: Game,
        assetName: EntityName,
        pos?: THREE.Vector3,
        qua?: THREE.Quaternion,
        velocity?: THREE.Vector3,
        iFFNumber?: number,
        keyConfigIndex: number = 0 // Index of the key mapping configuration
    ) {
        const planeProperty = PlayerProperties[assetName] as PlaneProperty;
        super(game, assetName, planeProperty, pos, qua, velocity, iFFNumber);
        game.playerMap.set(this.entityId, this);

        this.viewMode = ViewMode.FirstPerson;

        // Initialize key mapping configuration
        this.keyConfig = KeyBoundConfigs[keyConfigIndex] || KeyBoundConfigs[0];
    }

    protected getTargetPlayers(): Player[] {
        // For player, target themselves for non-global sounds
        return [this];
    }

    public update(deltaTime: number): void {
        // Handle input
        this.handleInput(deltaTime);

        // Update camera shake based on lostSpeedNorm
        this.updateCameraShake();

        // Call the parent update
        super.update(deltaTime);
    }

    private handleInput(deltaTime: number): void {
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
        const pulsionUpdate = updateControlVariable(
            this.pulsion,
            this.property.defaultPulsion,
            this.property.minPulsion,
            this.property.maxPulsion,
            this.property.pulsionSensitivity,
            inputManager.checkInput(keyConfig.increaseThrust),
            inputManager.checkInput(keyConfig.decreaseThrust),
            deltaTime
        );
        this.pulsion = pulsionUpdate.value;
        this.pulsionIncreased = pulsionUpdate.increased;
        this.pulsionDecreased = pulsionUpdate.decreased;


        this.yawSpeed = updateControlVariable(
            this.yawSpeed,
            0,
            this.property.yawMinSpeed,
            this.property.yawMaxSpeed,
            this.property.yawSensitivity,
            inputManager.checkInput(keyConfig.yawLeft),
            inputManager.checkInput(keyConfig.yawRight),
            deltaTime
        ).value;

        this.pitchSpeed = updateControlVariable(
            this.pitchSpeed,
            0,
            this.property.pitchMinSpeed,
            this.property.pitchMaxSpeed,
            this.property.pitchSensitivity,
            inputManager.checkInput(keyConfig.pitchUp),
            inputManager.checkInput(keyConfig.pitchDown),
            deltaTime
        ).value;

        this.rollSpeed = updateControlVariable(
            this.rollSpeed,
            0,
            this.property.rollMinSpeed,
            this.property.rollMaxSpeed,
            this.property.rollSensitivity,
            inputManager.checkInput(keyConfig.rollLeft),
            inputManager.checkInput(keyConfig.rollRight),
            deltaTime
        ).value;

        // Update animation states based on input
        this.setAnimationState('yawLeft', inputManager.checkInput(keyConfig.yawLeft) && !inputManager.checkInput(keyConfig.yawRight));
        this.setAnimationState('yawRight', inputManager.checkInput(keyConfig.yawRight) && !inputManager.checkInput(keyConfig.yawLeft));
        this.setAnimationState('pitchUp', inputManager.checkInput(keyConfig.pitchUp) && !inputManager.checkInput(keyConfig.pitchDown));
        this.setAnimationState('pitchDown', inputManager.checkInput(keyConfig.pitchDown) && !inputManager.checkInput(keyConfig.pitchUp));
        this.setAnimationState('rollLeft', inputManager.checkInput(keyConfig.rollLeft) && !inputManager.checkInput(keyConfig.rollRight));
        this.setAnimationState('rollRight', inputManager.checkInput(keyConfig.rollRight) && !inputManager.checkInput(keyConfig.rollLeft));
        this.setAnimationState('increaseThrust', inputManager.checkInput(keyConfig.increaseThrust) && !inputManager.checkInput(keyConfig.decreaseThrust));
        this.setAnimationState('decreaseThrust', inputManager.checkInput(keyConfig.decreaseThrust) && !inputManager.checkInput(keyConfig.increaseThrust));

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

    private updateCameraShake(): void {
        // Use lostSpeedNorm to calculate shake intensity
        const maxLostSpeedForShake = this.property.maxPulsion; // Or adjust as appropriate
        let intensity = Math.min(1, this.lostSpeedNorm / maxLostSpeedForShake);

        // Scale the intensity to control the shake effect
        intensity *= this.shakingFactor;

        // Set the shake intensity in the camera manager
        this.game.cameraManager.setShakeIntensity(this, intensity);
    }

    public getOwnerPlayer(): Player[] {
        // NPCs may have different logic; for now, return an empty array
        return [this];
    }

    public reTarget(): void {
        // Implement re-targeting logic if needed
    }

    public dispose(): void {
        this.game.playerMap.delete(this.entityId);
        super.dispose();
    }
}
