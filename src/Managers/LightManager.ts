// src/Managers/LightManager.ts

import * as THREE from 'three';

export class LightManager {
    private scene: THREE.Scene;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.addLights();
    }

    private addLights(): void {
        // Add Ambient Light
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0); // Adjust intensity as needed
        this.scene.add(ambientLight);

        // Add Directional Light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Adjust intensity as needed
        directionalLight.position.set(10, 10, 10); // Position the light source

        // Create a target for the Directional Light
        const lightTarget = new THREE.Object3D();
        lightTarget.position.set(0, -1, -1); // Pointing towards (0, -1, -1)
        this.scene.add(lightTarget);
        directionalLight.target = lightTarget;

        // Enable shadows for the Directional Light
        directionalLight.castShadow = true;

        // Configure shadow properties for better quality
        directionalLight.shadow.mapSize.width = 2048;  // Higher value means better shadow quality
        directionalLight.shadow.mapSize.height = 2048;

        directionalLight.shadow.camera.near = 0.01;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;

        // Optional: Visualize the shadow camera frustum (useful for debugging)
        // const helper = new THREE.CameraHelper(directionalLight.shadow.camera);
        // this.scene.add(helper);

        // Adjust shadow bias to prevent shadow artifacts
        directionalLight.shadow.bias = -0.0005;  // Typically a small negative value

        this.scene.add(directionalLight);
    }
}
