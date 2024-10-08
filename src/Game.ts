// src/Game.ts

import * as THREE from 'three';
import { Player } from './Entities/Player';
import { NPC } from './Entities/NPC';
import { CollisionManager } from './Managers/CollisionManager';
import { LoadingBar } from './Utils/LoadingBar';
import { Projectile } from './Entities/Projectile';
import { InputManager } from './Managers/InputManager';
import { SoundManager } from './Managers/SoundManager';

export class Game {
    //###################################################
    //################### MEMBERS #######################
    //###################################################

    public clock: THREE.Clock;
    public loadingBar: LoadingBar;
    public assetsPath: string;

    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    public renderer: THREE.WebGLRenderer;

    public player?: Player;
    public enemies: NPC[];
    public projectiles: Projectile[];

    public collisionManager: CollisionManager;
    public inputManager: InputManager;
    public soundManager: SoundManager;

    public savePath: string;
    public loadPath?: string;

    //###################################################
    //################### INIT ##########################
    //###################################################

    constructor(loadPath?: string) {
        // Initialize the clock
        console.log('Initializing new game');
        this.clock = new THREE.Clock();

        // Initialize the loading bar
        this.loadingBar = new LoadingBar();

        // Set the path to your assets
        this.assetsPath = 'assets/';

        // Create the scene
        this.scene = new THREE.Scene();

        // Set up the camera
        this.camera = new THREE.PerspectiveCamera(
            70, // Field of view
            window.innerWidth / window.innerHeight, // Aspect ratio
            0.1, // Near clipping plane
            1000 // Far clipping plane
        );
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);

        // Set up the renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this), false);

        // Add lights to the scene
        this.addLights();

        // Initialize the InputManager
        this.inputManager = new InputManager();

        // Initialize the SoundManager
        this.soundManager = new SoundManager(this.camera, this.assetsPath);


        // Initialize empty arrays for entities
        this.enemies = [];
        this.projectiles = [];

        // Initialize the collision manager
        this.collisionManager = new CollisionManager(this);

        // Set savePath and loadPath
        this.savePath = 'path/to/savefile.json';
        this.loadPath = loadPath;

        // Check if loadPath exists
        if (this.loadPath) {
            // Load game from data
            console.log('Request loading game')
            this.loadGame();
        } else {
            // Use the debug initializer
            console.log('Request creating debug scene')
            this.createDebugScene();
        }

        // Start the game loop
        this.start();
    }

    private addLights(): void {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 10);
        this.scene.add(directionalLight);
    }

    private onWindowResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    private createDebugScene(): void {
        // Create a simple player at the origin
        this.player = new Player(this, 'f22', undefined, undefined, 1);

        // Optionally, add some enemies for testing
        const enemyPosition = new THREE.Vector3(0, 0, -50);
        const enemy = new NPC(this, 'f22', enemyPosition);
        this.enemies.push(enemy);
    }

    public loadGame(): void {
        // Placeholder for loading game data from this.loadPath
        console.log(`Loading game from ${this.loadPath}`);
    }

    public saveGame(): void {
        // Placeholder for saving game data to this.savePath
        console.log(`Saving game to ${this.savePath}`);
    }

    //###################################################       ###################################################
    //###################################################       ###################################################
    //################################################### START ###################################################
    //###################################################       ###################################################
    //###################################################       ###################################################

    public start(): void {
        if (this.player){
            this.player.addToScene()
        }

        this.enemies.forEach(enemy => {
            enemy.addToScene()
        });

        // Start the game loop
        this.loop();
    }

    private loop(): void {
        requestAnimationFrame(() => this.loop());

        const deltaTime = this.clock.getDelta();
        this.update(deltaTime);
        this.render();
    }

    private update(deltaTime: number): void {
        // Update the player
        if (this.player){
            if (this.player.ready) {
                this.player.update(deltaTime);
            }
        }
        // Update enemies
        this.enemies.forEach(enemy => {
            if (enemy.ready) {
                enemy.update(deltaTime);
            }
        });

        // Update projectiles
        this.projectiles.forEach((projectile, index) => {
            projectile.update(deltaTime);

            // Remove projectiles that are out of bounds or have expired
            if (this.isProjectileOutOfBounds(projectile)) {
                projectile.removeFromScene();
                this.projectiles.splice(index, 1);
            }
        });

        // Check collisions
        this.collisionManager.checkCollisions();

        // Update sounds based on game state if needed
        this.updateSounds();
    }

    private render(): void {
        this.renderer.render(this.scene, this.camera);
    }

    private isProjectileOutOfBounds(projectile: Projectile): boolean {
        if (!projectile.entity) return true;

        const position = projectile.entity.position;
        const bounds = 1000; // Adjust according to your game world size

        return (
            Math.abs(position.x) > bounds ||
            Math.abs(position.y) > bounds ||
            Math.abs(position.z) > bounds
        );
    }

    private updateSounds(): void {
        // Example: Adjust engine sound volume based on player speed
        if (this.player){
            const speed = this.player.velocity.length();
            const maxSpeed = 100; // Define your max speed
            const volume = THREE.MathUtils.clamp(speed / maxSpeed, 0, 1);
            this.soundManager.setVolume('engine', volume);
        }
    }
}
