// src/Entities/Player.ts

import { MovableEntity } from '../Core/MovableEntity';
import { Game } from '../Game';
import { Projectile } from './Projectile';
import { EntityName } from '../Configs/EntityPaths';
import { ViewMode } from '../Enums/ViewMode';
import * as THREE from 'three';

export class Player extends MovableEntity {
    public playerId: number;
    public cooldown: boolean;
    public name: EntityName;
    public viewMode: ViewMode;

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
        this.cooldown = true;
        this.name = assetName;
        this.viewMode = ViewMode.ThirdPerson;
    }

    public update(deltaTime: number): void {
        if (!this.ready || !this._entity) return;

        // Handle input
        this.handleInput(deltaTime);

        this.targets = this.game.targetManager.getLockList(this);

        // Call the parent update to move the entity
        super.update(deltaTime);
    }

    private handleInput(deltaTime: number): void {
        if (!this.ready || !this._entity) return;
        const inputManager = this.game.inputManager;

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
        if (inputManager.isKeyPressed('f') && this.cooldown) {
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
        if (!this.ready || !this._entity) return;

        // Play firing sound
        this.game.playSound(this, 'fox2');

        let forward = new THREE.Vector3(0, 0, -1);

        // Use camera's direction for firing in both views
        const camera = this.game.cameraManager.cameras.get(this);
        if (camera) {
            forward.applyQuaternion(camera.quaternion);
        }

        // Create and add projectile to the game
        const projectile = new Projectile(
            this.game,
            this.name,
            this._entity.position.clone(),
            new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(0, 0, -1),
                forward.clone().normalize()
            ),
            forward.multiplyScalar(100).clone(),
            undefined,
            this.iFFNumber,
            this.targets[0] // No specific target
        );

        this.game.projectiles.push(projectile);
    }
}
