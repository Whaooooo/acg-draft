// src/Core/MovableEntity.ts

import * as THREE from 'three';
import { Entity } from './Entity';
import { Game } from '../Game';
import { EntityName } from '../Configs/EntityPaths';
import { Weapon } from "./Weapon";

export class MovableEntity extends Entity {
    public velocity: THREE.Vector3;

    public targets: Entity[];
    public weapons: Weapon[];

    constructor(
        game: Game,
        assetName: EntityName,
        pos?: THREE.Vector3,
        qua?: THREE.Quaternion,
        velocity?: THREE.Vector3,
        iFFNumber?: number,
    ) {
        super(game, assetName, pos, qua, iFFNumber);
        this.velocity = velocity ? velocity : new THREE.Vector3();
        //############################################### Need to implement weapons initialization
        this.targets = []
        this.weapons = []
    }

    public update(deltaTime: number): void {
        if (!this.ready || !this._entity) return;

        // Update position based on velocity
        this._entity.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    }
}

