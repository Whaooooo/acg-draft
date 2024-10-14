// src/Managers/LightManager.ts

import * as THREE from 'three';

export class LightManager {
    private scene: THREE.Scene;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.addLights();
    }

    private addLights(): void {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 5);
        directionalLight.position.set(60, 60, 60);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
    }
}
