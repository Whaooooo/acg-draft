// src/Entities/Player.ts

import { Plane } from './Plane';
import { Game } from '../Game';
import { EntityName } from '../Configs/EntityPaths';
import { ViewMode } from '../Enums/ViewMode';
import { PlaneProperty, PlayerProperties } from '../Configs/EntityProperty';
import { KeyBoundConfig, KeyBoundConfigs } from '../Configs/KeyBound';
import * as THREE from 'three';
import { updateControlVariable } from '../Utils/MoveUtils';
import { InputState } from '../Managers/InputManager';

export class Player extends Plane {
    public viewMode: ViewMode;
    public shakingFactor = 0.4;
    public isLocalPlayer: boolean; // Indicates if this player is controlled locally

    // Key mapping configuration
    private keyConfig: KeyBoundConfig;

    // Input state for this player
    private inputState: InputState;

    constructor(
        game: Game,
        assetName: EntityName,
        pos?: THREE.Vector3,
        qua?: THREE.Quaternion,
        velocity?: THREE.Vector3,
        iFFNumber?: number,
        keyConfigIndex: number = 0, // Index of the key mapping configuration
        isLocalPlayer: boolean = false // Indicates if this player is controlled locally
    ) {
        const planeProperty = PlayerProperties[assetName] as PlaneProperty;
        super(game, assetName, planeProperty, pos, qua, velocity, iFFNumber);
        game.playerMap.set(this.entityId, this);

        this.viewMode = ViewMode.FirstPerson;
        this.isLocalPlayer = isLocalPlayer;

        // Initialize key mapping configuration
        this.keyConfig = KeyBoundConfigs[keyConfigIndex] || KeyBoundConfigs[0];

        // Initialize input state
        this.inputState = new InputState();

        if (this.isLocalPlayer) {
            // If this is a local player, register input listener
            this.game.inputManager.registerPlayer(this);
        }
    }

    public getInputState(): InputState {
        return this.inputState;
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
        // Use the player's input state instead of the global input manager
        const inputState = this.inputState;
        const keyConfig = this.keyConfig;

        // Handle weapon selection using new keys
        if (inputState.checkInput(keyConfig.selectWeapon1)) {
            this.selectWeapon(0);
        }

        if (inputState.checkInput(keyConfig.selectWeapon2)) {
            this.selectWeapon(1);
        }

        if (inputState.checkInput(keyConfig.selectWeapon3)) {
            this.selectWeapon(2);
        }

        if (inputState.checkInput(keyConfig.selectWeapon4)) {
            this.selectWeapon(3);
        }

        // Update control variables using the helper function
        const pulsionUpdate = updateControlVariable(
            this.pulsion,
            this.property.defaultPulsion,
            this.property.minPulsion,
            this.property.maxPulsion,
            this.property.pulsionSensitivity,
            inputState.checkInput(keyConfig.increaseThrust),
            inputState.checkInput(keyConfig.decreaseThrust),
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
            inputState.checkInput(keyConfig.yawLeft),
            inputState.checkInput(keyConfig.yawRight),
            deltaTime
        ).value;

        this.pitchSpeed = updateControlVariable(
            this.pitchSpeed,
            0,
            this.property.pitchMinSpeed,
            this.property.pitchMaxSpeed,
            this.property.pitchSensitivity,
            inputState.checkInput(keyConfig.pitchUp),
            inputState.checkInput(keyConfig.pitchDown),
            deltaTime
        ).value;

        this.rollSpeed = updateControlVariable(
            this.rollSpeed,
            0,
            this.property.rollMinSpeed,
            this.property.rollMaxSpeed,
            this.property.rollSensitivity,
            inputState.checkInput(keyConfig.rollLeft),
            inputState.checkInput(keyConfig.rollRight),
            deltaTime
        ).value;

        // Update animation states based on input
        this.setAnimationState('yawLeft', inputState.checkInput(keyConfig.yawLeft) && !inputState.checkInput(keyConfig.yawRight));
        this.setAnimationState('yawRight', inputState.checkInput(keyConfig.yawRight) && !inputState.checkInput(keyConfig.yawLeft));
        this.setAnimationState('pitchUp', inputState.checkInput(keyConfig.pitchUp) && !inputState.checkInput(keyConfig.pitchDown));
        this.setAnimationState('pitchDown', inputState.checkInput(keyConfig.pitchDown) && !inputState.checkInput(keyConfig.pitchUp));
        this.setAnimationState('rollLeft', inputState.checkInput(keyConfig.rollLeft) && !inputState.checkInput(keyConfig.rollRight));
        this.setAnimationState('rollRight', inputState.checkInput(keyConfig.rollRight) && !inputState.checkInput(keyConfig.rollLeft));
        this.setAnimationState('increaseThrust', inputState.checkInput(keyConfig.increaseThrust) && !inputState.checkInput(keyConfig.decreaseThrust));
        this.setAnimationState('decreaseThrust', inputState.checkInput(keyConfig.decreaseThrust) && !inputState.checkInput(keyConfig.increaseThrust));

        // Fire weapon
        if (inputState.checkInput(keyConfig.fireWeapon)) {
            this.fireWeapon();
        }

        // Toggle view mode
        if (inputState.checkInput(keyConfig.toggleViewMode)) {
            this.game.cameraManager.toggleViewMode(this);
        }

        // Re-target
        if (inputState.checkInput(keyConfig.reTarget)) {
            this.game.targetManager.reTarget(this, this.weapons[this.selectedWeaponIndex]);
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

    public dispose(): void {
        if (this.isLocalPlayer) {
            this.game.inputManager.unregisterPlayer(this);
        }
        this.game.playerMap.delete(this.entityId);
        super.dispose();
    }
}
