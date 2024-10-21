// src/Utils/MoveUtils.ts

import * as THREE from 'three';

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

    if (increase) {
        // Increase the value
        currentValue += sensitivity * deltaTime;
        if (currentValue > maxValue) currentValue = maxValue;
        increased = true;
    } else if (decrease) {
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
    xSpeedDecrease: number;
    ySpeedDecrease: number;
    zSpeedDecrease: number;
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
    const deltaOmega = omega.clone().multiplyScalar(deltaTime);

    const angle = deltaOmega.length();

    let newQuaternion = state.quaternion.clone();

    if (angle > 0.000001) {
        const axis = deltaOmega.normalize();
        const deltaQuat = new THREE.Quaternion().setFromAxisAngle(axis, angle);
        newQuaternion.multiply(deltaQuat);
    }

    // Decompose velocity into the plane's local coordinate system
    const inverseQuaternion = state.quaternion.clone().invert();
    const localVelocity = state.velocity.clone().applyQuaternion(inverseQuaternion);

    // Compute speed decrease factors over deltaTime
    const xDecreaseFactor = Math.pow(state.xSpeedDecrease, deltaTime);
    const yDecreaseFactor = Math.pow(state.ySpeedDecrease, deltaTime);
    const zDecreaseFactor = Math.pow(state.zSpeedDecrease, deltaTime);

    // Store local velocity before speed decrease
    const localVelocityBefore = localVelocity.clone();

    // Apply speed decrease
    localVelocity.x *= xDecreaseFactor;
    localVelocity.y *= yDecreaseFactor;
    localVelocity.z *= zDecreaseFactor;

    // Compute lost speed in local coordinates
    const lostLocalSpeed = localVelocityBefore.clone().sub(localVelocity);

    // Apply acceleration due to pulsion along the forward axis (-Z)
    // Assuming pulsion is acceleration in m/s²
    const deltaV = -state.pulsion * deltaTime; // Negative because forward is -Z
    localVelocity.z += deltaV;

    // Convert local velocity back to world coordinates using the new quaternion
    const newVelocity = localVelocity.applyQuaternion(newQuaternion);

    // Convert lostLocalSpeed to world coordinates
    const lostSpeed = lostLocalSpeed.applyQuaternion(newQuaternion);

    // Return the updated quaternion, velocity, and lost speed
    return {
        quaternion: newQuaternion,
        velocity: newVelocity,
        lostSpeed: lostSpeed,
    };
}
