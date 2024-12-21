// src/Managers/TargetManager.ts

import { Entity } from '../Core/Entity';
import { Game } from '../Game';
import { Weapon } from '../Core/Weapon';
import * as THREE from 'three';
import { MovableEntity } from '../Core/MovableEntity';
import { Missile } from "../Entities/Missile";

export class TargetManager {
    public game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    /**
     * Re-evaluates potential targets for the given entity and weapon.
     * @param entity The MovableEntity performing the targeting.
     * @param weapon The weapon being used to target.
     * @returns An updated list of potential targets.
     */
    public reTarget(entity: MovableEntity, weapon: Weapon): Entity[] {
        const entityPosition = entity.getPosition();
        const entityForward = entity.getForwardDirection(true);

        const lockRange = weapon.property.lockRange;
        const lockAngle = weapon.property.lockAngle; // degrees

        let closestOrientationTarget: Entity | null = null;
        let closestOrientationAngle = Infinity;

        let inLockRangeTargets: { target: Entity; distance: number }[] = [];
        const otherTargets: { target: Entity; distance: number }[] = [];

        for (const target of this.game.entityMap.values()) {
            if (target === entity) continue;
            if (target.removed) continue;

            const targetPosition = target.getPosition();
            const toTarget = targetPosition.clone().sub(entityPosition);
            const distance = toTarget.length();

            // Compute angle to the target
            const directionToTarget = toTarget.clone().normalize();
            const angle = THREE.MathUtils.radToDeg(entityForward.angleTo(directionToTarget));

            // If target has different iFFNumber (enemy)
            if (target.iFFNumber !== entity.iFFNumber && target.iFFNumber >= 0 && !(target instanceof Missile)) {
                // Check if it's the closest to orientation
                if (angle < closestOrientationAngle) {
                    closestOrientationAngle = angle;
                    closestOrientationTarget = target;
                }

                // Check if within lock range (angle and distance)
                if (distance <= lockRange && angle <= lockAngle) {
                    inLockRangeTargets.push({ target, distance });
                } else {
                    // If not within lock range, add to other targets
                    otherTargets.push({ target, distance });
                }
            }
        }

        // Remove closestOrientationTarget from inLockRangeTargets if present
        if (closestOrientationTarget) {
            inLockRangeTargets = inLockRangeTargets.filter(item => item.target !== closestOrientationTarget);
        }

        // Now build the potentialTargets list
        const potentialTargets: Entity[] = [];

        if (closestOrientationTarget) {
            potentialTargets.push(closestOrientationTarget);
        }

        // Sort inLockRangeTargets by distance
        inLockRangeTargets.sort((a, b) => a.distance - b.distance);

        // Add inLockRangeTargets to potentialTargets
        potentialTargets.push(...inLockRangeTargets.map(item => item.target));

        // Sort otherTargets by distance
        otherTargets.sort((a, b) => a.distance - b.distance);

        // Add otherTargets to potentialTargets
        potentialTargets.push(...otherTargets.map(item => item.target));

        // Update weapon's potentialTargets
        weapon.potentialTargets = potentialTargets;

        return potentialTargets;
    }

    /**
     * Rearranges the potential targets for the weapon, excluding the first target.
     * Removes any removed entities and sorts targets by priority.
     * @param weapon The weapon whose potential targets are being rearranged.
     */
    public rearrangeTargets(weapon: Weapon): void {
        const currentTargets = weapon.potentialTargets;
        const entity = weapon.owner;
        const entityPosition = entity.getPosition();
        const entityForward = entity.getForwardDirection();

        // Exclude the first target
        const firstTarget = currentTargets.length > 0 ? currentTargets[0] : null;

        // Remove any removed entities and the first target
        const remainingTargets = currentTargets.slice(1).filter(target => !target.removed);

        // Re-sort remainingTargets based on priority (distance and lock status)
        const sortedTargets = remainingTargets.map(target => {
            const targetPosition = target.getPosition();
            const toTarget = targetPosition.clone().sub(entityPosition);
            const distance = toTarget.length();

            // Compute angle to the target
            const directionToTarget = toTarget.clone().normalize();
            const angle = THREE.MathUtils.radToDeg(entityForward.angleTo(directionToTarget));

            // Determine if within lock range
            const inLockRange = distance <= weapon.property.lockRange && angle <= weapon.property.lockAngle;

            // Assign priority
            const priority = inLockRange ? distance : distance + 1000000; // Large number to deprioritize out-of-range targets

            return { target, priority };
        }).sort((a, b) => a.priority - b.priority);

        // Update weapon's potentialTargets
        weapon.potentialTargets = [];
        if (firstTarget && !firstTarget.removed) {
            weapon.potentialTargets.push(firstTarget);
        }

        weapon.potentialTargets.push(...sortedTargets.map(item => item.target));
    }

    /**
     * 获取锁定在指定实体上的所有导弹
     * @param entity 需要获取被锁定导弹的实体
     * @returns 导弹数组
     */
    public getLockedMissileList(entity: Entity): Missile[] {
        const missiles: Missile[] = [];
        for (const missile of this.game.projectileMap.values()) {
            if (missile.target === entity) {
                missiles.push(missile);
            }
        }
        return missiles;
    }

    /**
     * 获取指定位置和距离内的所有单位
     * @param position 指定位置
     * @param distance 指定距离
     * @returns 符合条件的实体数组
     */
    public getEntitiesWithinDistance(position: THREE.Vector3, distance: number): Entity[] {
        const entitiesWithinDistance: Entity[] = [];
        for (const target of this.game.entityMap.values()) {
            if (target.removed) continue;
            if (target.getPosition().distanceTo(position) <= distance) {
                entitiesWithinDistance.push(target);
            }
        }
        return entitiesWithinDistance;
    }

    /**
     * 获取指定位置和距离内的所有友方单位
     * @param position 指定位置
     * @param distance 指定距离
     * @param iFFNumber 当前实体的友军标识号
     * @returns 符合条件的友方实体数组
     */
    public getFriendlyEntitiesWithinDistance(position: THREE.Vector3, distance: number, iFFNumber: number): Entity[] {
        const friendlyEntities: Entity[] = [];
        for (const target of this.game.entityMap.values()) {
            if (target.removed) continue;
            if (target.iFFNumber !== iFFNumber) continue;
            if (target.getPosition().distanceTo(position) <= distance) {
                friendlyEntities.push(target);
            }
        }
        return friendlyEntities;
    }

    /**
     * 获取距离指定实体最近的有效目标
     * @param entity 需要查找最近目标的实体
     * @returns 最近的目标实体，若无则返回 null
     */
    public getClosedTarget(entity: Entity): Entity | null {
        let closestTarget: Entity | null = null;
        let minDistanceSq = Infinity;

        const entityPosition = entity.getPosition();

        for (const target of this.game.entityMap.values()) {
            if (target === entity) continue; // 排除自身
            if (target.removed) continue; // 排除已移除的实体
            if (target.iFFNumber === entity.iFFNumber) continue; // 排除同阵营的实体
            if (target.iFFNumber < 0) continue; // 排除无效的 iFFNumber
            if (target instanceof Missile) continue; // 排除导弹

            const targetPosition = target.getPosition();
            const distanceSq = entityPosition.distanceToSquared(targetPosition);

            if (distanceSq < minDistanceSq) {
                minDistanceSq = distanceSq;
                closestTarget = target;
            }
        }

        return closestTarget;
    }
}
