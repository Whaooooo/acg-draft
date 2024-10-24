// src/Managers/SceneManager.ts

import * as THREE from 'three';
import { Water } from '../Entities/Water';
import { Cloud } from '../Entities/Cloud';
import { MapPaths, MapName } from '../Configs/MapPaths';
import { Config } from '../Configs/Config';

export class SceneManager {
    public scene: THREE.Scene;
    public renderer!: THREE.WebGLRenderer;

    public water?: Water;
    public clouds: Cloud[] = [];
    public directionalLight?: THREE.DirectionalLight;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.SetupRenderer();
        this.addLights();
        this.CreateBasicScene();
        this.loadSkybox('paintedsky');
    }

    private SetupRenderer(): void {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance", logarithmicDepthBuffer: true, precision: "highp" });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping; // Advanced tone mapping
        this.renderer.toneMappingExposure = 1; // Adjust exposure as needed
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    private onWindowResize(): void {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    public renderCamera(camera: THREE.Camera, left: number, bottom: number, viewportWidth: number, viewportHeight: number): void {
        const position = camera.position.clone();
        if (this.directionalLight) {
            this.directionalLight.position.copy(position.clone().add(new THREE.Vector3(1000, 1000, 1000)));
            this.directionalLight.target.position.copy(position.clone().sub(new THREE.Vector3(100, 100, 100)));
        }
        if (this.water) {
            var water_position = position.clone();
            water_position.y = 0;
            this.water.position.copy(water_position);
        }

        this.renderer.setViewport(left, bottom, viewportWidth, viewportHeight);
        this.renderer.setScissor(left, bottom, viewportWidth, viewportHeight);
        this.renderer.setScissorTest(true);
        this.renderer.render(this.scene, camera);
    }

    private addLights(): void {
        // Add Ambient Light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Adjust intensity as needed
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
        directionalLight.shadow.mapSize.width = 4096;  // Higher value means better shadow quality
        directionalLight.shadow.mapSize.height = 4096;

        directionalLight.shadow.camera.near = 0.01;
        directionalLight.shadow.camera.far = 5000;
        directionalLight.shadow.camera.left = -1000;
        directionalLight.shadow.camera.right = 1000;
        directionalLight.shadow.camera.top = 1000;
        directionalLight.shadow.camera.bottom = -1000;
        directionalLight.shadow.camera.updateProjectionMatrix();

        // Optional: Visualize the shadow camera frustum (useful for debugging)
        const helper = new THREE.CameraHelper(directionalLight.shadow.camera);
        this.scene.add(helper);

        // Adjust shadow bias to prevent shadow artifacts
        directionalLight.shadow.bias = -0.00005;  // Typically a small negative value

        this.scene.add(directionalLight);
        this.directionalLight = directionalLight;
    }

    private loadSkybox(mapName: MapName): void {
        const path = `${Config.assetsPath}${MapPaths[mapName]}/`;
        const format = '.jpg'; // Adjust the format if your images are in a different format
        const urls = [
            path + 'px' + format, // positive x
            path + 'nx' + format, // negative x
            path + 'py' + format, // positive y
            path + 'ny' + format, // negative y
            path + 'pz' + format, // positive z
            path + 'nz' + format  // negative z
        ];

        const loader = new THREE.CubeTextureLoader();
        loader.load(
            urls,
            (texture) => {
                this.scene.background = texture;
            },
            undefined,
            (err) => {
                console.error('Error loading skybox:', err);
            }
        );
    }

    private CreateBasicScene(): void {
        const sphereGeometry = new THREE.SphereGeometry(5, 32, 32);
        const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.add(new THREE.Vector3(0, 15, 0));
        sphere.castShadow = true; //default is false
        sphere.receiveShadow = true; //default
        this.scene.add(sphere);




        const waterGeometry = new THREE.PlaneGeometry(100000, 100000);
        const water = new Water(
            waterGeometry,
            {
                textureWidth: 1024,
                textureHeight: 1024,
                waterNormals: new THREE.TextureLoader().load(`${Config.assetsPath}waternormals.jpg`, function (texture) {

                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

                }),
                sunDirection: new THREE.Vector3(0.577, 0.577, 0.577),
                sunColor: 0xffffff,
                waterColor: 0x001e0f,
                distortionScale: 2.5,
                fog: this.scene.fog !== undefined
            }
        );
        // const water = new THREE.Mesh(waterGeometry, new THREE.MeshStandardMaterial({ color: 0xffffff }));
        water.receiveShadow = true;
        water.rotation.x = - Math.PI / 2;
        water.position.set(0, 0, 0);
        this.scene.add(water);
        this.water = water;

        const cloud = new Cloud({ size: [512, 128, 512], opacity: 0.2, threshold: 0.25, boxBound: new THREE.Vector3(2000.0, 320.0, 2000.0) });
        cloud.position.set(50, 600, 80);
        this.scene.add(cloud);
    }

    public addtoScene(object: THREE.Object3D): void {
        this.scene.add(object);
    }

    public removeFromScene(object: THREE.Object3D): void {
        this.scene.remove(object);
    }

    public update(deltaTime: number): void {
        if (this.water) {
            (this.water.material as any).uniforms['time'].value += deltaTime;
        }
    }
}