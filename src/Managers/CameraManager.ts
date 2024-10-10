// src/Managers/CameraManager.ts

import * as THREE from 'three';
import { Player } from '../Entities/Player';

export class CameraManager {
    public cameras: Map<Player, THREE.PerspectiveCamera>;

    constructor(players: Player[]) {
        this.cameras = new Map<Player, THREE.PerspectiveCamera>();

        players.forEach((player) => {
            const camera = new THREE.PerspectiveCamera(
                70,
                window.innerWidth / window.innerHeight,
                0.1,
                1000
            );
            camera.position.copy(player.getPosition());
            camera.position.z += 20;
            camera.position.y += 10;
            camera.lookAt(player.getPosition());

            // Attach the camera to the player
            this.cameras.set(player, camera);
        });
    }

    public updateCameraAspectRatios(): void {
        this.cameras.forEach((camera) => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        });
    }
}
