// src/Utils/MoveUtils.ts

import * as THREE from 'three';
import { MovableEntity } from "../Core/MovableEntity";
import {PlaneProperty} from "../Configs/EntityProperty";

/**
 * Helper function to update control variables like pulsion and rotational speeds.
 * @param currentValue - The current value of the control variable.
 * @param defaultValue - The default value to return to when no input is given.
 * @param minValue - The minimum allowed value.
 * @param maxValue - The maximum allowed value.
 * @param sensitivity - The rate at which the value changes.
 * @param increase - Whether the increase key is pressed.
 * @param decrease - Whether the decrease key is pressed.
 * @param deltaTime - The time elapsed since the last update.
 * @returns The updated control variable value and whether it was increased or decreased.
 */
export function updateControlVariable(
    currentValue: number,
    defaultValue: number,
    minValue: number,
    maxValue: number,
    sensitivity: number,
    increase: boolean,
    decrease: boolean,
    deltaTime: number
): { value: number; increased: boolean; decreased: boolean } {
    let increased = false;
    let decreased = false;

    if (increase && !decrease) {
        // Increase the value
        currentValue += sensitivity * deltaTime;
        if (currentValue > maxValue) currentValue = maxValue;
        increased = true;
    } else if (decrease && !increase) {
        // Decrease the value
        currentValue -= sensitivity * deltaTime;
        if (currentValue < minValue) currentValue = minValue;
        decreased = true;
    } else {
        // Gradually return to default value
        if (currentValue > defaultValue) {
            currentValue -= sensitivity * deltaTime;
            if (currentValue < defaultValue) currentValue = defaultValue;
            decreased = true;
        } else if (currentValue < defaultValue) {
            currentValue += sensitivity * deltaTime;
            if (currentValue > defaultValue) currentValue = defaultValue;
            increased = true;
        }
    }
    return { value: currentValue, increased, decreased };
}

export interface PlaneState {
    quaternion: THREE.Quaternion;
    velocity: THREE.Vector3;
    yawSpeed: number;   // Degrees per second
    pitchSpeed: number; // Degrees per second
    rollSpeed: number;  // Degrees per second
    pulsion: number;    // Acceleration in m/s²
    property: PlaneProperty;
}

/**
 * Updates the plane's quaternion and velocity based on the provided state and deltaTime.
 * @param state - The current state of the plane.
 * @param deltaTime - The time elapsed since the last update.
 * @returns The updated quaternion, velocity, and lost speed due to speed decreases.
 */
export function updatePlaneState(
    state: PlaneState,
    deltaTime: number
): { quaternion: THREE.Quaternion; velocity: THREE.Vector3; lostSpeed: THREE.Vector3 } {
    // Convert rotational speeds from degrees per second to radians per second
    const rollRate = THREE.MathUtils.degToRad(state.rollSpeed);   // Roll around local Z-axis
    const pitchRate = THREE.MathUtils.degToRad(state.pitchSpeed); // Pitch around local X-axis
    const yawRate = THREE.MathUtils.degToRad(state.yawSpeed);     // Yaw around local Y-axis

    // Angular velocity vector in the plane's local coordinate system
    const omega = new THREE.Vector3(pitchRate, yawRate, rollRate);

    // Total rotation over deltaTime
    const deltaOmega = omega.clone().multiplyScalar(deltaTime / (1 + state.velocity.length() / (state.property.maxPulsion / (1 - state.property.zSpeedDecrease))));

    const angle = deltaOmega.length();

    let newQuaternion = state.quaternion.clone();

    if (angle > 0.000001) {
        const axis = deltaOmega.normalize();
        const deltaQuat = new THREE.Quaternion().setFromAxisAngle(axis, angle);
        newQuaternion.multiply(deltaQuat);
    }

    // 1. 计算飞机的角速度
    // 计算飞机的前方方向（-Z 轴）在世界坐标系中的方向
    const planeForward = new THREE.Vector3(0, 0, -1).applyQuaternion(state.quaternion).normalize();
    const worldY = new THREE.Vector3(0, 1, 0).normalize();

    // 计算飞机前方与世界 Y 轴的夹角（以度为单位）
    const angleRad = planeForward.angleTo(worldY);
    const angleDeg = THREE.MathUtils.radToDeg(angleRad);

    const angularVelocityDeg = - state.property.pitchMinSpeed * (0.25 - angleDeg / 720 - 0.125 * state.pulsion / state.property.defaultPulsion);
    const angularVelocityRad = THREE.MathUtils.degToRad(angularVelocityDeg); // 转换为弧度

    // 创建一个绕世界 Y 轴的旋转四元数
    const deltaQuat = new THREE.Quaternion();
    deltaQuat.setFromAxisAngle(planeForward.clone().cross(new THREE.Vector3(0, -1, 0)), angularVelocityRad * deltaTime);

    // 更新四元数
    newQuaternion = deltaQuat.multiply(newQuaternion);

    // 2. 应用重力加速度（朝下，世界坐标系 Y 轴负方向）
    const gravity = new THREE.Vector3(0, -9.8 * deltaTime, 0);
    let newVelocity = state.velocity.clone().add(gravity);

    // 3. 将速度转换到飞机的本地坐标系
    const inverseQuaternion = newQuaternion.clone().invert();
    let localVelocity = newVelocity.clone().applyQuaternion(inverseQuaternion);

    // 4. 应用速度衰减
    localVelocity.x *= Math.pow(state.property.xSpeedDecrease, deltaTime);
    localVelocity.y *= Math.pow(state.property.ySpeedDecrease, deltaTime);
    localVelocity.z *= Math.pow(state.property.zSpeedDecrease, deltaTime);

    // 5. 应用脉冲加速度（沿本地 -Z 方向）
    localVelocity.z += -state.pulsion * deltaTime;


    const a_y = 9.8 * Math.max(0, Math.min(state.pulsion / state.property.defaultPulsion, 2));
    localVelocity.y += a_y * deltaTime;

    // 7. 将本地速度转换回世界坐标系
    newVelocity = localVelocity.applyQuaternion(newQuaternion);

    // 8. 计算因速度衰减而损失的速度
    const lostSpeed = state.velocity.clone().sub(newVelocity);

    // 9. 返回更新后的状态
    return {
        quaternion: newQuaternion,
        velocity: newVelocity,
        lostSpeed: lostSpeed
    };
}


/**
 * Applies velocity decay to the entity's velocity.
 * @param entity The MovableEntity (e.g., Missile)
 * @param deltaTime Time since the last update
 */
export function applyVelocityDecay(entity: MovableEntity, deltaTime: number): void {
    const property = (entity as any).property;
    if (!property) return;

    const inverseQuaternion = entity.getQuaternion().clone().invert();
    const localVelocity = entity.velocity.clone().applyQuaternion(inverseQuaternion);

    // Apply velocity decay in the x, y, and z axes
    const xDecayFactor = Math.pow(property.xSpeedDecrease, deltaTime);
    const yDecayFactor = Math.pow(property.ySpeedDecrease, deltaTime);
    const zDecayFactor = Math.pow(property.zSpeedDecrease, deltaTime);

    localVelocity.x *= xDecayFactor;
    localVelocity.y *= yDecayFactor;
    localVelocity.z *= zDecayFactor;

    entity.velocity.copy(localVelocity.applyQuaternion(entity.getQuaternion()));
}

/**
 * Applies thrust to the entity's velocity.
 * @param entity The MovableEntity (e.g., Missile)
 * @param deltaTime Time since the last update
 */
export function applyThrust(entity: MovableEntity, deltaTime: number): void {
    const property = (entity as any).property;
    if (!property) return;

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(entity.getQuaternion()).normalize();
    const thrust = forward.multiplyScalar(property.pulsion * deltaTime);
    entity.velocity.add(thrust);
}
