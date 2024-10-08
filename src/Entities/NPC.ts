// src/Entities/Enemy.ts

import { Game } from '../Game';
import * as THREE from 'three';
import { EntityName } from '../Enums/EntityPaths';
import {MovableEntity} from "../Core/MovableEntity";

export class NPC extends MovableEntity {
    constructor(
        game: Game,
        assetName: EntityName,
        pos?: THREE.Vector3,
        qua?: THREE.Quaternion,
        iFFNumber?: number,
    ) {
        super(game, assetName, pos, qua, iFFNumber);
    }

    public update(deltaTime: number): void {
        if (!this.ready) return;

        // Implement enemy-specific update logic here

        super.update(deltaTime);
    }
}
