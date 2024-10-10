// src/Managers/CollisionManager.ts

import { Game } from '../Game';
import * as THREE from 'three';
import { Entity } from "../Core/Entity";
import { Projectile } from '../Entities/Projectile';

export class CollisionManager {
    public game: Game;
    public bounds: number = 1000;

    constructor(game: Game) {
        this.game = game;
    }

    public checkCollisions(): void {
        // Check collisions between player and enemies and map
    }

    private checkCollision(entity1: Entity, entity2: Entity): boolean {
        if (!entity1.entity || !entity2.entity) return false;

        const box1 = new THREE.Box3().setFromObject(entity1.entity);
        const box2 = new THREE.Box3().setFromObject(entity2.entity);

        return box1.intersectsBox(box2);
    }

    private checkCollisionAndIFFNumber(entity1: Entity, entity2: Entity): boolean {
        if (!entity1.entity || !entity2.entity) return false;

        const box1 = new THREE.Box3().setFromObject(entity1.entity);
        const box2 = new THREE.Box3().setFromObject(entity2.entity);

        return box1.intersectsBox(box2) && entity1.iFFNumber !== entity2.iFFNumber;
    }


    // In CollisionManager.ts
    public checkProjectileCollisions(): void {
        this.game.projectiles.forEach(projectile => {
            if (!projectile.entity) return;

            this.game.npcs.forEach(npc => {
                if (this.checkCollisionAndIFFNumber(projectile, npc)) {
                    // Handle collision (e.g., apply damage, remove projectile)
                    console.log('Projectile hit enemy');
                    // Remove projectile
                    const index = this.game.projectiles.indexOf(projectile);
                    if (index > -1) {
                        this.game.projectiles.splice(index, 1);
                        projectile.removeFromScene();
                    }
                }
            });
        });
    }

    public isProjectileOutOfBounds(projectile: Projectile): boolean {
        if (projectile.removed) return true;
        if (!projectile.entity) return false;

        const position = projectile.entity.position;

        return (
            Math.abs(position.x) > this.bounds ||
            Math.abs(position.y) > this.bounds ||
            Math.abs(position.z) > this.bounds
        );
    }
}
