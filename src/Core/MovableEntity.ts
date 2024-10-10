// src/Core/MovableEntity.ts

import * as THREE from 'three';
import { Entity } from './Entity';
import { Game } from '../Game';
import { EntityName } from '../Enums/EntityPaths';
import { Weapon } from "./Weapon";

export class MovableEntity extends Entity {
    public velocity: THREE.Vector3;
    public acceleration: THREE.Vector3;

    public targets: Entity[];
    public weapons: Weapon[];

    constructor(
        game: Game,
        assetName: EntityName,
        pos?: THREE.Vector3,
        qua?: THREE.Quaternion,
        velocity?: THREE.Vector3,
        acceleration?: THREE.Vector3,
        iFFNumber?: number,
    ) {
        super(game, assetName, pos, qua, iFFNumber);
        this.velocity = velocity? velocity : new THREE.Vector3();
        this.acceleration = acceleration ? acceleration : new THREE.Vector3();
        //############################################### Need to implement weapons initialization
        this.targets = []
        this.weapons = []
    }

    public update(deltaTime: number): void {
        if (!this.ready || !this.entity) return;

        // Update velocity based on acceleration
        this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));

        // Update position based on velocity
        this.entity.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    }
}

