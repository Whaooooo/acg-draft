// src/Managers/SceneManager.ts

import * as THREE from 'three';
import { Water } from '../Entities/Water';
import { Cloud } from '../Entities/Cloud';
import { MapPaths, MapName } from '../Configs/MapPaths';
import { Config } from '../Configs/Config';
import { ImprovedNoise } from '../Utils/ImprovedNoise';

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

        const cloud = new Cloud({ size: [512, 80, 512], opacity: 0.3, threshold: 0.45, range: 0.1, steps: 75, boxBound: new THREE.Vector3(40000.0, 400.0, 40000.0) });
        cloud.position.set(0, 2400, 0);
        this.scene.add(cloud);

        console.log('cloud');

        const worldWidth = 1024, worldDepth = 1024,
            worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2;
        const data = this.generateHeight(worldWidth, worldDepth);
        const geometry = new THREE.PlaneGeometry(75000, 75000, worldWidth - 1, worldDepth - 1);
        geometry.rotateX(- Math.PI / 2);

        const vertices = geometry.attributes.position.array;

        for (let i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {

            vertices[j + 1] = data[i] * 40 - 2500;

        }

        const texture = new THREE.CanvasTexture(this.generateTexture(data, worldWidth, worldDepth));
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.colorSpace = THREE.SRGBColorSpace;

        const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ map: texture }));
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
    }

    generateTexture(data: any, width: number, height: number) {

        // bake lighting into texture

        let context: any, image, imageData, shade;

        const vector3 = new THREE.Vector3(0, 0, 0);

        const sun = new THREE.Vector3(1, 1, 1);
        sun.normalize();

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        context = canvas.getContext('2d');
        context.fillStyle = '#000';
        context.fillRect(0, 0, width, height);

        image = context.getImageData(0, 0, canvas.width, canvas.height);
        imageData = image.data;

        for (let i = 0, j = 0, l = imageData.length; i < l; i += 4, j++) {

            vector3.x = data[j - 2] - data[j + 2];
            vector3.y = 2;
            vector3.z = data[j - width * 2] - data[j + width * 2];
            vector3.normalize();

            shade = vector3.dot(sun);

            imageData[i] = (96 + shade * 128) * (0.5 + data[j] * 0.007);
            imageData[i + 1] = (32 + shade * 96) * (0.5 + data[j] * 0.007);
            imageData[i + 2] = (shade * 96) * (0.5 + data[j] * 0.007);

        }

        context.putImageData(image, 0, 0);

        // Scaled 4x

        const canvasScaled = document.createElement('canvas');
        canvasScaled.width = width * 4;
        canvasScaled.height = height * 4;

        context = canvasScaled.getContext('2d');
        context.scale(4, 4);
        context.drawImage(canvas, 0, 0);

        image = context.getImageData(0, 0, canvasScaled.width, canvasScaled.height);
        imageData = image.data;

        for (let i = 0, l = imageData.length; i < l; i += 4) {

            const v = ~ ~(Math.random() * 5);

            imageData[i] += v;
            imageData[i + 1] += v;
            imageData[i + 2] += v;

        }

        context.putImageData(image, 0, 0);

        return canvasScaled;

    }

    generateHeight(width: number, height: number) {

        const size = width * height, data = new Uint8Array(size),
            perlin = new ImprovedNoise(), z = Math.random() * 256;

        let quality = 1;

        for (let j = 0; j < 4; j++) {

            for (let i = 0; i < size; i++) {

                const x = i % width, y = ~ ~(i / width);
                data[i] += Math.abs(perlin.noise(x / quality, y / quality, z) * quality * 1.75);

            }

            quality *= 5;

        }

        return data;

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