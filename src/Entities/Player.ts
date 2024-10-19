// src/Entities/Player.ts

import { MovableEntity } from '../Core/MovableEntity';
import { Game } from '../Game';
import { Missile } from './Missile';
import { EntityName } from '../Configs/EntityPaths';
import { ViewMode } from '../Enums/ViewMode';
import { PlaneProperty, MissileProperty, PlayerProperties } from '../Configs/EntityProperty';
import * as THREE from 'three';
import { Weapon } from '../Core/Weapon';

export class Player extends MovableEntity {
    public playerId: number;
    public name: EntityName;
    public viewMode: ViewMode;

    public property: PlaneProperty;

    // New property: List of weapons
    public weapons: Weapon[];
    public selectedWeaponIndex: number = 0; // Index of the currently selected weapon


    constructor(
        game: Game,
        assetName: EntityName,
        pos?: THREE.Vector3,
        qua?: THREE.Quaternion,
        velocity?: THREE.Vector3,
        acceleration?: THREE.Vector3,
        iFFNumber?: number,
        playerId: number = 0
    ) {
        super(game, assetName, pos, qua, velocity, acceleration, iFFNumber);
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
        console.log(this.weapons)
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

        // Call the parent update to move the entity
        super.update(deltaTime);
    }

    private handleInput(deltaTime: number): void {
        if (!this.ready || !this.entity) return;
        const inputManager = this.game.inputManager;

        // Handle weapon selection (number keys 1-9)
        for (let i = 0; i < this.weapons.length && i < 9; i++) {
            if (inputManager.isKeyDown((i + 1).toString())) {
                this.selectedWeaponIndex = i;
                break;
            }
        }

        // Handle weapon switching with mouse wheel
        const wheelDelta = inputManager.getWheelDelta();
        if (wheelDelta !== 0) {
            this.selectedWeaponIndex =
                (this.selectedWeaponIndex + (wheelDelta > 0 ? 1 : -1) + this.weapons.length) %
                this.weapons.length;
        }

        // Movement speed
        const moveSpeed = 1.0;

        // Reset acceleration
        this.acceleration.set(0, 0, 0);

        const direction = new THREE.Vector3();

        // Forward and backward
        if (inputManager.isKeyPressed('w') || inputManager.isKeyPressed('arrowup')) {
            direction.z = -1;
        } else if (inputManager.isKeyPressed('s') || inputManager.isKeyPressed('arrowdown')) {
            direction.z = 1;
        }

        // Left and right
        if (inputManager.isKeyPressed('a') || inputManager.isKeyPressed('arrowleft')) {
            direction.x = -1;
        } else if (inputManager.isKeyPressed('d') || inputManager.isKeyPressed('arrowright')) {
            direction.x = 1;
        }

        // Normalize direction vector
        if (direction.length() > 0) {
            direction.normalize();

            // Movement in world coordinates (no rotation applied)
            // Set acceleration
            this.acceleration.copy(direction.multiplyScalar(moveSpeed));
        }

        // Fire weapon
        if (inputManager.isKeyDown('f')) {
            this.fireWeapon();
        }

        // Toggle view mode
        if (inputManager.isKeyDown('v')) {
            this.toggleViewMode();
        }
    }

    public toggleViewMode(): void {
        this.viewMode =
            this.viewMode === ViewMode.FirstPerson
                ? ViewMode.ThirdPerson
                : ViewMode.FirstPerson;

        // Reset camera controls when view mode changes
        const cameraManager = this.game.cameraManager;
        const controls = cameraManager.cameraControls.get(this);
        if (controls) {
            if (this.viewMode === ViewMode.FirstPerson) {
                controls.yaw = 0;
                controls.pitch = 0;
            } else {
                controls.yaw = 0;
                controls.pitch = Math.PI / 6; // Default angle for third-person
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
        weapon.fire()

        // Rest of the fireWeapon function can be implemented later
    }
}
