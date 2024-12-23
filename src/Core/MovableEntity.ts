// src/Core/MovableEntity.ts

import * as THREE from 'three';
import { Entity } from './Entity';
import { Game } from '../Game';
import { EntityName } from '../Configs/EntityPaths';
import { Weapon } from "./Weapon";

export class MovableEntity extends Entity {
    public velocity: THREE.Vector3;
    public weapons: Weapon[];
    public selectedWeaponIndex: number = 0;

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
        super(game, assetName, pos, qua, iFFNumber);
        this.velocity = velocity ? velocity : new THREE.Vector3();
        this.game.movableEntityMap.set(this.entityId, this);
        this.weapons = [];
    }

    public update(deltaTime: number): void {
        this.setPosition(this.getPosition().add(this.velocity.clone().multiplyScalar(deltaTime)));
        // Update weapons
        for (const weapon of this.weapons) {
            weapon.update(deltaTime);
        }

        super.update(deltaTime);
    }

    public dispose() {
        for (const weapon of this.weapons) {
            weapon.dispose();
        }
        this.game.movableEntityMap.delete(this.entityId);
        this.weapons = [];
        super.dispose();
    }

    get weapon(): Weapon{
        if (this.weapons.length <= this.selectedWeaponIndex) { throw Error(`Weapon with Index ${this.selectedWeaponIndex} does not exists on asset ${this.assetName}`); }
        return this.weapons[this.selectedWeaponIndex]
    }
}

