import * as THREE from 'three';
import { MovableEntity } from '../Core/MovableEntity';
import { Entity } from '../Core/Entity';
import { Game } from '../Game';
import { EntityName } from '../Configs/EntityPaths';
import { MissileProperty, PlayerProperties } from '../Configs/EntityProperty';

export class Missile extends MovableEntity {
    public target: Entity | null;
    public property: MissileProperty;

    constructor(
        game: Game,
        entityId: number,
        assetName: EntityName,
        pos?: THREE.Vector3,
        qua?: THREE.Quaternion,
        velocity?: THREE.Vector3,
        iFFNumber?: number,
        target?: Entity
    ) {
        super(game, entityId, assetName, pos, qua, velocity, iFFNumber);
        this.target = target || null;

        // Retrieve the missile properties
        this.property = PlayerProperties[assetName] as MissileProperty;

        if (!this.property) {
            console.error(`Missile properties not found for ${assetName}`);
        }
    }

    public update(deltaTime: number): void {
        if (!this.ready || !this.entity) return;

        // Check if the missile should continue homing
        if (this.shouldContinueHoming()) {
            this.homeTowardsTarget(deltaTime);
        } else {
            // Target lost; missile flies straight forward
            this.target = null;
        }

        // Apply velocity decay based on x, y, z speed decreases
        this.applyVelocityDecay(deltaTime);

        // Apply thrust to the missile to maintain or increase velocity
        this.applyThrust(deltaTime);

        // Update the position using parent update method
        super.update(deltaTime);
    }

    private shouldContinueHoming(): boolean {
        if (!this.target || !this.target.entity || this.target.removed) {
            return false;
        }

        const targetPosition = this.target.entity.position.clone();
        const currentPosition = this.entity.position.clone();
        const toTarget = targetPosition.sub(currentPosition);
        const distanceToTarget = toTarget.length();

        // Check if the target is within lockRange
        if (distanceToTarget > this.property.lockRange) {
            return false;
        }

        // Check if the target is within lockAngle
        const currentDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(this.entity.quaternion).normalize();
        const directionToTarget = toTarget.clone().normalize();
        const angleToTarget = currentDirection.angleTo(directionToTarget) * (180 / Math.PI); // Convert to degrees

        if (angleToTarget > this.property.lockAngle) {
            return false;
        }

        // All checks passed; continue homing
        return true;
    }

    private homeTowardsTarget(deltaTime: number): void {
        const targetPosition = this.target!.entity.position.clone();
        const currentPosition = this.entity.position.clone();
        const toTarget = targetPosition.sub(currentPosition).normalize();

        // Calculate rotation towards the target using rotation speed
        const currentDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(this.entity.quaternion).normalize();
        const rotationAxis = new THREE.Vector3().crossVectors(currentDirection, toTarget).normalize();
        const angleToTarget = currentDirection.angleTo(toTarget);

        // Apply rotation based on the missile's rotation speed
        const maxRotation = THREE.MathUtils.degToRad(this.property.rotationSpeed * deltaTime);
        const rotationAngle = Math.min(angleToTarget, maxRotation); // Limit the rotation to the maximum rotation speed

        // Avoid NaN in case rotationAxis is zero vector
        if (!isNaN(rotationAxis.x) && !isNaN(rotationAxis.y) && !isNaN(rotationAxis.z)) {
            const rotationQuat = new THREE.Quaternion().setFromAxisAngle(rotationAxis, rotationAngle);
            this.entity.quaternion.premultiply(rotationQuat);
        }
    }

    private applyThrust(deltaTime: number): void {
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.entity.quaternion).normalize();
        const thrust = forward.multiplyScalar(this.property.pulsion * deltaTime);
        this.velocity.add(thrust);
    }

    private applyVelocityDecay(deltaTime: number): void {
        // Apply velocity decay in the x, y, and z axes
        const xDecayFactor = Math.pow(this.property.xSpeedDecrease, deltaTime);
        const yDecayFactor = Math.pow(this.property.ySpeedDecrease, deltaTime);
        const zDecayFactor = Math.pow(this.property.zSpeedDecrease, deltaTime);

        this.velocity.x *= xDecayFactor;
        this.velocity.y *= yDecayFactor;
        this.velocity.z *= zDecayFactor;
    }
}
