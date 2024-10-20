// src/Core/Weapon.ts

import { EntityName, getEntityName } from '../Configs/EntityPaths';
import { MissileProperty, PlayerProperties } from '../Configs/EntityProperty';
import { Player } from '../Entities/Player';
import { Game } from '../Game';
import { Missile } from '../Entities/Missile';
import * as THREE from 'three';

export class Weapon {
    public name: string;
    public parentPlaneName: EntityName;
    public property: MissileProperty;
    private game: Game;
    private owner: Player;

    // Weapon state
    private cooldownTimer: number = 0;
    private loadTimers: number[] = [];
    private missilesLoaded: number = 0;
    private totalMissilesFired: number = 0;
    public lastSoundPlayTime: number = 0;

    constructor(game: Game, owner: Player, parentPlaneName: EntityName, weaponName: string) {
        this.game = game;
        this.owner = owner;
        this.name = weaponName;
        this.parentPlaneName = parentPlaneName;

        // Construct the EntityName for the weapon, e.g., 'f22_stdm'
        const weaponEntityName = `${parentPlaneName}_${weaponName}` as EntityName;

        // Retrieve the weapon properties from PlayerProperties
        const weaponProperty = PlayerProperties[weaponEntityName] as MissileProperty;

        if (!weaponProperty) {
            console.error(`Weapon properties not found for ${weaponEntityName}`);
            // Handle the error as needed
            // For now, throw an error
            throw new Error(`Weapon properties not found for ${weaponEntityName}`);
        }

        this.property = weaponProperty;

        // Initialize load timers
        this.loadTimers = Array(this.property.loadNumber).fill(0);
        this.missilesLoaded = this.property.loadNumber;
    }

    public update(deltaTime: number): void {
        // Update load timers
        for (let i = 0; i < this.loadTimers.length; i++) {
            if (this.loadTimers[i] > 0) {
                this.loadTimers[i] -= deltaTime;
                if (this.loadTimers[i] <= 0) {
                    this.missilesLoaded++;
                    this.loadTimers[i] = 0;
                }
            }
        }

        // Ensure missilesLoaded does not exceed loadNumber or totalNumber
        this.missilesLoaded = Math.min(
            this.missilesLoaded,
            this.property.loadNumber,
            this.property.totalNumber - this.totalMissilesFired
        );
    }

    public fire(): void {
        if (this.missilesLoaded <= 0) {
            console.warn('No missiles loaded.');
            return;
        }

        // Determine number of missiles to fire
        const missilesToFire = Math.min(
            this.missilesLoaded,
            this.owner.targets.length,
            this.property.lockNumber
        );

        if (missilesToFire <= 0) {
            console.warn('No targets to fire at.');
            return;
        }

        // Play weapon fire sound if applicable
        const soundProperty = this.property.sound['fire'];
        if (soundProperty) {
            const currentTime = this.game.getTime();
            if (
                !this.lastSoundPlayTime ||
                currentTime - this.lastSoundPlayTime >= soundProperty.cooldown
            ) {
                this.game.playSound(
                    this.owner,
                    soundProperty.name,
                    soundProperty.loop,
                    soundProperty.volume
                );
                this.lastSoundPlayTime = currentTime;
            }
        }

        // Fire missiles
        let missilesFired = 0;

        // Iterate over firing slots
        for (let slotIndex = 0; slotIndex < this.loadTimers.length; slotIndex++) {
            if (missilesFired >= missilesToFire) {
                break;
            }

            // Check if the firing slot is available (load timer is zero)
            if (this.loadTimers[slotIndex] <= 0) {
                const target = this.owner.targets[missilesFired];

                // Get fire position for this slot
                const firePosArray = this.property.firePosition[slotIndex];
                const firePosition = new THREE.Vector3(...firePosArray);
                firePosition.applyMatrix4(this.owner.entity.matrixWorld);

                // Calculate initial direction
                const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.owner.entity.quaternion);

                // Create missile
                const missile = new Missile(
                    this.game,
                    `${this.parentPlaneName}_${this.name}` as EntityName,
                    firePosition,
                    this.owner.entity.quaternion.clone(),
                    forward.clone().multiplyScalar(this.property.pulsion),
                    this.owner.iFFNumber,
                    target
                );

                // Add missile to the game
                this.game.projectiles.push(missile);

                // Update weapon state
                this.missilesLoaded--;
                this.totalMissilesFired++;
                missilesFired++;

                // Start load timer for this firing slot
                this.loadTimers[slotIndex] = this.property.loadTime;

                // Check if we have fired all available missiles
                if (this.totalMissilesFired >= this.property.totalNumber) {
                    console.warn('All missiles have been fired.');
                    break;
                }
            }
        }

        if (missilesFired < missilesToFire) {
            console.warn('Not enough available firing slots to fire all missiles.');
        }
    }


}
