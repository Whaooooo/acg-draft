// src/Utils/NPCUtils.ts

import * as THREE from 'three';
import { NPCPlane } from '../Entities/NPCPlane';
import { Missile } from '../Entities/Missile'; // 假设有导弹类
import { NPCMode } from '../Enums/NPCMode';
import {Player} from "../Entities/Player";

/**
 * 配置参数，可以根据需要进行调整或外部传入
 */
const ALPHA = 1.0;           // 基础方向对齐权重
const GAMMA = 2.0;           // 地面惩罚权重
const SAFE_ALTITUDE = 100;   // 安全高度阈值
const MAIN_CHASE_DISTANCE = 2000; // 主追踪模式检测距离
const VICE_CHASE_DISTANCE = 2000; // 副追踪模式检测距离

/**
 * 计算NPC的最终目标方向
 * @param npcPlane 当前的NPCPlane实例
 * @returns 计算后的最终目标方向向量
 */
export function calculateFinalDesiredDirection(npcPlane: NPCPlane): THREE.Vector3 {
    // 1. 获取基础目标方向
    const baseDir = getBaseTargetDirection(npcPlane);

    // 2. 获取导弹列表
    const missiles = getLockedMissiles(npcPlane);

    // 3. 获取地面高度信息
    const currentPos = npcPlane.getPosition();
    const terrainHeight = Math.max(npcPlane.game.sceneManager.mountain?.getHeight(currentPos.x, currentPos.z) ?? 0, 0);
    const altitude = currentPos.y - terrainHeight;

    // 4. 应用地面惩罚
    const baseDirWithPenalty = applyGroundPenalty(baseDir, altitude);

    // 5. 构建 M 矩阵
    const M = buildMissileMatrix(missiles, npcPlane);

    // 6. 求解 lambda
    const lambda = solveLambda(M, baseDirWithPenalty);

    // 7. 计算最终方向
    const alphaOverTwo = ALPHA / 2;
    const d_scaled = baseDirWithPenalty.clone().multiplyScalar(alphaOverTwo);

    // Compute v = (M + lambda I)^-1 * (alpha/2 * d)
    const M_plus_lambda = addScaledIdentity(M, lambda);

    // 计算 (M + lambda I)^-1
    const M_inv = new THREE.Matrix3();
    const invertSuccess = M_inv.copy(M_plus_lambda).invert();
    if (!invertSuccess) {
        // 矩阵不可逆，返回基础方向
        return baseDirWithPenalty.clone().normalize();
    }

    // 计算 v = (M + lambda I)^-1 * (alpha/2 * d)
    const v = d_scaled.clone().applyMatrix3(M_inv);

    // Normalize the final direction
    const finalDir = v.clone().normalize();

    return finalDir;
}

/**
 * 获取基础目标方向，基于NPC的当前模式
 * @param npcPlane 当前的NPCPlane实例
 * @returns 基础目标方向向量
 */
function getBaseTargetDirection(npcPlane: NPCPlane): THREE.Vector3 {
    const currentForward = new THREE.Vector3(0, 0, -1).applyQuaternion(npcPlane.getQuaternion());

    if (npcPlane.npcMode === NPCMode.MainChaseTarget || npcPlane.npcMode === NPCMode.ViceChaseTarget) {
        if (npcPlane.npcMode === NPCMode.MainChaseTarget) {
            npcPlane.setTarget(npcPlane.game.targetManager.getClosedTarget(npcPlane));
        }
        const bestTarget = npcPlane.getTarget() ? npcPlane.getTarget() : npcPlane.game.targetManager.getClosedTarget(npcPlane);
        if (bestTarget) {
            const myPos = npcPlane.getPosition();
            const targetPos = bestTarget.getPosition();
            const dir = new THREE.Vector3().subVectors(targetPos, myPos);
            if (dir.lengthSq() > 1e-6) {
                return dir.normalize();
            }
        }
        // 如果没有目标或目标无效，退回到巡航模式
    }

    // 巡航模式下，或者找不到目标时：使用自身机头方向
    return currentForward.clone();
}

/**
 * 获取锁定在NPC上的导弹列表
 * @param npcPlane 当前的NPCPlane实例
 * @returns 导弹数组
 */
function getLockedMissiles(npcPlane: NPCPlane): Missile[] {
    return npcPlane.game.targetManager.getLockedMissileList(npcPlane);
}

/**
 * 应用地面惩罚，离地越近，越需要往上调整方向
 * @param direction 当前方向向量
 * @param altitude 当前高度与地面高度差
 * @returns 调整后的方向向量
 */
function applyGroundPenalty(direction: THREE.Vector3, altitude: number): THREE.Vector3 {
    if (altitude < SAFE_ALTITUDE) {
        const factor = 1 - altitude / SAFE_ALTITUDE; // 0到1
        const up = new THREE.Vector3(0, 1, 0).multiplyScalar(factor * GAMMA);
        direction.add(up);
    }
    return direction;
}

/**
 * 构建导弹惩罚矩阵 M = sum(beta_i * m_i * m_i^T)
 * @param missiles 当前锁定的导弹列表
 * @param npcPlane 当前的NPCPlane实例
 * @returns 矩阵 M
 */
function buildMissileMatrix(missiles: Missile[], npcPlane: NPCPlane): THREE.Matrix3 {
    const M = new THREE.Matrix3();
    M.set(0, 0, 0, 0, 0, 0, 0, 0, 0);

    for (const missile of missiles) {
        const missilePos = missile.getPosition();
        const npcPos = npcPlane.getPosition();
        const m_i = new THREE.Vector3().subVectors(missilePos, npcPos).normalize();

        const distance = missilePos.distanceTo(npcPos);
        const beta_i = 1000 / (distance + 1); // 距离越近，权重越大

        // 计算 m_i * m_i^T
        const miOuter = new THREE.Matrix3().set(
            m_i.x * m_i.x, m_i.x * m_i.y, m_i.x * m_i.z,
            m_i.y * m_i.x, m_i.y * m_i.y, m_i.y * m_i.z,
            m_i.z * m_i.x, m_i.z * m_i.y, m_i.z * m_i.z
        );

        // M += beta_i * m_i * m_i^T
        addMatrices(M, miOuter.multiplyScalar(beta_i));
    }

    return M;
}

/**
 * 手动实现 Matrix3 的加法
 * @param A 矩阵 A
 * @param B 矩阵 B
 * @returns 矩阵 A + B
 */
function addMatrices(A: THREE.Matrix3, B: THREE.Matrix3): void {
    const a = A.elements;
    const b = B.elements;
    for (let i = 0; i < 9; i++) {
        a[i] += b[i];
    }
}

/**
 * 将 Matrix3 加上 lambda * Identity 矩阵
 * @param M Matrix3
 * @param lambda 标量
 * @returns Matrix3 加上 lambda * I
 */
function addScaledIdentity(M: THREE.Matrix3, lambda: number): THREE.Matrix3 {
    const identity = new THREE.Matrix3().identity().multiplyScalar(lambda);
    addMatrices(M, identity);
    return M;
}

/**
 * 求解拉格朗日乘数 lambda，使得 ||(M + lambda I)^-1 d_final|| =1
 * @param M 导弹惩罚矩阵
 * @param d_final 基础方向加地面惩罚后的方向
 * @returns 拉格朗日乘数 lambda
 */
function solveLambda(M: THREE.Matrix3, d_final: THREE.Vector3): number {
    // 需要求解 ||(M + lambda I)^-1 d_final|| =1

    let lambdaMin = 0;
    let lambdaMax = 1000; // 根据需要调整
    const tolerance = 1e-6;
    let lambda = (lambdaMin + lambdaMax) / 2;

    for (let i = 0; i < 100; i++) { // 最大迭代次数
        // 构建 (M + lambda I)
        const M_plus_lambda = M.clone();
        M_plus_lambda.elements[0] += lambda;
        M_plus_lambda.elements[4] += lambda;
        M_plus_lambda.elements[8] += lambda;

        // 计算逆矩阵
        const M_inv = new THREE.Matrix3();
        const invertSuccess = M_inv.copy(M_plus_lambda).invert();
        if (!invertSuccess) {
            // 矩阵不可逆，增大 lambda
            lambdaMin = lambda;
            lambda = (lambdaMin + lambdaMax) / 2;
            continue;
        }

        // 计算 v = (M + lambda I)^-1 * (alpha/2 * d_final)
        const alphaOverTwo = ALPHA / 2;
        const d_scaled = d_final.clone().multiplyScalar(alphaOverTwo);
        const v = d_scaled.clone().applyMatrix3(M_inv);

        // 计算 ||v||
        const norm = v.length();

        if (Math.abs(norm - 1) < tolerance) {
            break;
        }

        if (norm > 1) {
            // 需要增大 lambda
            lambdaMin = lambda;
        } else {
            // 需要减小 lambda
            lambdaMax = lambda;
        }

        lambda = (lambdaMin + lambdaMax) / 2;
    }

    return lambda;
}

/**
 * 对最终方向进行对齐，通过调整pitch, yaw, roll速度
 * 根据飞机的运动模式和加速度限制，调整pitch, yaw, roll速度
 * @param npcPlane 当前的NPCPlane实例
 * @param targetDir 目标方向向量
 * @param deltaTime 时间增量
 */
export function alignToDirection(npcPlane: NPCPlane, targetDir: THREE.Vector3, deltaTime: number): void {
    // 将目标方向转换到飞机的本地坐标系
    const inverseQuaternion = npcPlane.getQuaternion().clone().invert();
    const targetDirLocal = targetDir.clone().applyQuaternion(inverseQuaternion).normalize();

    const desiredDir = targetDirLocal.clone().normalize();
    const eps = 1e-2

    if (desiredDir.x > eps) {
        npcPlane.yawSpeed = npcPlane.property.yawMinSpeed;
        npcPlane.rollSpeed = npcPlane.property.rollMinSpeed;
    } else if (desiredDir.x < -eps) {
        npcPlane.yawSpeed = npcPlane.property.yawMaxSpeed;
        npcPlane.rollSpeed = npcPlane.property.rollMaxSpeed;
    }

    if (desiredDir.y >= 0) {
        npcPlane.pitchSpeed = npcPlane.property.pitchMaxSpeed;
    } else if (desiredDir.y < 0) {
        npcPlane.pitchSpeed = npcPlane.property.pitchMinSpeed;
    }
}

/**
 * 更新NPC的模式（MainChaseTarget, ViceChaseTarget, Cruise）
 * @param npcPlane 当前的NPCPlane实例
 */
export function updateNPCMode(npcPlane: NPCPlane): void {
    const game = npcPlane.game;
    const position = npcPlane.getPosition();
    const iFFNumber = npcPlane.iFFNumber;

    // 如果已经在 MainChaseTarget 模式，永不退出
    if (npcPlane.npcMode === NPCMode.MainChaseTarget) {
        return;
    }

    // 检查是否有敌方单位或友军 Player 在 MAIN_CHASE_DISTANCE 内
    const nearbyEntities = game.targetManager.getEntitiesWithinDistance(position, MAIN_CHASE_DISTANCE);
    const hasEnemyOrPlayer = nearbyEntities.some(entity => {
        if (entity.iFFNumber !== iFFNumber && entity.iFFNumber >= 0) {
            return true; // 敌方单位（包括导弹）
        }
        if (entity instanceof Player) {
            return true; // 友军 Player 类
        }
        return false;
    });

    if (hasEnemyOrPlayer) {
        npcPlane.npcMode = NPCMode.MainChaseTarget;
        return;
    }

    // 检查是否有 MainChaseTarget 模式的友方 NPC 在 VICE_CHASE_DISTANCE 内
    const nearbyFriendlyNPCs = game.targetManager.getFriendlyEntitiesWithinDistance(position, VICE_CHASE_DISTANCE, iFFNumber).filter(entity => {
        if (entity instanceof NPCPlane) {
            return (entity.npcMode === NPCMode.MainChaseTarget);
        }
        return false;
    });

    if (nearbyFriendlyNPCs.length > 0) {
        // 复制第一个 MainChaseTarget 友方 NPC 的目标
        // @ts-ignore
        const targetToCopy = nearbyFriendlyNPCs[0].getTarget(); // 假设 NPCPlane 有 getTarget 方法
        if (targetToCopy) {
            npcPlane.setTarget(targetToCopy); // 假设 NPCPlane 有 setTarget 方法
            npcPlane.npcMode = NPCMode.ViceChaseTarget;
        }
        return;
    }

    // 如果没有满足条件的模式，则设置为 Cruise
    npcPlane.npcMode = NPCMode.Cruise;
    npcPlane.setTarget(null)
}
