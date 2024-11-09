import { Game } from '../Game';
import * as THREE from 'three';
import { Missile } from '../Entities/Missile';
import { MovableEntity } from "../Core/MovableEntity";
import { Player } from "../Entities/Player";

export class CollisionManager {
    public game: Game;
    public bounds: number = 100000;
    public intensity = 0.15; // Adjust as needed
    public duration = 0.5; // Short duration
    public decayRate = 0.05; // Quick decay

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

        if (!(entity1._model && entity2._model)) { return; }

        const box1 = new THREE.Box3().setFromObject(entity1._model);
        const box2 = new THREE.Box3().setFromObject(entity2._model);

        if (box1.intersectsBox(box2)) {
            entity1.currentHP -= entity2.collisionDamage;
            entity2.currentHP -= entity1.collisionDamage;

            [entity1, entity2].forEach(entity => {
                if (entity instanceof Player) {
                    this.game.cameraManager.addShake(entity, this.intensity, this.duration, this.decayRate);
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
     * Checks if any corner of the entity's bounding box is under the terrain.
     * @param entity MovableEntity entity
     * @returns boolean indicating if any corner is under terrain
     */
    private isUnderTerrain(entity: MovableEntity): boolean {
        if (!entity._model) return false;

        // Ensure the model's world matrices are up to date
        entity._model.updateMatrixWorld(true);

        // Compute the bounding box in world coordinates
        const bbox = new THREE.Box3().setFromObject(entity._model);

        const min = bbox.min;
        const max = bbox.max;

        // Get the 8 corners of the bounding box
        const corners = [
            new THREE.Vector3(min.x, min.y, min.z),
            new THREE.Vector3(min.x, min.y, max.z),
            new THREE.Vector3(min.x, max.y, min.z),
            new THREE.Vector3(min.x, max.y, max.z),
            new THREE.Vector3(max.x, min.y, min.z),
            new THREE.Vector3(max.x, min.y, max.z),
            new THREE.Vector3(max.x, max.y, min.z),
            new THREE.Vector3(max.x, max.y, max.z),
        ];

        // Check if any corner is under the terrain
        for (const corner of corners) {
            const x = corner.x;
            const y = corner.y;
            const z = corner.z;
            const terrainHeight = Math.max(this.game.sceneManager.mountain?.getHeight(x, z) ?? 0, 0);
            if (y < terrainHeight) {
                return true; // The corner is under the terrain
            }
        }
        return false;
    }

    /**
     * Updates all collisions and handles out-of-bounds detection.
     * @param deltaTime Time elapsed since last update
     */
    public update(deltaTime: number): void {
        // Perform pairwise collision checks among movable entities
        const entities = Array.from(this.game.movableEntityMap.values()).filter(entity => !entity.removed && entity.ready);

        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            if (!entity.ready || entity.removed) {
                continue;
            }
            if (this.isOutOfBounds(entity)) {
                console.log(`Entity ${entity.entityId} is out of bounds`);
                entity.dispose();
                continue;
            }
            if (this.isUnderTerrain(entity)) {
                console.log(`Entity ${entity.entityId} is under terrain`);
                entity.dispose();
                continue;
            }
            for (let j = i + 1; j < entities.length; j++) {
                this.checkCollision(entities[i], entities[j]);
            }
        }
    }
}
