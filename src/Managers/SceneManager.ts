// src/Managers/SceneManager.ts

import * as THREE from 'three';
import { Water } from '../Entities/Water';
import { MapPaths, MapName } from '../Configs/MapPaths';
import { Config } from '../Configs/Config';

export class SceneManager {
    public scene: THREE.Scene;

    public water?: Water;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.addLights();
        this.CreateBasicScene();
        this.loadSkybox('paintedsky');
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
        sphere.castShadow = true; //default is false
        sphere.receiveShadow = true; //default
        this.scene.add(sphere);
        const planeGeometry = new THREE.PlaneGeometry(20, 20, 32, 32);
        const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 })
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.receiveShadow = true;
        this.scene.add(plane);

        const waterGeometry = new THREE.PlaneGeometry(10000, 10000);


        const water = new Water(
            waterGeometry,
            {
                textureWidth: 512,
                textureHeight: 512,
                waterNormals: new THREE.TextureLoader().load('assets/waternormals.jpg', function (texture) {

                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

                }),
                sunDirection: new THREE.Vector3(0.577, 0.577, 0.577),
                sunColor: 0xffffff,
                waterColor: 0x001e0f,
                distortionScale: 2.5,
                fog: this.scene.fog !== undefined
            }
        );
        water.receiveShadow = true;
        water.rotation.x = - Math.PI / 2;
        water.position.set(0, -15, 0);
        this.scene.add(water);
        this.water = water;
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