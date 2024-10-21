// src/Game.ts

import * as THREE from 'three';
import { Player } from './Entities/Player';
import { NPC } from './Entities/NPC';
import { CollisionManager } from './Managers/CollisionManager';
import { LoadingBar } from './Utils/LoadingBar';
import { Missile } from './Entities/Missile';
import { InputManager } from './Managers/InputManager';
import { SoundManager } from './Managers/SoundManager';
import { CameraManager } from './Managers/CameraManager';
import { SceneManager } from './Managers/SceneManager';
import { RendererManager } from './Managers/RendererManager';
import { SoundEnum } from "./Configs/SoundPaths";
import { TargetManager } from './Managers/TargetManager';
import { Config } from './Configs/Config';

export class Game {
    //###################################################
    //################### MEMBERS #######################
    //###################################################

    public clock: THREE.Clock;
    public loadingBar: LoadingBar;

    public scene: THREE.Scene;
    public cameraManager: CameraManager;
    public rendererManager: RendererManager;
    public sceneManager: SceneManager;

    public entityIdSet: Set<number>;
    public players: Player[];
    public npcs: NPC[];
    public projectiles: Missile[];

    public collisionManager: CollisionManager;
    public inputManager: InputManager;
    public soundManager: SoundManager;
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

        // Initialize empty arrays for entities
        this.entityIdSet = new Set<number>
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

        // Initialize the CameraManager after players are created
        this.cameraManager = new CameraManager(this.players);

        // Initialize the SoundManagers for each player
        this.soundManager = new SoundManager(this.players, this.cameraManager.cameras, this.scene);

        this.targetManager = new TargetManager([this.players, this.npcs]);

        // Initialize the RendererManager
        this.rendererManager = new RendererManager(this.cameraManager, this.scene, this.players);

        this.collisionManager = new CollisionManager(this);


        this.waitForEntitiesToBeReady();
    }

    private createDebugScene(): void {

        // Create two players at different positions
        console.log('Request creating player')
        const player1 = new Player(this, this.requestNewEntityId(), 'f22', new THREE.Vector3(-10, 0, 0), undefined, undefined, 1, 0);
        // const player2 = new Player(this, 'f22', new THREE.Vector3(10, 0, 0), undefined, undefined, undefined, 1, 1);

        this.players.push(player1);

        // Optionally, add some NPCs for testing
        console.log('Request creating npc');
        const npcPosition = new THREE.Vector3(0, 0, -50);
        const npc = new NPC(this, this.requestNewEntityId(), 'plane', npcPosition);
        this.npcs.push(npc);
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
        this.players.forEach(player => player.initializeSound())
        this.npcs.forEach(npc => npc.initializeSound())

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


        this.cameraManager.updateCameras();

        // Check collisions
        this.collisionManager.update(deltaTime);

        this.sceneManager.update(deltaTime);
    }

    public getTime(): number {
        // Return the current game time in seconds
        // This could be based on a THREE.Clock instance
        return this.clock.getElapsedTime();
    }

    public requestNewEntityId(): number {
        for (let i = 0; i < 10000; i++) {
            if (!this.entityIdSet.has(i)) {
                this.entityIdSet.add(i); // Add the new ID to the set
                return i;             // Return the ID
            }
        }
        throw new Error('No available entity IDs');
    }

}
