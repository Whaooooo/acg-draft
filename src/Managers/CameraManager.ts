// src/Managers/CameraManager.ts

import * as THREE from 'three';
import { Player } from '../Entities/Player';
import { ViewMode } from '../Enums/ViewMode';

export class CameraManager {
    public cameras: Map<Player, THREE.PerspectiveCamera>;
    public cameraControls: Map<Player, { rotation: THREE.Quaternion }> = new Map();

    constructor(players: Player[]) {
        this.cameras = new Map<Player, THREE.PerspectiveCamera>();

        players.forEach((player) => {
            const camera = new THREE.PerspectiveCamera(
                75,
                window.innerWidth / window.innerHeight,
                0.1,
                100000
            );

            // Initial position and orientation
            camera.position.copy(player.getPosition());
            camera.quaternion.copy(player.getQuaternion());

            // Store the camera associated with the player
            this.cameras.set(player, camera);

            // Initialize camera controls with identity quaternion
            this.cameraControls.set(player, { rotation: new THREE.Quaternion() });
        });

        window.addEventListener('resize', this.updateCameraAspectRatios.bind(this), false);
    }

    public updateCameraAspectRatios(): void {
        this.cameras.forEach((camera) => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        });
    }

    public updateCameras(): void {
        this.cameras.forEach((camera, player) => {
            const inputManager = player.game.inputManager;
            const { deltaX, deltaY } = inputManager.getMouseMovement();
            const sensitivity = 0.002;

            const controls = this.cameraControls.get(player);
            if (!controls) return;

            // Calculate rotation deltas based on mouse movement
            const deltaYaw = -deltaX * sensitivity;
            const deltaPitch = -deltaY * sensitivity;

            // Create quaternions for the incremental rotations
            const quatYaw = new THREE.Quaternion();
            const quatPitch = new THREE.Quaternion();

            // Yaw rotation around the world's up axis (Y-axis)
            quatYaw.setFromAxisAngle(new THREE.Vector3(0, 1, 0), deltaYaw);

            // Pitch rotation around the camera's right axis (local X-axis)
            const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(controls.rotation);
            quatPitch.setFromAxisAngle(cameraRight, deltaPitch);

            // Update the camera's rotation quaternion
            controls.rotation.premultiply(quatYaw).premultiply(quatPitch).normalize();

            const playerPosition = player.getPosition();
            const playerQuaternion = player.getQuaternion();

            if (player.viewMode === ViewMode.FirstPerson) {
                // First-person view

                // Camera follows player's position
                camera.position.copy(playerPosition);

                // Combine player's rotation with camera's relative rotation
                camera.quaternion.copy(playerQuaternion).multiply(controls.rotation);

            } else {
                // Third-person view

                const offsetDistance = 40; // Distance from the player
                const offsetVector = new THREE.Vector3(0, 0, offsetDistance);

                // Apply the camera's rotation to the offset vector
                offsetVector.applyQuaternion(controls.rotation);

                // Rotate the offset vector by the player's orientation
                offsetVector.applyQuaternion(playerQuaternion);

                // Set the camera position
                camera.position.copy(playerPosition).add(offsetVector);

                // Camera looks at the player
                camera.lookAt(playerPosition);
            }
        });
    }
}
