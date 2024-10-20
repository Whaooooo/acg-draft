// src/Entities/Player.ts

import { MovableEntity } from '../Core/MovableEntity';
import { Game } from '../Game';
import { Missile } from './Missile';
import { EntityName } from '../Configs/EntityPaths';
import { ViewMode } from '../Enums/ViewMode';
import { PlaneProperty, PlayerProperties } from '../Configs/EntityProperty';
import * as THREE from 'three';
import { Weapon } from '../Core/Weapon';
import { KeyBoundConfig, KeyBoundConfigs } from '../Configs/KeyBound';
import { updateControlVariable } from '../Utils/MoveUtils'; // Import the function
import { PlaneState, updatePlaneState} from "../Utils/MoveUtils";

export class Player extends MovableEntity {
    public playerId: number;
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

    constructor(
        game: Game,
        assetName: EntityName,
        pos?: THREE.Vector3,
        qua?: THREE.Quaternion,
        velocity?: THREE.Vector3,
        iFFNumber?: number,
        playerId: number = 0,
        keyConfigIndex: number = 0 // Index of the key mapping configuration
    ) {
        super(game, assetName, pos, qua, velocity, iFFNumber);
        this.playerId = playerId;
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

        // Call the parent update to move the entity
        super.update(deltaTime);
    }

    private handleInput(deltaTime: number): void {
        if (!this.ready || !this.entity) return;
        const inputManager = this.game.inputManager;

        // ... (other code remains the same)

        // Update control variables using the helper function
        this.pulsion = updateControlVariable(
            this.pulsion,
            this.property.defaultPulsion,
            this.property.minPulsion,
            this.property.maxPulsion,
            this.property.pulsionSensitivity,
            inputManager.isKeyPressed(this.keyConfig.increaseThrust),
            inputManager.isKeyPressed(this.keyConfig.decreaseThrust),
            deltaTime
        );

        this.yawSpeed = updateControlVariable(
            this.yawSpeed,
            0,
            this.property.yawMinSpeed,   // Use the new minSpeed property
            this.property.yawMaxSpeed,
            this.property.yawSensitivity,
            inputManager.isKeyPressed(this.keyConfig.yawLeft),
            inputManager.isKeyPressed(this.keyConfig.yawRight),
            deltaTime
        );

        this.pitchSpeed = updateControlVariable(
            this.pitchSpeed,
            0,
            this.property.pitchMinSpeed, // Use the new minSpeed property
            this.property.pitchMaxSpeed,
            this.property.pitchSensitivity,
            inputManager.isKeyPressed(this.keyConfig.pitchUp),
            inputManager.isKeyPressed(this.keyConfig.pitchDown),
            deltaTime
        );

        this.rollSpeed = updateControlVariable(
            this.rollSpeed,
            0,
            this.property.rollMinSpeed,  // Use the new minSpeed property
            this.property.rollMaxSpeed,
            this.property.rollSensitivity,
            inputManager.isKeyPressed(this.keyConfig.rollLeft),
            inputManager.isKeyPressed(this.keyConfig.rollRight),
            deltaTime
        );

        if (inputManager.isKeyDown(this.keyConfig.fireWeapon)) {
            this.fireWeapon();
        }

        if (inputManager.isKeyDown(this.keyConfig.toggleViewMode)) {
            this.toggleViewMode();
        }

        if (inputManager.isKeyDown(this.keyConfig.reTarget)) {
            this.targets = this.game.targetManager.reTarget(this);
        }
    }

    public toggleViewMode(): void {
        this.viewMode =
            this.viewMode === ViewMode.FirstPerson
                ? ViewMode.ThirdPerson
                : ViewMode.FirstPerson;

        const cameraManager = this.game.cameraManager;
        const controls = cameraManager.cameraControls.get(this);
        const camera = cameraManager.cameras.get(this);

        if (controls && camera) {
            if (this.viewMode === ViewMode.FirstPerson) {
                // 第一人称视角
                controls.rotation.identity();
                camera.position.copy(this.getPosition());

                camera.quaternion.copy(this.getQuaternion()).multiply(controls.rotation);
            } else {
                // 第三人称视角
                const defaultPitch = THREE.MathUtils.degToRad(-30);
                const euler = new THREE.Euler(defaultPitch, 0, 0, 'YXZ');
                controls.rotation.setFromEuler(euler);

                camera.quaternion.copy(this.getQuaternion()).multiply(controls.rotation);

                const offset = new THREE.Vector3(0, 5, 40);
                offset.applyQuaternion(camera.quaternion);
                camera.position.copy(this.getPosition()).add(offset);

                camera.lookAt(this.getPosition());
            }
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
}
