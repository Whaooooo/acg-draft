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
import { MovableEntity } from "./Core/MovableEntity";
import { nextFrame, receiveFirstMessage, sleep } from './Utils/Wait';
import { InputSerializer } from './Utils/InputSerializer';
import { Config } from './Configs/Config';
import {ensureNPCs} from "./Configs/PostLoopHooks";

export class Game {
    //###################################################
    //################### MEMBERS #######################
    //###################################################

    public clock: THREE.Clock;
    public loadingBar: LoadingBar;
    public postLoopHooks: CallableFunction[] = [];

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

    private isOnline: boolean = false;
    private isRunning: boolean = true; // Add this flag

    private curTick: number = 0;
    private localPlayer?: Player;
    private socket?: WebSocket;
    private InputBuffer: any[] = [];
    private userStatus = false;
    public userId: string = '';

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
        this.cameraManager = new CameraManager(this);

        // Initialize the SoundManagers for each player
        this.soundManager = new SoundManager(this);

        // Initialize TargetManager with players and NPCs
        this.targetManager = new TargetManager(this);

        // Initialize CollisionManager
        this.collisionManager = new CollisionManager(this);

        this.hudManager = new HUDManager(this);

        // Wait for sound to be ready before starting the game
        this.waitForSoundToBeReady();

        // randomUUID is banned in HTTP
        // this.userId = localStorage.getItem('user_id') || crypto.randomUUID();
        // localStorage.setItem('user_id', this.userId);
        // this.userId = crypto.randomUUID();
        fetch('./new_uuid').then(response => response.text()).then(data => {
            this.userId = data;
        });
        this.initRoomButtons();
    }

    private initRoomButtons() {
        const readyButton = document.getElementById('ready-toggle-button');
        const leaveButton = document.getElementById('leave-room-button');

        if (readyButton) {
            readyButton.onclick = () => {
                this.userStatus = !this.userStatus;
                this.socket?.send(JSON.stringify({ type: 'ready', ready: this.userStatus }));
            }
        }
        if (leaveButton) {
            leaveButton.onclick = () => {
                this.socket?.send(JSON.stringify({ type: 'leave' }));
                this.socket?.close();
                const roomList = document.getElementById('room-selection');
                if (roomList) {
                    roomList.style.display = 'flex';
                }
                const roomLobby = document.getElementById('room-lobby');
                if (roomLobby) {
                    roomLobby.style.display = 'none';
                }
            }
        }
    }



    private createDebugScene(): void {
        // Create a player
        console.log('Request creating player');
        const player1 = new Player(this, 'f22', new THREE.Vector3(0, 2400, 0), undefined, undefined, 1, 0, true);
        // const player2 = new Player(this, 'f22', new THREE.Vector3(200, 2400, 0), undefined, undefined, 1, 0, false);

        // Optionally, add some NPCs for testing
        console.log('Request creating npc');
        const yQua = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
        // const npc1 = new NPCPlane(this, 'npc_f22', new THREE.Vector3(0, 4000, -2500), yQua);
        // new NPCPlane(this, 'npc_plane', new THREE.Vector3(0, 4000, -2500), yQua, undefined, 0);
        // new NPCPlane(this, 'npc_plane', new THREE.Vector3(400, 4000, -2500), yQua, undefined, 0);
        // new NPCPlane(this, 'npc_plane', new THREE.Vector3(-400, 4000, -2500), yQua, undefined, 0);
        // new NPCPlane(this, 'npc_plane', new THREE.Vector3(0, 4200, -2700), yQua, undefined, 0);
        // new NPCPlane(this, 'npc_plane', new THREE.Vector3(400, 4200, -2700), yQua, undefined, 0);
        // new NPCPlane(this, 'npc_plane', new THREE.Vector3(-400, 4200, -2700), yQua, undefined, 0);
        // new NPCPlane(this, 'npc_plane', new THREE.Vector3(0, 4400, -2900), yQua, undefined, 0);
        // new NPCPlane(this, 'npc_plane', new THREE.Vector3(400, 4400, -2900), yQua, undefined, 0);
        // new NPCPlane(this, 'npc_plane', new THREE.Vector3(-400, 4400, -2900), yQua, undefined, 0);
        new NPCPlane(this, 'npc_f22', new THREE.Vector3(0, 4200, -200), undefined, undefined, 1);
        new NPCPlane(this, 'npc_f22', new THREE.Vector3(-300, 4200, 200), undefined, undefined, 1);
        new NPCPlane(this, 'npc_f22', new THREE.Vector3(300, 4200, 200), undefined, undefined, 1);
        this.postLoopHooks.push(ensureNPCs);
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
        this.isOnline = false;

        this.inputManager.gameStarted = true;
        this.inputManager.updatePlayers();

        // Initialize sounds for players and NPCs
        this.playerMap.forEach(player => player.initializeSound());
        this.npcPlaneMap.forEach(npc => npc.initializeSound());

        console.log('Start game loop');
        this.loop();
    }

    private handleMessages(data: any): void {
        const message = JSON.parse(data);
        switch (message.type) {
            case "input":
                this.InputBuffer.push(message.input);
                break;
            case "ready":
                this.handleReadyMessage(message.ready_status);
                break;
            case "start":
                let scope = this;
                sleep(1500).then(() => {
                    scope.startOnlineGame(message);
                });
                break;
            case 'end':
                this.end();
                console.log(message.reason);
                break;
        }
    }

    private handleReadyMessage(ready_status: any[]) {
        for (let i = 0; i < 2; i++) {
            const player_status = document.getElementById(`player-${i + 1}-status`);
            if (!player_status) continue;
            (player_status.children[1] as HTMLSpanElement).classList.remove('ready');
            if (i < ready_status.length) {
                const user_id = ready_status[i][0];
                const is_ready = ready_status[i][1];
                if (user_id === this.userId) {
                    (player_status.children[0] as HTMLSpanElement).innerText = "Player " + (i + 1) + " (You)";
                } else {
                    (player_status.children[0] as HTMLSpanElement).innerText = "Player " + (i + 1);
                }
                (player_status.children[1] as HTMLSpanElement).innerText = is_ready ? 'Ready' : 'Not Ready';
                if (is_ready) {
                    (player_status.children[1] as HTMLSpanElement).classList.add('ready');
                }
            } else {
                (player_status.children[0] as HTMLSpanElement).innerText = "Player " + (i + 1);
                (player_status.children[1] as HTMLSpanElement).innerText = 'Waiting...';
            }
        }
    }

    public async collectInput(): Promise<void> {
        if (this.localPlayer) {
            const input = this.localPlayer.getOnlineInputState();
            const message = {
                type: "input",
                input: InputSerializer.serialize(input)
            }
            this.socket?.send(JSON.stringify(message));
        }
    }

    public async connectToRoom(room_id: string): Promise<void> {
        const hostName = window.location.hostname;
        const wsPath = 'ws://' + hostName + ':' + Config.websocketPort;
        const socket = new WebSocket(wsPath);
        this.socket = socket;

        await new Promise((resolve: (value: void) => void) => {
            socket.onopen = () => {
                resolve();
            }
        });
        socket.onmessage = (event) => {
            this.handleMessages(event.data);
        }
        socket.send(JSON.stringify({ user_id: this.userId, room_id: room_id }));
        socket.send(JSON.stringify({ type: 'ready', ready: false }));

        console.log('Connected to room', room_id);
        const roomIdSpan = document.getElementById('room-id');
        if (roomIdSpan) {
            roomIdSpan.innerText = room_id;
        }

        const roomList = document.getElementById('room-selection');
        if (roomList) {
            roomList.style.display = 'none';
        }
        const roomLobby = document.getElementById('room-lobby');
        if (roomLobby) {
            roomLobby.style.display = 'flex';
        }
    }

    public async startOnlineGame(message: any): Promise<void> {
        this.isOnline = true;
        const roomLobby = document.getElementById('room-lobby');
        if (roomLobby) {
            roomLobby.style.display = 'none';
        }
        document.body.style.cursor = 'none';

        const playerId = message.playerId;
        const playerList = Array.from(this.playerMap.values());
        for (let i = 0; i < playerList.length; i++) {
            playerList[i].isLocalPlayer = false;
            playerList[i].playerId = i;
        }
        playerList[playerId].isLocalPlayer = true;
        this.localPlayer = playerList[playerId];
        console.log(`Player ${playerId} connected`);

        this.inputManager.gameStarted = true;
        this.inputManager.updatePlayers();

        // Initialize sounds for players and NPCs
        this.playerMap.forEach(player => player.initializeSound());
        this.npcPlaneMap.forEach(npc => npc.initializeSound());

        console.log('Start online game loop');

        setInterval(this.collectInput.bind(this), 1000 / 90);

        this.loop();
    }

    public async joinRoom(room_id: string): Promise<void> {
        // deprecated!!!
        fetch(`http://localhost:17130/join_room`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: this.userId,
                room_id: room_id
            })
        }).then(response => response.json()).then(data => {
            console.log(data);
            this.connectToRoom(room_id);
        });
    }

    public async startOnline(): Promise<void> {
        // only for debug purpose
        // deprecated!!!
        this.isOnline = true;
        fetch('http://localhost:17130/room_info', {
            method: 'GET',
        }).then(response => response.json()).then(data => {
            console.log(data);
            if (data.length > 0) {
                this.joinRoom(data[0].room_id);
            } else {
                fetch('http://localhost:17130/create_room', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: this.userId
                    })
                }).then(response => response.json()).then(data => {
                    console.log(data)
                    this.connectToRoom(data.room_id);
                });
            }
        });
    }

    public async ready() {
        await this.waitForEntitiesToBeReady();
        await this.waitForSoundToBeReady();
    }

    private async waitForEntitiesToBeReady(): Promise<void> {
        return new Promise((resolve) => {
            const checkReady = () => {
                const allEntitiesReady = Array.from(this.entityMap.values()).every(entity => entity.ready);

                if (allEntitiesReady) {
                    console.log('All entities ready. Proceeding.');
                    resolve();
                } else {
                    // Continue checking
                    requestAnimationFrame(checkReady);
                }
            };

            checkReady();
        });
    }

    private async waitForSoundToBeReady(): Promise<void> {
        return new Promise((resolve) => {
            const checkReady = () => {
                const soundReady = this.soundManager.ready;

                if (soundReady) {
                    console.log('Sound ready. Starting game.');
                    resolve();
                } else {
                    // Continue checking
                    requestAnimationFrame(checkReady);
                }
            };

            checkReady();
        });
    }

    private async loop(): Promise<void> {
        while (this.isRunning) {
            this.loopOnce();
            await nextFrame();
        }
    }

    private updateFPS(): void {
        if (this.lastFrameTime === 0)
            this.lastFrameTime = performance.now();
        this.frameCount++;
        if (this.frameCount >= 30 || (this.frameCount >= 4 && performance.now() - this.lastFrameTime >= 2000)) {
            const fps = this.frameCount / ((performance.now() - this.lastFrameTime) / 1000);
            this.frameCount = 0;
            this.lastFrameTime = performance.now();
            const fpsDisplay = document.getElementById('fps-display');
            if (fpsDisplay) {
                fpsDisplay.innerText = `FPS: ${Math.round(fps)}`;
            }
        }
    }

    private renderToScreen(): void {
        // Filter local players
        const localPlayers = Array.from(this.playerMap.values()).filter(player => player.isLocalPlayer);
        const playerCameras = this.cameraManager.cameras;

        localPlayers.forEach((player, index) => {
            const camera = playerCameras.get(player);
            if (camera) {
                const viewport = this.cameraManager.getViewportForPlayer(player)

                this.sceneManager.renderCamera(camera, viewport.left, viewport.top, viewport.width, viewport.height);
            }
        });
    }

    private loopOnce(): void {
        if (!this.isRunning) return; // Stop the loop if the game is over

        if (this.isOnline) {
            this.onlineUpdate();
            this.cameraManager.update(0); // Update the local player's camera
        } else {
            const deltaTime = this.clock.getDelta();
            this.update(deltaTime);
        }

        this.postLoopHooks.forEach(hook => hook(this));

        this.renderToScreen();
    }

    private onlineUpdate() {
        if (this.InputBuffer.length === 0) return;
        while (this.InputBuffer.length > 3) {
            const input = this.InputBuffer.shift();
            const deltaTime = 1 / 60;
            this.update(deltaTime, input);
        }
        const delta = performance.now() - this.lastFrameTime;
        if (delta < 120) return;
        if (delta < 150 && this.InputBuffer.length < 2) return;
        const input = this.InputBuffer.shift();
        const deltaTime = 1 / 60;
        this.update(deltaTime, input);
    }


    private update(deltaTime: number, input?: any[]): void {
        if (input) {
            this.entityMap.forEach((entity) => {
                if (entity instanceof Player) {
                    entity.update(deltaTime, InputSerializer.deserialize(input[entity.playerId]));
                } else {
                    entity.update(deltaTime);
                }
            })
        } else {
            this.entityMap.forEach(entity =>{{entity.update(deltaTime)}});
        }

        // Update camera positions and orientations based on player inputs
        this.cameraManager.update(deltaTime);

        // Check collisions
        this.collisionManager.update(deltaTime);

        // Update the scene
        this.sceneManager.update(deltaTime);

        if (this.playerMap.size === 0) {
            this.end();
        }

        // After rendering all cameras, update and render HUD
        this.hudManager.update(deltaTime);

        this.updateFPS();

        this.curTick++;
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

    public isGameOnline(): boolean {
        return this.isOnline ? true : false;
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
        if (this.sceneManager) {
            this.sceneManager.dispose();
        }

        if (this.soundManager) {
            this.soundManager.dispose();
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

        this.localPlayer = undefined;
        this.socket?.close();
        this.socket = undefined;
        this.InputBuffer = [];
    }
}
