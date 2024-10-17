// src/Managers/LightManager.ts

import * as THREE from 'three';

export class LightManager {
    private scene: THREE.Scene;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.addLights();
    }

    private addLights(): void {
        // const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        // this.scene.add(ambientLight);

        const directionalLight = new THREE.PointLight(0xffffff, 5000);
        directionalLight.position.set(20, 20, 20);
        directionalLight.castShadow = true;

        // Configure shadow properties
        directionalLight.shadow.mapSize.width = 2048;  // Higher value means better shadow quality
        directionalLight.shadow.mapSize.height = 2048;

        directionalLight.shadow.camera.near = 1;
        directionalLight.shadow.camera.far = 100;

        directionalLight.shadow.bias = -0.0005;  // 调整此值，通常为负值


        this.scene.add(directionalLight);
    }
}
