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
    public sceneManager: SceneManager;

    public players: Player[];
    public npcs: NPC[];
    public projectiles: Missile[];

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
        this.soundManagers = new Map<Player, SoundManager>();
        this.players.forEach((player) => {
            const camera = this.cameraManager.cameras.get(player);
            if (camera) {
                const soundManager = new SoundManager(camera, player);
                this.soundManagers.set(player, soundManager);
            }
        });

        this.targetManager = new TargetManager([this.players, this.npcs]);

        this.collisionManager = new CollisionManager(this);


        this.waitForEntitiesToBeReady();
    }

    private createDebugScene(): void {
        // Create two players at different positions
        console.log('Request creating player')
        const player1 = new Player(this, 'f22', new THREE.Vector3(-10, 0, 0), undefined, undefined, 1, 0, 0);
        // const player2 = new Player(this, 'f22', new THREE.Vector3(10, 0, 0), undefined, undefined, undefined, 1, 1);

        this.players.push(player1);

        // Optionally, add some NPCs for testing
        console.log('Request creating npc');
        const npcPosition = new THREE.Vector3(0, 0, -50);
        const npc = new NPC(this, 'plane', npcPosition);
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

                this.sceneManager.renderCamera(camera, left, bottom, viewportWidth, viewportHeight);
            }
            index++;
        });
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

        // Update sounds for each player
        this.players.forEach((player) => {
            const soundManager = this.soundManagers.get(player);
            soundManager?.updateSounds();
        });

        this.sceneManager.update(deltaTime);
    }

    public playSound(player: Player, name: SoundEnum, loop: boolean = false, volume: number = 1): void {
        this.soundManagers.get(player)?.playSound(name, loop, volume)
    }

    public getTime(): number {
        // Return the current game time in seconds
        // This could be based on a THREE.Clock instance
        return this.clock.getElapsedTime();
    }
}
