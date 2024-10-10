// src/Entities/Projectile.ts

import * as THREE from 'three';
import { MovableEntity } from '../Core/MovableEntity';
import { Entity } from '../Core/Entity';
import { Game } from '../Game';
import { EntityName } from '../Enums/EntityPaths';

export class Projectile extends MovableEntity {
    public target: Entity | null;

    constructor(
        game: Game,
        assetName: EntityName,
        pos?: THREE.Vector3,
        qua?: THREE.Quaternion,
        velocity?: THREE.Vector3,
        acceleration?: THREE.Vector3,
        iFFNumber?: number,
        target?: Entity
    ) {
        super(game, assetName, pos, qua, velocity, acceleration, iFFNumber);
        this.target = target || null;
    }

    public update(deltaTime: number): void {
        if (!this.ready || !this.entity) return;
        // Force homing
        if (this.target && this.target.entity) {
            const targetPosition = this.target.entity.position.clone();
            const currentPosition = this.entity.position.clone();
            const direction = targetPosition.sub(currentPosition).normalize();

            const speed = this.velocity.length(); // Maintain current speed
            this.velocity = direction.multiplyScalar(speed);
        }

        // Call the parent update to move the projectile
        super.update(deltaTime);
    }
}
