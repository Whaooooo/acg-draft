// src/Game.ts

import * as THREE from 'three';
import { Entity } from "./Core/Entity";
import { Player } from './Entities/Player';
import { NPCPlane } from './Entities/NPCPlane';
import { CollisionManager } from './Managers/CollisionManager';
import { LoadingBar } from './Utils/LoadingBar';
import { Missile } from './Entities/Missile';
import { InputManager } from './Managers/InputManager';
import { SoundManager } from './Managers/SoundManager';
import { CameraManager } from './Managers/CameraManager';
import { SceneManager } from './Managers/SceneManager';
import { TargetManager } from './Managers/TargetManager';
import { HUDManager } from "./Managers/HUDManager";
import {MovableEntity} from "./Core/MovableEntity";

export class Game {
    //###################################################
    //################### MEMBERS #######################
    //###################################################

    public clock: THREE.Clock;
    public loadingBar: LoadingBar;

    public scene: THREE.Scene;
    public cameraManager: CameraManager;
    public sceneManager: SceneManager;

    public entityMap: Map<number, Entity> = new Map();
    public movableEntityMap: Map<number, MovableEntity> = new Map();
    public playerMap: Map<number, Player> = new Map();
    public npcPlaneMap: Map<number, NPCPlane> = new Map();
    public projectileMap: Map<number, Missile> = new Map();

    public collisionManager: CollisionManager;
    public inputManager: InputManager;
    public soundManager: SoundManager;
    public targetManager: TargetManager;
    public hudManager: HUDManager;

    public savePath: string;
    public loadPath?: string;

    private lastFrameTime: number = 0;
    private frameCount: number = 0;

    private isRunning: boolean = true; // Add this flag

    //###################################################
    //################### INIT ##########################
    //###################################################

    constructor(loadPath?: string) {
        // Initialize the clock
        console.log('Initializing new game');
        this.clock = new THREE.Clock();

        // Initialize the loading bar
        this.loadingBar = new LoadingBar();

        // Initialize the InputManager
        this.inputManager = new InputManager();

        // Set savePath and loadPath
        this.savePath = 'path/to/savefile.json';
        this.loadPath = loadPath;

        // Initialize the SceneManager
        this.scene = new THREE.Scene();

        // Initialize the SceneManager (assuming SceneManager takes the scene as a parameter)
        this.sceneManager = new SceneManager(this.scene);

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

        // Wait for entities to be ready
        this.waitForEntitiesToBeReady();

        // Initialize the CameraManager after players are created
        this.cameraManager = new CameraManager(Array.from(this.playerMap.values()));

        // Initialize the SoundManagers for each player
        this.soundManager = new SoundManager(Array.from(this.playerMap.values()), this.cameraManager.cameras, this.scene);

        // Initialize TargetManager with players and NPCs
        this.targetManager = new TargetManager([
            Array.from(this.playerMap.values()),  // Players array
            Array.from(this.npcPlaneMap.values()) // NPC planes array
        ]);

        // Initialize CollisionManager
        this.collisionManager = new CollisionManager(this);

        this.hudManager = new HUDManager(Array.from(this.playerMap.values()), this.cameraManager, this.sceneManager.renderer);

        // Wait for sound to be ready before starting the game
        this.waitForSoundToBeReady();
    }

    private createDebugScene(): void {
        // Create a player
        console.log('Request creating player');
        const player1 = new Player(this, 'f22', new THREE.Vector3(0, 20, 0), undefined, undefined, 1, 0);
        this.playerMap.set(player1.entityId, player1);

        // Optionally, add some NPCs for testing
        console.log('Request creating npc');
        const npcPosition = new THREE.Vector3(0, 60, -50);
        const npc = new NPCPlane(this, 'plane', npcPosition);
        this.npcPlaneMap.set(npc.entityId, npc);
    }

    public loadGame(): void {
        // Placeholder for loading game data from this.loadPath
        console.log(`Loading game from ${this.loadPath}`);
        // Implement loading logic here
    }

    public saveGame(): void {
        // Placeholder for saving game data to this.savePath
        console.log(`Saving game to ${this.savePath}`);
        // Implement saving logic here
    }

    //###################################################
    //################### START #########################
    //###################################################

    public async start(): Promise<void> {
        // Initialize sounds for players and NPCs
        this.playerMap.forEach(player => player.initializeSound());
        this.npcPlaneMap.forEach(npc => npc.initializeSound());

        console.log('Start game loop');
        this.loop();
    }

    private waitForEntitiesToBeReady(): void {
        const checkReady = () => {
            const allEntitiesReady = Array.from(this.entityMap.values()).every(entity => entity.ready);

            if (allEntitiesReady) {
                console.log('All entities ready. Proceeding.');
            } else {
                // Continue checking
                requestAnimationFrame(checkReady);
            }
        };

        checkReady();
    }

    private waitForSoundToBeReady(): void {
        const checkReady = () => {
            const soundReady = this.soundManager.ready;

            if (soundReady) {
                console.log('Sound ready. Starting game.');
                this.start();
            } else {
                // Continue checking
                requestAnimationFrame(checkReady);
            }
        };

        checkReady();
    }

    private loop(): void {
        if (!this.isRunning) return; // Stop the loop if the game is over

        requestAnimationFrame(() => this.loop());

        const deltaTime = this.clock.getDelta();
        this.update(deltaTime);

        if (this.lastFrameTime === 0)
            this.lastFrameTime = performance.now();
        this.frameCount++;
        if (this.frameCount >= 30 || (this.frameCount >= 4 && performance.now() - this.lastFrameTime >= 2000)) {
            var fps = this.frameCount / ((performance.now() - this.lastFrameTime) / 1000);
            this.frameCount = 0;
            this.lastFrameTime = performance.now();
            const fpsDisplay = document.getElementById('fps-display');
            if (fpsDisplay) {
                fpsDisplay.innerText = `FPS: ${Math.round(fps)}`;
            }
        }

        const numPlayers = this.playerMap.size;
        const width = window.innerWidth;
        const height = window.innerHeight;
        const playerCameras = this.cameraManager.cameras;

        let index = 0;
        this.playerMap.forEach((player) => {
            const camera = playerCameras.get(player);
            if (camera) {
                const left = Math.floor((index / numPlayers) * width);
                const bottom = 0;
                const viewportWidth = Math.floor(width / numPlayers);
                const viewportHeight = height;

                this.sceneManager.renderCamera(camera, left, bottom, viewportWidth, viewportHeight);
            }
            index++;
        });
    }

    private update(deltaTime: number): void {
        // Update players
        this.playerMap.forEach((player) => {
            if (player.ready) {
                player.update(deltaTime);
            }
        });

        // Update NPCs
        this.npcPlaneMap.forEach((npc) => {
            if (npc.ready) {
                npc.update(deltaTime);
            }
        });

        // Update camera positions and orientations based on player inputs
        this.cameraManager.updateCameras(deltaTime);

        // Check collisions
        this.collisionManager.update(deltaTime);

        // Update the scene
        this.sceneManager.update(deltaTime);

        if (this.playerMap.size === 0) {
            this.end();
        }

        // After rendering all cameras, update and render HUD
        this.hudManager.update(deltaTime);
        this.hudManager.render();
    }

    public getTime(): number {
        // Return the current game time in seconds
        return this.clock.getElapsedTime();
    }

    public requestNewEntityId(entity: Entity): number {
        for (let i = 0; i < 10000; i++) {
            if (!this.entityMap.has(i)) {
                this.entityMap.set(i, entity); // Add the new ID to the set
                return i;             // Return the ID
            }
        }
        throw new Error('No available entity IDs');
    }

    public end(): void {
        this.isRunning = false;

        // Show the mission failed screen
        const missionFailedScreen = document.getElementById('mission-failed-screen');
        if (missionFailedScreen) {
            missionFailedScreen.style.display = 'flex';
        }

        // Release pointer lock
        if (this.inputManager) {
            this.inputManager.releasePointerLock();
        }

        // Ensure cursor is visible
        document.body.style.cursor = 'default';

        // Play the mission failed sound
        this.playMissionFailedSound();

        this.dispose();
    }

    private playMissionFailedSound(): void {
        const missionFailedAudio = document.getElementById('mission-failed-sound') as HTMLAudioElement;
        if (missionFailedAudio) {
            missionFailedAudio.play().catch((error) => {
                console.error('Failed to play mission failed sound:', error);
            });
        }
    }

    public dispose(): void {
        console.log('Disposing game resources...');
        // Dispose HUDManager
        if (this.hudManager) {
            this.hudManager.dispose();
        }

        // Dispose InputManager
        if (this.inputManager) {
            this.inputManager.dispose();
        }

        // Remove renderer from DOM
        if (this.sceneManager.renderer.domElement.parentNode) {
            this.sceneManager.renderer.domElement.parentNode.removeChild(this.sceneManager.renderer.domElement);
        }

        // Dispose of Three.js objects
        this.scene.traverse((object) => {
            if ((object as any).geometry) {
                (object as any).geometry.dispose();
            }
            if ((object as any).material) {
                if (Array.isArray((object as any).material)) {
                    (object as any).material.forEach((material: any) => material.dispose());
                } else {
                    (object as any).material.dispose();
                }
            }
        });

        // Clear maps
        this.entityMap.clear();
        this.playerMap.clear();
        this.npcPlaneMap.clear();
        this.projectileMap.clear();
    }
}
