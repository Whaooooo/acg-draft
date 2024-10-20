// src/Entities/Enemy.ts

import { Game } from '../Game';
import * as THREE from 'three';
import { EntityName } from '../Configs/EntityPaths';
import {MovableEntity} from "../Core/MovableEntity";

export class NPC extends MovableEntity {
    constructor(game: Game,
                assetName: EntityName,
                pos?: THREE.Vector3,
                qua?: THREE.Quaternion,
                velocity?: THREE.Vector3,
                iFFNumber?: number,
                playerId: number = 0) {
        super(game, assetName, pos, qua, velocity, iFFNumber);
    }

    public update(deltaTime: number): void {
        if (!this.ready) return;

        // Implement enemy-specific update logic here

        super.update(deltaTime);
    }
}
