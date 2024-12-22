// src/Entities/Missile.ts

import * as THREE from 'three';
import { MovableEntity } from '../Core/MovableEntity';
import { Entity } from '../Core/Entity';
import { Game } from '../Game';
import { EntityName } from '../Configs/EntityPaths';
import { MissileProperty, PlayerProperties } from '../Configs/EntityProperty';
import { SoundEnum } from "../Configs/SoundPaths";
import { Player } from "./Player";
import { applyVelocityDecay, applyThrust } from "../Utils/MoveUtils";
import { soundPropertyToOption } from "../Configs/SoundProperty";
import { Explosion } from "./Explosion";
import {WakeCloud, wakeCloudPropertyToWakeCloud} from "./WakeCloud";

export class Missile extends MovableEntity {
    public target: Entity | null;
    public property: MissileProperty;
    private owner: Entity;
    private missileSoundId: string | null = null; // Store the sound ID

    // 新增属性
    private targetLost: boolean = false; // 标记是否失去目标
    private timeSinceTargetLost: number = 0; // 记录自失去目标以来的时间
    private readonly TIME_BEFORE_DESTROY: number = 2.0; // 2秒后销毁

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
            // 如果之前标记为失去目标，重置相关状态
            if (this.targetLost) {
                this.targetLost = false;
                this.timeSinceTargetLost = 0;
            }
        } else {
            if (!this.targetLost) {
                // 第一次检测到目标丢失，标记并开始计时
                this.targetLost = true;
                this.timeSinceTargetLost = 0;
            }

            if (this.targetLost) {
                // 累加时间
                this.timeSinceTargetLost += deltaTime;

                // 如果超过2秒，无声销毁导弹
                if (this.timeSinceTargetLost >= this.TIME_BEFORE_DESTROY) {
                    this.disposeSilently();
                    return; // 终止后续更新
                }
            }

            // Target lost; missile flies straight forward
            this.target = null;
        }

        // Update the position using parent update method
        const old_position = this.getPosition();
        super.update(deltaTime);
        const new_position = this.getPosition();
        this.property.wakeCloud.forEach(property => wakeCloudPropertyToWakeCloud(this, old_position, new_position, property));
    }

    private shouldContinueHoming(): boolean {
        if (!this.target || !this.target.model || this.target.removed) {
            return false;
        }

        const targetPosition = this.target.getPosition();
        const currentPosition = this.getPosition();
        const toTarget = targetPosition.clone().sub(currentPosition);
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
        const toTarget = targetPosition.clone().sub(currentPosition).normalize();

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

    // 修改后的 dispose 方法，添加参数控制是否播放爆炸声音
    public dispose(silent: boolean = false): void {
        // Remove missile from projectile map
        this.game.projectileMap.delete(this.entityId);

        if (!silent) {
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
        }

        // Stop and remove the missile sound
        if (this.missileSoundId) {
            this.game.soundManager.stopSoundById(this.missileSoundId);
            this.missileSoundId = null;
        }

        super.dispose();
    }

    // 新增无声销毁的方法
    private disposeSilently(): void {
        this.dispose(true);
    }
}
