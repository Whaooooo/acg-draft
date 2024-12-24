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
import { WakeCloud, wakeCloudPropertyToWakeCloud } from "./WakeCloud";

export class Missile extends MovableEntity {
    public target: Entity | null;
    public property: MissileProperty;
    private owner: Entity;
    private missileSoundId: string | null = null; // Store the sound ID

    // ===== 新增：自我销毁计时 =====
    private lifeTimeLeft: number; // 导弹剩余寿命

    // ===== 新增：维护目标历史位置 =====
    private previousTargetPositions: THREE.Vector3[] = [];

    // 已存在属性
    private targetLost: boolean = false;        // 标记是否失去目标
    private timeSinceTargetLost: number = 0;    // 自失去目标以来的时间
    private readonly TIME_BEFORE_DESTROY: number = 2.0; // 失去目标后 2 秒销毁

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

        // ====== 初始化自我销毁寿命 ======
        this.lifeTimeLeft = this.property.lifeTime || 0;

        this.initializeSound();

        // Add missile to the game
        this.game.projectileMap.set(this.entityId, this);
    }

    public update(deltaTime: number): void {
        // 1. 更新导弹剩余寿命
        this.lifeTimeLeft -= deltaTime;
        if (this.lifeTimeLeft <= 0) {
            // 寿命耗尽，无声销毁
            this.disposeSilently();
            return;
        }

        // 2. 更新导弹物理运动（衰减 & 推进）
        applyVelocityDecay(this, deltaTime);
        applyThrust(this, deltaTime);

        // 3. 更新音效位置
        this.updateSound();

        // 4. 维护并使用之前 n 帧目标位置进行多项式预测
        //    如果可以继续锁定目标，则进行制导；否则进入失去目标逻辑。
        if (this.shouldContinueHoming()) {
            this.homeTowardsTarget(deltaTime);
            if (this.targetLost) {
                // 如果之前标记为失去目标，重置相关状态
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
                // 失去目标后，开始计时
                this.timeSinceTargetLost += deltaTime;

                // 如果超过 2 秒，则销毁
                if (this.timeSinceTargetLost >= this.TIME_BEFORE_DESTROY) {
                    this.disposeSilently();
                    return; // 终止后续更新
                }
            }

            // Target lost; missile flies straight forward
            this.target = null;
        }

        // 5. 使用父类的 update 来更新位置、旋转等
        const old_position = this.getPosition();
        super.update(deltaTime);
        const new_position = this.getPosition();

        // 6. 生成尾迹效果
        this.property.wakeCloud.forEach(property =>
            wakeCloudPropertyToWakeCloud(this, old_position, new_position, property)
        );
    }

    /**
     * 判断是否继续追踪目标
     */
    private shouldContinueHoming(): boolean {
        if (!this.target || this.target.removed) {
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
        const currentDirection = new THREE.Vector3(0, 0, -1)
            .applyQuaternion(this.getQuaternion())
            .normalize();
        const directionToTarget = toTarget.clone().normalize();
        const angleToTarget = currentDirection.angleTo(directionToTarget) * (180 / Math.PI); // Convert to degrees

        if (angleToTarget > this.property.lockAngle) {
            return false;
        }

        // 如果可以正常锁定，则将目标位置加入“历史位置”队列
        this.updatePreviousTargetPositions(this.target.getPosition());

        return true;
    }

    /**
     * 将目标位置加入数组，仅保存最近 n 帧
     */
    private updatePreviousTargetPositions(pos: THREE.Vector3): void {
        const n = this.property.polyEstimate;
        if (n < 2) {
            // polyEstimate < 2 时，没有必要做插值预测
            this.previousTargetPositions = [];
            return;
        }

        // 添加当前帧位置
        this.previousTargetPositions.push(pos.clone());

        // 如果超过了 n 帧，则移除最早的一帧
        if (this.previousTargetPositions.length > n) {
            this.previousTargetPositions.shift();
        }
    }

    /**
     * 预测目标下一帧位置：
     * 如果历史帧数达到了 n，则使用 (n-1) 次拉格朗日插值；
     * 否则直接返回目标当前实际位置。
     */
    private estimateNextTargetPosition(): THREE.Vector3 {
        const n = this.property.polyEstimate;
        // 历史不足 n 帧，无法做 (n-1) 次多项式插值，直接返回目标当前位置
        if (this.previousTargetPositions.length < n) {
            return this.target!.getPosition();
        }

        // ----------------------------
        // (n-1) 次多项式的拉格朗日插值示例：
        // 已知 positions[0..n-1] 对应 t=0..n-1，
        // 预测 t=n 时的插值结果。
        // ----------------------------
        const positions = this.previousTargetPositions;
        const result = new THREE.Vector3(0, 0, 0);
        const tNext = n; // 要估计的下一个时刻（第 n+1 帧），索引为 n

        for (let i = 0; i < n; i++) {
            // 计算拉格朗日基函数 L_i(tNext)
            let Li = 1;
            for (let j = 0; j < n; j++) {
                if (j !== i) {
                    Li *= (tNext - j) / (i - j);
                }
            }
            // 累加到结果
            result.x += positions[i].x * Li;
            result.y += positions[i].y * Li;
            result.z += positions[i].z * Li;
        }

        return result;
    }

    /**
     * 导弹向目标飞行的逻辑
     */
    private homeTowardsTarget(deltaTime: number): void {
        // 使用插值预测的目标位置
        const predictedPosition = this.estimateNextTargetPosition();

        const currentPosition = this.getPosition();
        const toTarget = predictedPosition.clone().sub(currentPosition).normalize();

        // Calculate rotation towards the target using rotation speed
        const currentDirection = new THREE.Vector3(0, 0, -1)
            .applyQuaternion(this.getQuaternion())
            .normalize();
        const rotationAxis = new THREE.Vector3().crossVectors(currentDirection, toTarget).normalize();
        const angleToTarget = currentDirection.angleTo(toTarget);

        // Apply rotation based on the missile's rotation speed
        const maxRotation = THREE.MathUtils.degToRad(this.property.rotationSpeed * deltaTime);
        const rotationAngle = Math.min(angleToTarget, maxRotation); // 限制最大旋转角

        // 避免 rotationAxis 是零向量导致 NaN
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

            // 产生爆炸效果
            new Explosion(this.game, this.getPosition(), this.getQuaternion(), 20, 1.5, 0.05);
        }

        // 停止导弹声音
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
