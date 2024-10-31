import { Game } from '../Game';
import * as THREE from 'three';
import { Missile } from '../Entities/Missile';
import { MovableEntity } from "../Core/MovableEntity";
import {Player} from "../Entities/Player";

export class CollisionManager {
    public game: Game;
    public bounds: number = 100000;

    constructor(game: Game) {
        this.game = game;
    }

    /**
     * Checks collision between two entities and applies damage if necessary.
     * @param entity1 First entity
     * @param entity2 Second entity
     */
    private checkCollision(entity1: MovableEntity, entity2: MovableEntity): void {
        if (entity1.iFFNumber === entity2.iFFNumber) return;

        if (!(entity1._model && entity2._model)) {return;}

        const box1 = new THREE.Box3().setFromObject(entity1._model);
        const box2 = new THREE.Box3().setFromObject(entity2._model);

        if (box1.intersectsBox(box2)) {
            entity1.currentHP -= entity2.collisionDamage;
            entity2.currentHP -= entity1.collisionDamage;

            [entity1, entity2].forEach(entity => {
                if (entity instanceof Player) {
                    const intensity = 2.0; // Adjust as needed
                    const duration = 0.3; // Short duration
                    const decayRate = 10; // Quick decay

                    this.game.cameraManager.addShake(entity, intensity, duration, decayRate);
                }
            });

            if (entity1.currentHP <= 0) entity1.dispose();
            if (entity2.currentHP <= 0) entity2.dispose();
        }
    }

    /**
     * Checks if a projectile is out of bounds.
     * @param entity MovableEntity entity
     * @returns boolean indicating if out of bounds
     */
    private isOutOfBounds(entity: MovableEntity): boolean {
        if (entity.removed) return true;
        if (!entity._model) return false;

        const position = entity.getPosition();

        return (
            Math.abs(position.x) > this.bounds ||
            Math.abs(position.y) > this.bounds ||
            Math.abs(position.z) > this.bounds
        );
    }

    /**
     * Updates all collisions and handles out-of-bounds detection.
     * @param deltaTime Time elapsed since last update
     */
    public update(deltaTime: number): void {
        // Update projectiles and check for out-of-bounds
        this.game.projectileMap.forEach((projectile) => {
            if (projectile.removed) return;

            projectile.update(deltaTime);

            if (this.isOutOfBounds(projectile)) {
                console.log('Missile out of bounds');
                projectile.dispose();
            }
        });

        // Perform pairwise collision checks among movable entities
        const entities = Array.from(this.game.movableEntityMap.values()).filter(entity => !entity.removed && entity.ready);

        for (let i = 0; i < entities.length; i++) {
            if (this.isOutOfBounds(entities[i])) {
                console.log(`Entity ${entities[i].entityId} is out of bounds`);
                entities[i].dispose();
                continue;
            }
            for (let j = i + 1; j < entities.length; j++) {
                this.checkCollision(entities[i], entities[j]);
            }
        }
    }
}
