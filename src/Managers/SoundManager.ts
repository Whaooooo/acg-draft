// src/Managers/SoundManager.ts

import * as THREE from 'three';
import { SoundPaths, SoundEnum } from '../Configs/SoundPaths';
import { Config } from '../Configs/Config';
import { Player } from '../Entities/Player';
import { Entity } from '../Core/Entity';
import {property} from "three/src/nodes/core/PropertyNode"; // Assuming Entity is a base class/interface for Player and others

export class SoundManager {
    private soundBuffers: Map<SoundEnum, AudioBuffer>;
    private activeSounds: Map<Player, Set<THREE.Audio | THREE.PositionalAudio>>;
    private namedSounds: Map<string, THREE.Audio | THREE.PositionalAudio>;
    private listeners: Map<Player, THREE.AudioListener>;
    private cameras: Map<Player, THREE.Camera>;
    private scene: THREE.Scene;
    public _ready: Map<SoundEnum, boolean> = new Map<SoundEnum, boolean>();

    /**
     * Initializes the SoundManager.
     * @param players - Array of players in the game.
     * @param cameras - Map of players to their respective cameras.
     * @param scene - The THREE.Scene instance to add positional sounds to.
     */
    constructor(players: Player[], cameras: Map<Player, THREE.Camera>, scene: THREE.Scene) {
        this.soundBuffers = new Map<SoundEnum, AudioBuffer>();
        this.activeSounds = new Map<Player, Set<THREE.Audio | THREE.PositionalAudio>>();
        this.namedSounds = new Map<string, THREE.Audio | THREE.PositionalAudio>();
        this.listeners = new Map<Player, THREE.AudioListener>();
        this.cameras = cameras;
        this.scene = scene;
        Object.keys(SoundPaths).forEach(key => {
            this._ready.set(key as SoundEnum, false);
        });

        // Initialize listeners and attach them to cameras
        players.forEach((player) => {
            const camera = cameras.get(player);
            if (camera) {
                const listener = new THREE.AudioListener();
                camera.add(listener);
                this.listeners.set(player, listener);
                this.activeSounds.set(player, new Set());
            } else {
                console.warn(`Camera not found for player ${player.entityId}`);
            }
        });

        this.loadSounds(Config.assetsPath);
    }

    /**
     * Loads all sound buffers based on SoundPaths.
     * @param assetsPath - The base path where sound assets are located.
     */
    private loadSounds(assetsPath: string): void {
        const audioLoader = new THREE.AudioLoader();
        const soundKeys = Object.keys(SoundPaths) as SoundEnum[];

        soundKeys.forEach((soundKey) => {
            const soundPath = `${assetsPath}${SoundPaths[soundKey]}`;

            audioLoader.load(
                soundPath,
                (buffer) => {
                    this.soundBuffers.set(soundKey, buffer);
                    this._ready.set(soundKey, true);
                    console.log(`Loaded sound for ${SoundPaths[soundKey]}`);
                },
                undefined,
                (err) => {
                    console.error(`Failed to load sound: ${soundKey}`, err);
                }
            );
        });
    }

    /**
     * Plays a sound for specified target players.
     * @param soundCreator - The Entity that creates the sound (used to initialize position if not provided).
     * @param name - The SoundEnum representing the sound to play.
     * @param options - Additional options for the sound.
     * @param targetPlayers - The list of players to play the sound for. If undefined, plays for all players.
     * @returns An array of THREE.Audio or THREE.PositionalAudio objects that were created, or null if sound not loaded.
     */
    public playSound(
        soundCreator: Entity | undefined,
        name: SoundEnum,
        options?: {
            loop?: boolean;
            volume?: number;
            position?: THREE.Vector3;
            refDistance?: number;
            maxDistance?: number;
            rolloffFactor?: number;
            autoplay?: boolean;
            soundId?: string;
        },
        targetPlayers?: Player[]
    ): Array<THREE.Audio | THREE.PositionalAudio> | null {
        const buffer = this.soundBuffers.get(name);
        if (!buffer) {
            console.warn(`Sound ${name} not loaded yet.`);
            return null;
        }

        // Determine target players
        const playersToPlay = targetPlayers ? targetPlayers : Array.from(this.cameras.keys());

        // Determine position
        let soundPosition: THREE.Vector3 | undefined;
        if (options?.position) {
            soundPosition = options.position;
        } else if (soundCreator) {
            soundPosition = soundCreator.getPosition();
        } else {
            soundPosition = undefined; // Non-positional sound
        }

        const soundsCreated: Array<THREE.Audio | THREE.PositionalAudio> = [];

        playersToPlay.forEach((player) => {
            const listener = this.listeners.get(player);
            if (!listener) {
                console.warn(`Listener not found for player ${player.entityId}`);
                return;
            }

            let sound: THREE.Audio | THREE.PositionalAudio;

            if (soundPosition) {
                // Positional sound
                sound = new THREE.PositionalAudio(listener);
                sound.position.copy(soundPosition);
                sound.setRefDistance(options?.refDistance ?? 1);
                sound.setMaxDistance(options?.maxDistance ?? 20);
                sound.setRolloffFactor(options?.rolloffFactor ?? 1);
                this.scene.add(sound); // Add positional sound to the scene
            } else {
                // Non-positional sound
                // @ts-ignore
                sound = new THREE.Audio(listener);
            }

            sound.setBuffer(buffer);
            sound.setLoop(options?.loop ?? false);
            sound.setVolume(options?.volume ?? 1);

            if (options?.autoplay !== false) {
                sound.play();
            }

            // Add to activeSounds
            const playerActiveSounds = this.activeSounds.get(player);
            if (playerActiveSounds) {
                playerActiveSounds.add(sound);
            }

            // If soundId is provided, add to namedSounds
            if (options?.soundId) {
                this.namedSounds.set(options.soundId, sound);
            }

            // Collect created sound
            soundsCreated.push(sound);
        });

        return soundsCreated;
    }

    /**
     * Sets the volume of a sound by its unique identifier.
     * @param soundId - The unique identifier of the sound.
     * @param volume - The new volume level (0 to 1).
     */
    public setVolumeById(soundId: string, volume: number): void {
        const sound = this.namedSounds.get(soundId);
        if (sound) {
            sound.setVolume(volume);
        } else {
            console.warn(`Sound with ID '${soundId}' not found.`);
        }
    }

    /**
     * Stops and removes a sound by its unique identifier.
     * @param soundId - The unique identifier of the sound.
     */
    public stopSoundById(soundId: string): void {
        const sound = this.namedSounds.get(soundId);
        if (sound) {
            if (sound.isPlaying) {
                sound.stop();
            }
            this.namedSounds.delete(soundId);
            // Also remove from activeSounds
            this.activeSounds.forEach((soundsSet) => soundsSet.delete(sound));
        } else {
            console.warn(`Sound with ID '${soundId}' not found.`);
        }
    }

    /**
     * Retrieves a sound by its unique identifier.
     * @param soundId - The unique identifier of the sound.
     * @returns The THREE.Audio or THREE.PositionalAudio object if found, else undefined.
     */
    public getSoundById(soundId: string): THREE.Audio | THREE.PositionalAudio | undefined {
        return this.namedSounds.get(soundId);
    }

    /**
     * Updates all active sounds. Typically called once per frame.
     */
    public updateSounds(): void {
    }

    /**
     * Disposes of all sounds and cleans up resources.
     */
    public dispose(): void {
        this.activeSounds.forEach((soundsSet) => {
            soundsSet.forEach((sound) => {
                if (sound.isPlaying) sound.stop();
                sound.disconnect();
                if (sound instanceof THREE.PositionalAudio) {
                    this.scene.remove(sound);
                }
            });
        });
        this.activeSounds.clear();
        this.soundBuffers.clear();
        this.namedSounds.clear();
        this.listeners.forEach((listener) => {
            // It's automatically removed from the camera
        });
        this.listeners.clear();
    }

    get ready(): boolean {
        return Array.from(this._ready.values()).every(item => item);
    }
}
