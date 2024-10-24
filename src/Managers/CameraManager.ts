// src/Managers/CameraManager.ts

import * as THREE from 'three';
import { Player } from '../Entities/Player';
import { ViewMode } from '../Enums/ViewMode';

/**
 * Interface to store camera controls for each player.
 * It includes separate controls for first-person and third-person views.
 */
interface CameraControl {
    // First-Person Controls
    firstPersonYaw: number;   // Accumulated yaw angle (radians)
    firstPersonPitch: number; // Accumulated pitch angle (radians)

    // Third-Person Controls
    thirdPersonYaw: number;     // Accumulated yaw angle (radians)
    thirdPersonPitch: number;   // Accumulated pitch angle (radians)
    thirdPersonDistance: number; // Distance from the player
}

export class CameraManager {
    public cameras: Map<Player, THREE.PerspectiveCamera>;
    public cameraControls: Map<Player, CameraControl> = new Map();

    // Sensitivity settings
    private readonly sensitivity: number = 0.002;

    // Clamp angles to prevent extreme rotations
    private readonly maxPitch: number = THREE.MathUtils.degToRad(85);
    private readonly minPitch: number = THREE.MathUtils.degToRad(-85);

    constructor(players: Player[]) {
        this.cameras = new Map<Player, THREE.PerspectiveCamera>();
        console.log(`Total number of players: ${players.length}`);

        players.forEach((player) => {
            const camera = new THREE.PerspectiveCamera(
                75,
                window.innerWidth / window.innerHeight,
                0.1,
                100000
            );

            // Initialize camera controls
            const controls: CameraControl = {
                // First-Person Controls
                firstPersonYaw: 0,
                firstPersonPitch: 0,

                // Third-Person Controls
                thirdPersonYaw: 0,
                thirdPersonPitch: THREE.MathUtils.degToRad(-30), // Slight downward pitch
                thirdPersonDistance: 50, // Default distance as per your latest requirement
            };

            // Store the camera and controls associated with the player
            this.cameras.set(player, camera);
            this.cameraControls.set(player, controls);

            // Set the initial position and orientation
            this.updateCameraPositionAndOrientation(player);
        });

        window.addEventListener('resize', this.updateCameraAspectRatios.bind(this), false);
    }

    /**
     * Toggles the camera view mode between first-person and third-person.
     * @param player The player whose camera view is being toggled.
     */
    public toggleViewMode(player: Player): void {
        player.viewMode =
            player.viewMode === ViewMode.FirstPerson
                ? ViewMode.ThirdPerson
                : ViewMode.FirstPerson;

        const controls = this.cameraControls.get(player);
        const camera = this.cameras.get(player);

        if (controls && camera) {
            if (player.viewMode === ViewMode.FirstPerson) {
                // Switch to first-person view
                // Reset third-person controls
                controls.thirdPersonYaw = 0;
                controls.thirdPersonPitch = THREE.MathUtils.degToRad(-30); // Reset to default pitch
                controls.thirdPersonDistance = 50; // Reset to default distance

                // Reset accumulated first-person angles
                controls.firstPersonYaw = 0;
                controls.firstPersonPitch = 0;
            } else {
                // Switch to third-person view
                // Initialize relative position based on accumulated yaw and pitch
                controls.thirdPersonYaw = 0;
                controls.thirdPersonPitch = THREE.MathUtils.degToRad(-30); // Slight pitch down
                controls.thirdPersonDistance = 50; // Set third-person distance as per requirement

                // Reset accumulated first-person angles
                controls.firstPersonYaw = 0;
                controls.firstPersonPitch = 0;
            }

            this.updateCameraPositionAndOrientation(player);
        }
    }

    /**
     * Updates the aspect ratios of all cameras on window resize.
     */
    public updateCameraAspectRatios(): void {
        this.cameras.forEach((camera) => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        });
    }

    /**
     * Updates all cameras based on player movements and mouse input.
     */
    public updateCameras(deltaTime: number): void {
        this.cameras.forEach((camera, player) => {
            const inputManager = player.game.inputManager;
            const { deltaX, deltaY } = inputManager.getMouseMovement();

            const controls = this.cameraControls.get(player);
            if (!controls) return;

            // Handle First-Person View Mouse Rotation
            if (player.viewMode === ViewMode.FirstPerson && (deltaX !== 0 || deltaY !== 0)) {
                // Accumulate yaw and pitch based on mouse movement
                controls.firstPersonYaw -= deltaX * this.sensitivity;   // Yaw: left/right
                controls.firstPersonPitch -= deltaY * this.sensitivity; // Pitch: up/down

                // Clamp the pitch angle to prevent flipping
                controls.firstPersonPitch = THREE.MathUtils.clamp(
                    controls.firstPersonPitch,
                    this.minPitch,
                    this.maxPitch
                );
            }

            // Handle Third-Person View Mouse Rotation
            if (player.viewMode === ViewMode.ThirdPerson && (deltaX !== 0 || deltaY !== 0)) {
                // Accumulate yaw and pitch based on mouse movement
                controls.thirdPersonYaw -= deltaX * this.sensitivity;   // Yaw: left/right
                controls.thirdPersonPitch -= deltaY * this.sensitivity; // Pitch: up/down

                // Clamp the pitch angle to prevent flipping
                controls.thirdPersonPitch = THREE.MathUtils.clamp(
                    controls.thirdPersonPitch,
                    this.minPitch,
                    this.maxPitch
                );
            }

            // Always update camera position and orientation to stick to the player
            this.updateCameraPositionAndOrientation(player);
        });
    }

    /**
     * Updates the camera's position and orientation based on the player's current state
     * and the stored accumulated angles.
     * @param player The player whose camera is being updated.
     */
    private updateCameraPositionAndOrientation(player: Player): void {
        const camera = this.cameras.get(player);
        const controls = this.cameraControls.get(player);

        if (camera && controls) {
            const playerPosition = player.getPosition();
            const playerQuaternion = player.getQuaternion();

            if (player.viewMode === ViewMode.FirstPerson) {
                // First-person view: compute camera orientation based on accumulated yaw and pitch

                // Create quaternions for yaw and pitch
                const quatYaw = new THREE.Quaternion();
                quatYaw.setFromAxisAngle(new THREE.Vector3(0, 1, 0), controls.firstPersonYaw); // Yaw around Y-axis

                const quatPitch = new THREE.Quaternion();
                quatPitch.setFromAxisAngle(new THREE.Vector3(1, 0, 0), controls.firstPersonPitch); // Pitch around X-axis

                // Compute the camera's orientation
                const cameraOrientation = new THREE.Quaternion();
                cameraOrientation.copy(playerQuaternion).multiply(quatYaw).multiply(quatPitch);

                // Set camera position to player's position
                camera.position.copy(playerPosition);

                // Set camera orientation
                camera.quaternion.copy(cameraOrientation);
            } else {
                // Third-person view: compute camera position and orientation based on accumulated yaw and pitch

                // Step 1: Define the initial relative position in player's local coordinates
                const initialRelativePosition = new THREE.Vector3(0, 0, 50); // Positioned along negative Z-axis

                // Step 2: Create quaternions for pitch and yaw rotations
                const quatPitch = new THREE.Quaternion();
                quatPitch.setFromAxisAngle(new THREE.Vector3(1, 0, 0), controls.thirdPersonPitch); // Pitch around X-axis

                const quatYaw = new THREE.Quaternion();
                quatYaw.setFromAxisAngle(new THREE.Vector3(0, 1, 0), controls.thirdPersonYaw); // Yaw around Y-axis

                // Step 3: Apply pitch and yaw to the initial relative position
                const relativePosition = initialRelativePosition.clone().applyQuaternion(quatPitch).applyQuaternion(quatYaw);

                // Step 4: Rotate the relative position by the player's quaternion to align with player's orientation
                relativePosition.applyQuaternion(playerQuaternion);

                // Step 5: Compute the camera's world position
                camera.position.copy(playerPosition).add(relativePosition);

                // Step 6: Compute the camera's orientation to look at the player
                // Instead of using lookAt, set the camera's quaternion based on player's rotation and accumulated yaw and pitch
                // This ensures that the camera's up vector and screen axes align with the player's axes
                const cameraLookAt = new THREE.Vector3().subVectors(playerPosition, camera.position).normalize();
                const cameraUp = new THREE.Vector3(0, 1, 0).applyQuaternion(playerQuaternion);

                const cameraOrientation = new THREE.Matrix4();
                cameraOrientation.lookAt(camera.position, playerPosition, cameraUp);
                camera.quaternion.setFromRotationMatrix(cameraOrientation);

                // Ensure the camera's up vector is consistent
                camera.up.set(0, 1, 0);
            }
        }
    }
}
