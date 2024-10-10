// src/Managers/SceneManager.ts

import * as THREE from 'three';

export class SceneManager {
    public scene: THREE.Scene;

    constructor() {
        this.scene = new THREE.Scene();
    }
}
