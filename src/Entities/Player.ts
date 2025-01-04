// src/Entities/Player.ts

import { Plane } from './Plane';
import { Game } from '../Game';
import { EntityName } from '../Configs/EntityPaths';
import { ViewMode } from '../Enums/ViewMode';
import { PlaneProperty, PlayerProperties } from '../Configs/EntityProperty';
import { KeyBoundConfig, KeyBoundConfigs, OnlineInputState, KeyNames } from '../Configs/KeyBound';
import * as THREE from 'three';
import { updateControlVariable } from '../Utils/MoveUtils';
import { InputState } from '../Managers/InputManager';

export class Player extends Plane {
    public viewMode: ViewMode;
    public shakingFactor = 0.4;
    public isLocalPlayer: boolean; // Indicates if this player is controlled locally
    public playerId: number = -1; // Player ID in the game

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

        // If this is a local player, register input listener
        this.game.inputManager.registerPlayer(this);
    }

    public getInputState(): InputState {
        return this.inputState;
    }

    public getOnlineInputState(): OnlineInputState {
        const state: OnlineInputState = {} as OnlineInputState;
        KeyNames.forEach((keyName) => {
            state[keyName] = this.inputState.checkInput(this.keyConfig[keyName]);
        });
        return state;
    }

    public update(deltaTime: number, input?: OnlineInputState): void {
        // Handle input
        this.handleInput(deltaTime, input || this.getOnlineInputState());

        // Update camera shake based on lostSpeedNorm
        this.updateCameraShake();

        // Call the parent update
        super.update(deltaTime);
    }

    private handleInput(deltaTime: number, input: OnlineInputState): void {
        if (input.selectWeapon1) {
            this.selectWeapon(0);
        }

        if (input.selectWeapon2) {
            this.selectWeapon(1);
        }

        if (input.selectWeapon3) {
            this.selectWeapon(2);
        }

        if (input.selectWeapon4) {
            this.selectWeapon(3);
        }

        // Update control variables using the helper function
        const pulsionUpdate = updateControlVariable(
            this.pulsion,
            this.property.defaultPulsion,
            this.property.minPulsion,
            this.property.maxPulsion,
            this.property.pulsionSensitivity,
            input.increaseThrust,
            input.decreaseThrust,
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
            input.yawLeft,
            input.yawRight,
            deltaTime
        ).value;

        this.pitchSpeed = updateControlVariable(
            this.pitchSpeed,
            0,
            this.property.pitchMinSpeed,
            this.property.pitchMaxSpeed,
            this.property.pitchSensitivity,
            input.pitchUp,
            input.pitchDown,
            deltaTime
        ).value;

        this.rollSpeed = updateControlVariable(
            this.rollSpeed,
            0,
            this.property.rollMinSpeed,
            this.property.rollMaxSpeed,
            this.property.rollSensitivity,
            input.rollLeft,
            input.rollRight,
            deltaTime
        ).value;

        // Update animation states based on input
        this.setAnimationState('yawLeft', input.yawLeft && !input.yawRight);
        this.setAnimationState('yawRight', input.yawRight && !input.yawLeft);
        this.setAnimationState('pitchUp', input.pitchUp && !input.pitchDown);
        this.setAnimationState('pitchDown', input.pitchDown && !input.pitchUp);
        this.setAnimationState('rollLeft', input.rollLeft && !input.rollRight);
        this.setAnimationState('rollRight', input.rollRight && !input.rollLeft);
        this.setAnimationState('increaseThrust', input.increaseThrust && !input.decreaseThrust);
        this.setAnimationState('decreaseThrust', input.decreaseThrust && !input.increaseThrust);

        // Fire weapon
        if (input.fireWeapon) {
            this.fireWeapon();
        }

        // Toggle view mode
        if (input.toggleViewMode) {
            this.game.cameraManager.toggleViewMode(this);
        }

        // Re-target
        if (input.reTarget) {
            this.game.targetManager.reTarget(this, this.weapons[this.selectedWeaponIndex]);
        }
    }

    private updateCameraShake(): void {
        // Use lostSpeedNorm to calculate shake intensity
        const maxLostSpeedForShake = this.property.maxPulsion / (1 - this.property.zSpeedDecrease); // Or adjust as appropriate
        let intensity = Math.min(1, this.lostSpeedNorm / maxLostSpeedForShake);

        // Scale the intensity to control the shake effect
        intensity *= this.shakingFactor;

        // Set the shake intensity in the camera manager
        this.game.cameraManager.setShakeIntensity(this, intensity);
    }

    public dispose(): void {
        if (this.isLocalPlayer) {
            this.game.inputManager.unregisterPlayer(this);
            if (this.game.isGameOnline()) {
                this.game.socket?.send(JSON.stringify({ type: 'end' }));
            }
        }
        this.game.playerMap.delete(this.entityId);
        super.dispose();
    }

    public getTargetPlayers(): Player[] {
        return [this];
    }
}
