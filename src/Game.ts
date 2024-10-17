// src/Game.ts

import * as THREE from 'three';
import { Player } from './Entities/Player';
import { NPC } from './Entities/NPC';
import { CollisionManager } from './Managers/CollisionManager';
import { LoadingBar } from './Utils/LoadingBar';
import { Projectile } from './Entities/Projectile';
import { InputManager } from './Managers/InputManager';
import { SoundManager } from './Managers/SoundManager';
import { CameraManager } from './Managers/CameraManager';
import { LightManager } from './Managers/LightManager';
import { RendererManager } from './Managers/RendererManager';
import { SoundEnum } from "./Enums/SoundPaths";
import { TargetManager } from './Managers/TargetManager';
import { MapPaths, MapName } from './Enums/MapPaths';


export class Game {
    //###################################################
    //################### MEMBERS #######################
    //###################################################

    public clock: THREE.Clock;
    public loadingBar: LoadingBar;
    public assetsPath: string;

    public scene: THREE.Scene;
    public cameraManager: CameraManager;
    public lightManager: LightManager;
    public rendererManager: RendererManager;

    public players: Player[];
    public npcs: NPC[];
    public projectiles: Projectile[];

    public collisionManager: CollisionManager;
    public inputManager: InputManager;
    public soundManagers: Map<Player, SoundManager>;
    public targetManager: TargetManager;

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

        // Initialize empty arrays for entities
        this.players = [];
        this.npcs = [];
        this.projectiles = [];

        // Initialize the InputManager
        this.inputManager = new InputManager();

        // Set savePath and loadPath
        this.savePath = 'path/to/savefile.json';
        this.loadPath = loadPath;

        // Initialize the SceneManager
        this.scene = new THREE.Scene();

        // Initialize the LightManager
        this.lightManager = new LightManager(this.scene);

        // Check if loadPath exists
        if (this.loadPath) {
            // Load game from data
            console.log('Request loading game');
            this.loadGame();
        } else {
            // Use the debug initializer
            console.log('Request creating debug scene');
            this.createDebugScene();
            console.log('Debug scene created');
        }

        // Initialize the CameraManager after players are created
        this.cameraManager = new CameraManager(this.players);

        // Initialize the SoundManagers for each player
        this.soundManagers = new Map<Player, SoundManager>();
        this.players.forEach((player) => {
            const camera = this.cameraManager.cameras.get(player);
            if (camera) {
                const soundManager = new SoundManager(camera, this.assetsPath, player);
                this.soundManagers.set(player, soundManager);
            }
        });

        this.targetManager = new TargetManager([this.players, this.npcs]);

        // Initialize the RendererManager
        this.rendererManager = new RendererManager(this.cameraManager, this.scene, this.players);

        this.collisionManager = new CollisionManager(this);


        this.waitForEntitiesToBeReady();
    }

    private createDebugScene(): void {
        // Create two players at different positions
        console.log('Request creating player')
        const player1 = new Player(this, 'f22', new THREE.Vector3(-10, 0, 0), undefined, undefined, undefined, 1, 0);
        // const player2 = new Player(this, 'f22', new THREE.Vector3(10, 0, 0), undefined, undefined, undefined, 1, 1);

        this.players.push(player1);

        // Optionally, add some NPCs for testing
        console.log('Request creating npc');
        const npcPosition = new THREE.Vector3(0, 0, -50);
        const npc = new NPC(this, 'plane', npcPosition);
        this.npcs.push(npc);

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

        this.loadSkybox('paintedsky');
    }

    private loadSkybox(mapName: MapName): void {
        const path = `${this.assetsPath}${MapPaths[mapName]}/`;
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

    public loadGame(): void {
        // Placeholder for loading game data from this.loadPath
        console.log(`Loading game from ${this.loadPath}`);
    }

    public saveGame(): void {
        // Placeholder for saving game data to this.savePath
        console.log(`Saving game to ${this.savePath}`);
    }

    //###################################################
    //################### START #########################
    //###################################################

    // In Game.ts

    public start(): void {
        // console.log('Start adding entities to scene');
        // this.players.forEach((player) => {
        //     player.addToScene(this.sceneManager.scene);
        // });
        //
        // this.npcs.forEach((npc) => {
        //     npc.addToScene(this.sceneManager.scene);
        // });
        // Start the game loop
        this.players.forEach(player => {
            this.playSound(player, 'engine', true, 0)
        })
        console.log('Start game loop')
        this.loop();
    }

    private waitForEntitiesToBeReady(): void {
        const checkReady = () => {
            const allPlayersReady = this.players.every(player => player.ready);
            const allNPCsReady = this.npcs.every(npc => npc.ready);

            if (allPlayersReady && allNPCsReady) {
                console.log('All entities are ready. Starting game.');
                this.start();
            } else {
                // Continue checking
                requestAnimationFrame(checkReady);
            }
        };

        checkReady();
    }

    private loop(): void {
        requestAnimationFrame(() => this.loop());

        const deltaTime = this.clock.getDelta();
        this.update(deltaTime);
        this.rendererManager.render(); // Call render on rendererManager
    }

    private update(deltaTime: number): void {
        // Update players
        this.players.forEach((player) => {
            if (player.ready) {
                player.update(deltaTime);
            }
        });

        // Update NPCs
        this.npcs.forEach((npc) => {
            if (npc.ready) {
                npc.update(deltaTime);
            }
        });

        // Update projectiles
        this.projectiles.forEach((projectile, index) => {
            projectile.update(deltaTime);
            // Remove projectiles that are out of bounds or have expired
            if (this.collisionManager.isProjectileOutOfBounds(projectile)) {
                console.log('Projectile out of bounds');
                projectile.removeFromScene();
                this.projectiles.splice(index, 1);
            }
        });

        this.cameraManager.updateCameras();

        // Check collisions
        this.collisionManager.checkCollisions();

        // Update sounds for each player
        this.players.forEach((player) => {
            const soundManager = this.soundManagers.get(player);
            soundManager?.updateSounds();
        });
    }

    private updateSounds(player: Player): void {
        // Example: Adjust engine sound volume based on player speed
        const soundManager = this.soundManagers.get(player);
        if (soundManager) {
            const speed = player.velocity.length();
            const maxSpeed = 10; // Define your max speed
            const volume = THREE.MathUtils.clamp(speed / maxSpeed, 0, 1);
            soundManager.setVolume('engine', volume);
        }
    }

    public playSound(player: Player, name: SoundEnum, loop: boolean = false, volume: number = 1): void {
        this.soundManagers.get(player)?.playSound(name, loop, volume)
    }
}
