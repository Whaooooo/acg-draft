// src/Managers/CollisionManager.ts

import { Game } from '../Game';
import * as THREE from 'three';
import { Entity } from "../Core/Entity";
import { Missile } from '../Entities/Missile';
import {MovableEntity} from "../Core/MovableEntity";

export class CollisionManager {
    public game: Game;
    public bounds: number = 100000;

    // Cache to store bounding boxes for entities
    private entityBoundingBoxes: Map<Entity, THREE.Box3> = new Map();

    constructor(game: Game) {
        this.game = game;
    }

    /**
     * Initializes or updates the bounding box for a given entity.
     * @param entity The entity to update.
     */
    private updateBoundingBox(entity: Entity): void {
        if (!entity._model || !entity.ready || entity.removed) {
            // If the entity is removed or not ready, remove its bounding box from the cache
            if (this.entityBoundingBoxes.has(entity)) {
                this.entityBoundingBoxes.delete(entity);
            }
            return;
        }

        let box = this.entityBoundingBoxes.get(entity);
        if (!box) {
            // If bounding box doesn't exist, create and add it to the cache
            box = new THREE.Box3().setFromObject(entity._model, true);
            this.entityBoundingBoxes.set(entity, box);
        } else {
            // If bounding box exists, update its dimensions
            box.setFromObject(entity._model, true);
        }
    }

    /**
     * Checks collision between two entities and applies damage if necessary.
     * @param entity1 First entity
     * @param entity2 Second entity
     */
    private checkBoxCollisionAndIFFNumber(entity1: MovableEntity, entity2: MovableEntity): void {
        if (entity1.iFFNumber === entity2.iFFNumber) return; // Skip if same IFFNumber

        const box1 = this.entityBoundingBoxes.get(entity1);
        const box2 = this.entityBoundingBoxes.get(entity2);

        if (!box1 || !box2) return; // Bounding boxes must exist

        if (box1.intersectsBox(box2)) {
            entity1.currentHP -= entity2.collisionDamage;
            entity2.currentHP -= entity1.collisionDamage;

            // Dispose entities if HP drops to zero or below
            if (entity1.currentHP <= 0) {
                entity1.dispose();
                this.entityBoundingBoxes.delete(entity1);
            }
            if (entity2.currentHP <= 0) {
                entity2.dispose();
                this.entityBoundingBoxes.delete(entity2);
            }
        }
    }


    /**
     * Checks if a projectile is out of bounds.
     * @param projectile Missile entity
     * @returns boolean indicating if out of bounds
     */
    public isProjectileOutOfBounds(projectile: Missile): boolean {
        if (projectile.removed) return true;
        if (!projectile._model) return false;

        const position = projectile.getPosition();

        return (
            Math.abs(position.x) > this.bounds ||
            Math.abs(position.y) > this.bounds ||
            Math.abs(position.z) > this.bounds
        );
    }

    /**
     * Updates all collisions and handles projectiles.
     * @param deltaTime Time elapsed since last update
     */
    public update(deltaTime: number): void {
        // Update and handle projectiles
        this.game.projectileMap.forEach((projectile) => {
            if (projectile.removed) return;

            projectile.update(deltaTime);

            // Remove projectiles that are out of bounds
            if (this.isProjectileOutOfBounds(projectile)) {
                console.log('Missile out of bounds');
                projectile.dispose();
                this.entityBoundingBoxes.delete(projectile);
                return;
            }
        });

        // Update bounding boxes for all entities
        this.game.entityMap.forEach((entity) => {
            this.updateBoundingBox(entity);
        });

        // Convert entityMap to an array for pairwise collision checking
        const entities = Array.from(this.game.movableEntityMap.values()).filter(entity => !entity.removed && entity.ready);

        // Perform pairwise collision checks among entities
        for (let i = 0; i < entities.length; i++) {
            for (let j = i + 1; j < entities.length; j++) {
                const entity1 = entities[i];
                const entity2 = entities[j];
                this.checkBoxCollisionAndIFFNumber(entity1, entity2);
            }
        }
    }
}
