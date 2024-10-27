// src/Core/MovableEntity.ts

import * as THREE from 'three';
import { Entity } from './Entity';
import { Game } from '../Game';
import { EntityName } from '../Configs/EntityPaths';
import { Weapon } from "./Weapon";

export class MovableEntity extends Entity {
    public velocity: THREE.Vector3;

    public weapons: Weapon[];

    public targets: Entity[];
    public currentHP: number = 1;
    public collisionDamage: number = 2000;

    constructor(
        game: Game,
        assetName: EntityName,
        pos?: THREE.Vector3,
        qua?: THREE.Quaternion,
        velocity?: THREE.Vector3,
        iFFNumber?: number,
    ) {
        super(game, assetName, pos, qua);
        this.velocity = velocity ? velocity : new THREE.Vector3();
        //############################################### Need to implement weapons initialization
        this.game.movableEntityMap.set(this.entityId, this);
        this.targets = []
        this.weapons = []
    }

    public update(deltaTime: number): void {
        this.setPosition(this.getPosition().add(this.velocity.clone().multiplyScalar(deltaTime)));

        super.update(deltaTime)
    }

    public dispose() {
        for (const weapon of this.weapons) {
            weapon.dispose();
        }
        this.weapons = [];
        super.dispose();
    }
}

