// src/Core/Weapon.ts

import { EntityName } from '../Configs/EntityPaths';
import { MissileProperty, NPCProperties, PlayerProperties } from '../Configs/EntityProperty';
import { Player } from '../Entities/Player';
import { Game } from '../Game';
import { Missile } from '../Entities/Missile';
import { SoundEnum } from '../Configs/SoundPaths';
import { soundPropertyToOption } from '../Configs/SoundProperty';
import * as THREE from 'three';
import { MovableEntity } from './MovableEntity';
import {Entity} from "./Entity";

export class Weapon {
    public name: string;
    public parentPlaneName: EntityName;
    public property: MissileProperty;
    public game: Game;
    public owner: MovableEntity;

    // Weapon state
    public cooldownTimer: number = 0;
    public loadTimers: number[] = [];
    public missilesLoaded: number = 0;
    public totalMissilesFired: number = 0;
    public lastSoundPlayTime: number = 0;

    // Target lists
    public potentialTargets: Entity[] = [];
    public lockedOnTargets: Entity[] = [];

    constructor(game: Game, owner: MovableEntity, parentPlaneName: EntityName, weaponName: string) {
        this.game = game;
        this.owner = owner;
        this.name = weaponName;
        this.parentPlaneName = parentPlaneName;

        // Construct the EntityName for the weapon, e.g., 'f22_stdm'
        const weaponEntityName = `${parentPlaneName}_${weaponName}` as EntityName;

        // Retrieve the weapon properties from PlayerProperties or NPCProperties
        const weaponProperty = (this.owner instanceof Player
            ? PlayerProperties[weaponEntityName]
            : NPCProperties[weaponEntityName]) as MissileProperty;

        if (!weaponProperty) {
            console.error(`Weapon properties not found for ${weaponEntityName}`);
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

        this.lastSoundPlayTime -= deltaTime;

        // Target management
        const targetManager = this.game.targetManager;

        // If first target is removed or there is no first target, retarget
        if (this.potentialTargets.length === 0 || this.potentialTargets[0].removed) {
            targetManager.reTarget(this.owner, this);
        } else {
            // Rearrange potentialTargets (excluding the first target)
            targetManager.rearrangeTargets(this);
        }

        // Determine number of targets to lock on
        const maxLockTargets = Math.min(
            this.missilesLoaded,
            this.property.lockNumber
        );

        // Select targets to lock on
        this.lockedOnTargets = [];

        // Start from the first target and select up to maxLockTargets
        for (const target of this.potentialTargets) {
            if (this.lockedOnTargets.length >= maxLockTargets) break;

            if (target.removed) continue;

            // Check if target is within lock range
            const entityPosition = this.owner.getPosition();
            const targetPosition = target.getPosition();
            const toTarget = targetPosition.clone().sub(entityPosition);
            const distance = toTarget.length();

            const entityForward = this.owner.getForwardDirection();
            const directionToTarget = toTarget.clone().normalize();
            const angle = THREE.MathUtils.radToDeg(entityForward.angleTo(directionToTarget));

            if (distance <= this.property.lockRange && angle <= this.property.lockAngle) {
                this.lockedOnTargets.push(target);
            }
        }
    }

    public fire(): void {
        if (this.missilesLoaded <= 0) {
            console.warn('No missiles loaded.');
            return;
        }

        // Determine number of missiles to fire
        const missilesToFire = Math.min(
            this.missilesLoaded,
            this.lockedOnTargets.length,
            this.property.lockNumber
        );

        if (missilesToFire <= 0) {
            console.warn('No locked-on targets to fire at.');
            return;
        }

        // Fire missiles
        let missilesFired = 0;

        for (let slotIndex = 0; slotIndex < this.loadTimers.length; slotIndex++) {
            if (missilesFired >= missilesToFire) {
                break;
            }

            if (this.loadTimers[slotIndex] <= 0) {
                const target = this.lockedOnTargets[missilesFired];

                // Calculate firing position in world coordinates
                const firePosArray = this.property.firePosition[slotIndex];
                const firePositionLocal = new THREE.Vector3(...firePosArray);
                const firePositionWorld = firePositionLocal
                    .clone()
                    .applyQuaternion(this.owner.getQuaternion()).add(this.owner.getPosition());

                // Create missile
                const missile = new Missile(
                    this.game,
                    this.owner,
                    this.property,
                    `${this.parentPlaneName}_${this.name}` as EntityName,
                    firePositionWorld.clone(),
                    this.owner.getQuaternion(),
                    (this.owner instanceof MovableEntity) ? this.owner.velocity.clone() : undefined,
                    this.owner.iFFNumber,
                    target
                );

                // Update weapon state
                this.missilesLoaded--;
                this.totalMissilesFired++;
                missilesFired++;

                // Start load timer for this firing slot
                this.loadTimers[slotIndex] = this.property.loadTime;

                if (this.lastSoundPlayTime <= 0) {
                    // Play weapon fire sound with positional audio
                    const soundManager = this.game.soundManager;
                    if (soundManager && this.property.sound && this.property.sound.speech && this.owner instanceof Player) {
                        soundManager.playSound(
                            this.owner, // The player who owns the weapon
                            this.property.sound.speech.name as SoundEnum,
                            soundPropertyToOption(this.property.sound.speech, missile, { position: this.owner.getPosition() }),
                            [this.owner]
                        );
                        this.lastSoundPlayTime = this.property.sound.speech.cooldown;
                    }
                }

                // Check if all missiles are fired
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

    public dispose(): void {

    }
}
