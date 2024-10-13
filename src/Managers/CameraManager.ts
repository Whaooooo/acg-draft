// src/Managers/CameraManager.ts

import * as THREE from 'three';
import { Player } from '../Entities/Player';
import { ViewMode } from "../Enums/ViewMode";

export class CameraManager {
    public cameras: Map<Player, THREE.PerspectiveCamera>;
    public cameraControls: Map<Player, { yaw: number; pitch: number }> = new Map();

    constructor(players: Player[]) {
        this.cameras = new Map<Player, THREE.PerspectiveCamera>();

        players.forEach((player) => {
            const camera = new THREE.PerspectiveCamera(
                50,
                window.innerWidth / window.innerHeight,
                0.001,
                100
            );

            // Initial position and orientation
            camera.position.copy(player.getPosition());
            camera.quaternion.copy(player.getQuaternion());

            // Store the camera associated with the player
            this.cameras.set(player, camera);

            // Initialize camera controls
            this.cameraControls.set(player, { yaw: 0, pitch: 0 });
        });
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

            // Update yaw and pitch based on mouse movement
            controls.yaw -= deltaX * sensitivity;
            controls.pitch -= deltaY * sensitivity;

            // Clamp pitch to prevent flipping over
            const pitchLimit = Math.PI / 2 - 0.1;
            controls.pitch = Math.max(-pitchLimit, Math.min(pitchLimit, controls.pitch));

            if (player.viewMode === ViewMode.FirstPerson) {
                // First-person view

                // Update camera orientation
                const euler = new THREE.Euler(controls.pitch, controls.yaw, 0, 'YXZ');
                camera.quaternion.setFromEuler(euler);

                // Camera follows player's position
                camera.position.copy(player.getPosition());
            } else {
                // Third-person view

                const radius = 5; // Distance from the player

                // Calculate camera position in spherical coordinates
                const offsetX = radius * Math.cos(controls.pitch) * Math.sin(controls.yaw);
                const offsetY = radius * Math.sin(controls.pitch);
                const offsetZ = radius * Math.cos(controls.pitch) * Math.cos(controls.yaw);

                const offset = new THREE.Vector3(offsetX, offsetY, offsetZ);

                // Camera position is player position plus offset
                camera.position.copy(player.getPosition()).add(offset);

                // Camera looks at the player
                camera.lookAt(player.getPosition());
            }
        });
    }
}
