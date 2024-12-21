// src/Entities/Missile.ts

import * as THREE from 'three';
import { MovableEntity } from '../Core/MovableEntity';
import { Entity } from '../Core/Entity';
import { Game } from '../Game';
import { EntityName } from '../Configs/EntityPaths';
import { MissileProperty, PlayerProperties } from '../Configs/EntityProperty';
import {SoundEnum} from "../Configs/SoundPaths";
import {Player} from "./Player";
import { applyVelocityDecay, applyThrust } from "../Utils/MoveUtils";
import {soundPropertyToOption} from "../Configs/SoundProperty";
import {Explosion} from "./Explosion";

export class Missile extends MovableEntity {
    public target: Entity | null;
    public property: MissileProperty;
    private owner: Entity;
    private missileSoundId: string | null = null; // Store the sound ID

    constructor(
        game: Game,
        owner: Entity,
        property: MissileProperty,
        assetName: EntityName,
        pos?: THREE.Vector3,
        qua?: THREE.Quaternion,
        velocity?: THREE.Vector3,
        iFFNumber?: number,
        target?: Entity,
    ) {
        super(game, assetName, pos, qua, velocity, iFFNumber);
        this.owner = owner;
        this.target = target || null;

        // Retrieve the missile properties
        this.property = property;

        if (!this.property) {
            console.error(`Missile properties not found for ${assetName}`);
        }

        this.collisionDamage = this.property.damage;

        this.initializeSound();

        // Add missile to the game
        this.game.projectileMap.set(this.entityId, this);
    }

    public update(deltaTime: number): void {
        // Apply velocity decay and thrust using functions from MoveUtils
        applyVelocityDecay(this, deltaTime);
        applyThrust(this, deltaTime);

        // Update the sound's position
        this.updateSound();

        // Check if the missile should continue homing
        if (this.shouldContinueHoming()) {
            this.homeTowardsTarget(deltaTime);
        } else {
            // Target lost; missile flies straight forward
            this.target = null;
        }

        // Update the position using parent update method
        super.update(deltaTime);
    }

    private shouldContinueHoming(): boolean {
        if (!this.target || !this.target.model || this.target.removed) {
            return false;
        }

        const targetPosition = this.target.getPosition();
        const currentPosition = this.getPosition();
        const toTarget = targetPosition.sub(currentPosition);
        const distanceToTarget = toTarget.length();

        // Check if the target is within lockRange
        if (distanceToTarget > this.property.lockRange) {
            return false;
        }

        // Check if the target is within lockAngle
        const currentDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(this.getQuaternion()).normalize();
        const directionToTarget = toTarget.clone().normalize();
        const angleToTarget = currentDirection.angleTo(directionToTarget) * (180 / Math.PI); // Convert to degrees

        if (angleToTarget > this.property.lockAngle) {
            return false;
        }

        // All checks passed; continue homing
        return true;
    }

    private homeTowardsTarget(deltaTime: number): void {
        const targetPosition = this.target!.getPosition();
        const currentPosition = this.getPosition();
        const toTarget = targetPosition.sub(currentPosition).normalize();

        // Calculate rotation towards the target using rotation speed
        const currentDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(this.getQuaternion()).normalize();
        const rotationAxis = new THREE.Vector3().crossVectors(currentDirection, toTarget).normalize();
        const angleToTarget = currentDirection.angleTo(toTarget);

        // Apply rotation based on the missile's rotation speed
        const maxRotation = THREE.MathUtils.degToRad(this.property.rotationSpeed * deltaTime);
        const rotationAngle = Math.min(angleToTarget, maxRotation); // Limit the rotation to the maximum rotation speed

        // Avoid NaN in case rotationAxis is zero vector
        if (!isNaN(rotationAxis.x) && !isNaN(rotationAxis.y) && !isNaN(rotationAxis.z)) {
            const rotationQuat = new THREE.Quaternion().setFromAxisAngle(rotationAxis, rotationAngle);
            this.setQuaternion(this.getQuaternion().premultiply(rotationQuat));
        }
    }

    public initializeSound(): void {
        const soundManager = this.game.soundManager;
        if (soundManager && this.property.sound && this.property.sound.fire) {
            const fireSound = this.property.sound.fire;
            const options = soundPropertyToOption(fireSound, this);

            // Play the sound
            soundManager.playSound(
                this,
                fireSound.name as SoundEnum,
                options
            );

            this.missileSoundId = options.soundId;
        }
    }

    private updateSound(): void {
        if (this.missileSoundId) {
            const sound = this.game.soundManager.getSoundById(this.missileSoundId);
            if (sound instanceof THREE.PositionalAudio) {
                sound.position.copy(this.getPosition());
            }
        }
    }

    public getOwnerPlayer(): Player[] {
        return this.owner.getOwnerPlayer();
    }

    public dispose(): void {
        // Remove missile from projectile map
        this.game.projectileMap.delete(this.entityId);

        const explosionSoundProperty = this.property.sound?.explosion;
        if (explosionSoundProperty) {
            const options = soundPropertyToOption(explosionSoundProperty, this);

            // Play the sound and store the sound ID if needed
            this.game.soundManager.playSound(
                this,
                explosionSoundProperty.name as SoundEnum,
                options,
            );
        }

        new Explosion(this.game, this.getPosition(), this.getQuaternion(), 20, 1.5, 0.05);

        // Stop and remove the missile sound
        if (this.missileSoundId) {
            this.game.soundManager.stopSoundById(this.missileSoundId);
            this.missileSoundId = null;
        }

        super.dispose();
    }
}
