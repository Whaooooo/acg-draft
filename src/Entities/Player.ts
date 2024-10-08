// src/Entities/Player.ts

import { MovableEntity } from '../Core/MovableEntity';
import { Game } from '../Game';
import { Projectile } from "./Projectile";
import { EntityName } from '../Enums/EntityPaths';
import * as THREE from 'three';

export class Player extends MovableEntity {

    constructor(game: Game, assetName: EntityName, pos?: THREE.Vector3, qua?: THREE.Quaternion, iFFNumber?: number) {
        super(game, assetName, pos, qua, iFFNumber);
        // Additional initialization if needed
    }

    public update(deltaTime: number): void {
        if (!this.ready || !this.entity) return;

        // Handle input
        this.handleInput(deltaTime);

        // Call the parent update to move the entity
        super.update(deltaTime);
    }

    private handleInput(deltaTime: number): void {
        if (!this.ready || !this.entity) return;
        const inputManager = this.game.inputManager;

        // Movement speed
        const moveSpeed = 0.1;

        // Reset acceleration
        this.acceleration.set(0, 0, 0);

        // Forward and backward
        if (inputManager.isKeyPressed('KeyW') || inputManager.isKeyPressed('ArrowUp')) {
            this.acceleration.z = -moveSpeed;
        } else if (inputManager.isKeyPressed('KeyS') || inputManager.isKeyPressed('ArrowDown')) {
            this.acceleration.z = moveSpeed;
        }

        // Left and right
        if (inputManager.isKeyPressed('KeyA') || inputManager.isKeyPressed('ArrowLeft')) {
            this.acceleration.x = -moveSpeed;
        } else if (inputManager.isKeyPressed('KeyD') || inputManager.isKeyPressed('ArrowRight')) {
            this.acceleration.x = moveSpeed;
        }

        // Fire weapon
        if (inputManager.isKeyPressed('Space')) {
            this.fireWeapon();
        }
    }

    public lockTarget(): void {

    }

    public fireWeapon(): void {
        if (!this.ready || !this.entity) return;
        // Implement firing logic
        // For example, create a new projectile

        // Check if weapon can fire (e.g., based on a cooldown)
        // ...

        // Play firing sound
        this.game.soundManager.playSound('missileLaunch');

        // Create and add projectile to the game
        const projectile = new Projectile(
            this.game,
            'f22_stdm',
            this.entity.position.clone(),
            this.entity.quaternion.clone(),
            this.iFFNumber,
            this.targets[0]// No specific target
        );

        // Set initial velocity
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.entity.quaternion);
        projectile.velocity.copy(forward.multiplyScalar(100)); // Adjust speed as necessary

        // Add to scene and game
        projectile.addToScene(this.game.scene);
        this.game.projectiles.push(projectile);
    }
}
