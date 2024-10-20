// src/Entities/Missile.ts

import * as THREE from 'three';
import { MovableEntity } from '../Core/MovableEntity';
import { Entity } from '../Core/Entity';
import { Game } from '../Game';
import { EntityName } from '../Configs/EntityPaths';

export class Missile extends MovableEntity {
    public target: Entity | null;

    constructor(
        game: Game,
        assetName: EntityName,
        pos?: THREE.Vector3,
        qua?: THREE.Quaternion,
        velocity?: THREE.Vector3,
        iFFNumber?: number,
        target?: Entity
    ) {
        super(game, assetName, pos, qua, velocity, iFFNumber);
        this.target = target || null;
    }

    public update(deltaTime: number): void {
        if (!this.ready || !this._entity) return;
        // Force homing
        if (this.target && this.target._entity) {
            const targetPosition = this.target._entity.position.clone();
            const currentPosition = this._entity.position.clone();
            const direction = targetPosition.sub(currentPosition).normalize();

            const speed = this.velocity.length(); // Maintain current speed
            this.velocity = direction.multiplyScalar(speed);
        }

        // Call the parent update to move the projectile
        super.update(deltaTime);
    }
}
