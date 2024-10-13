// src/Managers/SoundManager.ts

import * as THREE from 'three';
import { SoundPaths, SoundEnum } from '../Enums/SoundPaths';
import { Player } from '../Entities/Player';

export class SoundManager {
    private listener: THREE.AudioListener;
    private sounds: Map<SoundEnum, THREE.Audio>;
    private player: Player;

    constructor(camera: THREE.Camera, assetsPath: string, player: Player) {
        this.listener = new THREE.AudioListener();
        camera.add(this.listener);
        this.sounds = new Map<SoundEnum, THREE.Audio>();
        this.player = player;

        // Load sounds during initialization
        this.loadSounds(assetsPath);
    }

    private loadSounds(assetsPath: string): void {
        const audioLoader = new THREE.AudioLoader();

        // Get all sound keys from SoundPaths
        const soundKeys = Object.keys(SoundPaths) as SoundEnum[];

        soundKeys.forEach((soundKey) => {
            const soundPath = `${assetsPath}${SoundPaths[soundKey]}`;
            const sound = new THREE.Audio(this.listener);

            audioLoader.load(
                soundPath,
                (buffer) => {
                    sound.setBuffer(buffer);
                    this.sounds.set(soundKey, sound);
                },
                undefined,
                (err) => {
                    console.error(`Failed to load sound: ${soundKey}`, err);
                }
            );
        });
    }

    public playSound(
        name: SoundEnum,
        loop: boolean = false,
        volume: number = 1
    ): void {
        const sound = this.sounds.get(name);
        if (sound && !sound.isPlaying) {
            sound.setLoop(loop);
            sound.setVolume(volume);
            sound.play();
        }
    }

    public stopSound(name: SoundEnum): void {
        const sound = this.sounds.get(name);
        if (sound && sound.isPlaying) {
            sound.stop();
        }
    }

    public setVolume(name: SoundEnum, volume: number): void {
        const sound = this.sounds.get(name);
        if (sound) {
            sound.setVolume(volume);
        }
    }

    public dispose(): void {
        // Dispose of sounds
        this.sounds.forEach((sound) => {
            if (sound.isPlaying) sound.stop();
            sound.disconnect();
        });
        this.sounds.clear();
    }

    public updateSounds(): void {
        // Example: Adjust engine sound volume based on player speed
        const speed = this.player.velocity.length();
        const maxSpeed = 10; // Define your max speed
        const volume = THREE.MathUtils.clamp(speed / maxSpeed, 0, 1);
        this.setVolume('engine', volume);
    }
}
