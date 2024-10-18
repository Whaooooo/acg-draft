// src/Managers/RendererManager.ts

import * as THREE from 'three';
import { CameraManager } from './CameraManager';
import { Player } from '../Entities/Player';

export class RendererManager {
    public renderer: THREE.WebGLRenderer;
    private cameraManager: CameraManager;
    private scene: THREE.Scene;
    private players: Player[];

    constructor(cameraManager: CameraManager, scene: THREE.Scene, players: Player[]) {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping; // Advanced tone mapping
        this.renderer.toneMappingExposure = 1; // Adjust exposure as needed
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.cameraManager = cameraManager;
        this.scene = scene;
        this.players = players;

        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    private onWindowResize(): void {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.cameraManager.updateCameraAspectRatios();
    }

    public render(): void {
        const scene = this.scene;
        const numPlayers = this.players.length;
        const width = window.innerWidth;
        const height = window.innerHeight;
        const playerCameras = this.cameraManager.cameras;

        let index = 0;
        this.players.forEach((player) => {
            const camera = playerCameras.get(player);
            if (camera) {
                const left = Math.floor((index / numPlayers) * width);
                const bottom = 0;
                const viewportWidth = Math.floor(width / numPlayers);
                const viewportHeight = height;

                this.renderer.setViewport(left, bottom, viewportWidth, viewportHeight);
                this.renderer.setScissor(left, bottom, viewportWidth, viewportHeight);
                this.renderer.setScissorTest(true);

                this.renderer.render(scene, camera);
            }
            index++;
        });
    }
}
