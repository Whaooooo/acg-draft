// src/Managers/CollisionManager.ts

import { Game } from '../Game';
import * as THREE from 'three';
import { Entity } from "../Core/Entity";

export class CollisionManager {
    public game: Game;

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

    // In CollisionManager.ts
    public checkProjectileCollisions(): void {
        this.game.projectiles.forEach(projectile => {
            if (!projectile.entity) return;

            this.game.enemies.forEach(enemy => {
                if (this.checkCollision(projectile, enemy)) {
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

}
