// src/Managers/HUDManager.ts

import * as THREE from 'three';
import { Player } from '../Entities/Player';
import { CameraManager } from './CameraManager';
import { Weapon } from '../Core/Weapon';

interface Viewport {
    left: number;
    bottom: number;
    width: number;
    height: number;
}

export class HUDManager {
    private players: Player[];
    private cameraManager: CameraManager;
    private renderer: THREE.WebGLRenderer;
    private domElements: Map<Player, HTMLDivElement>;

    constructor(players: Player[], cameraManager: CameraManager, renderer: THREE.WebGLRenderer) {
        this.players = players;
        this.cameraManager = cameraManager;
        this.renderer = renderer;
        this.domElements = new Map();

        // Initialize HUD elements for each player
        this.players.forEach((player) => {
            const hudElement = this.createHUDElementForPlayer(player);
            document.body.appendChild(hudElement);
            this.domElements.set(player, hudElement);
        });
    }

    private createHUDElementForPlayer(player: Player): HTMLDivElement {
        const hudContainer = document.createElement('div');
        hudContainer.classList.add('hud-container');

        // Create elements for HP and missiles
        const hpElement = document.createElement('div');
        hpElement.classList.add('hp-display');
        hudContainer.appendChild(hpElement);

        const missileElement = document.createElement('div');
        missileElement.classList.add('missile-display');
        hudContainer.appendChild(missileElement);

        // Store references to these elements in the hudContainer
        (hudContainer as any).hpElement = hpElement;
        (hudContainer as any).missileElement = missileElement;

        // Initial content
        hpElement.textContent = `HP: ${player.currentHP} / ${player.property.hp}`;
        missileElement.textContent = `Missiles: ${this.getTotalMissiles(player)}`;

        // Style the HUD container
        hudContainer.style.position = 'absolute';
        hudContainer.style.pointerEvents = 'none'; // So it doesn't block mouse events
        hudContainer.style.color = 'white';
        hudContainer.style.fontFamily = 'Arial, sans-serif';
        hudContainer.style.fontSize = '16px';
        hudContainer.style.textShadow = '1px 1px 2px black';

        return hudContainer;
    }

    public update(deltaTime: number): void {
        this.players.forEach((player) => {
            const hudElement = this.domElements.get(player);
            if (!hudElement) return;

            // Update HP display
            const hp = player.currentHP;
            const maxHP = player.property.hp;
            const hpDisplay = (hudElement as any).hpElement as HTMLDivElement;
            if (hpDisplay) {
                hpDisplay.textContent = `HP: ${Math.round(hp)} / ${maxHP}`;
            }

            // Update missiles display
            const totalMissiles = this.getTotalMissiles(player);
            const missileDisplay = (hudElement as any).missileElement as HTMLDivElement;
            if (missileDisplay) {
                missileDisplay.textContent = `Missiles: ${totalMissiles}`;
            }
        });
    }

    public render(): void {
        // Position HUD elements over the correct viewport
        this.players.forEach((player) => {
            const hudElement = this.domElements.get(player);
            if (!hudElement) return;

            // Get viewport dimensions from CameraManager
            const viewport = this.cameraManager.getViewportForPlayer(player);

            // Position the HUD element using CSS
            hudElement.style.left = `${viewport.left}px`;
            hudElement.style.top = `${viewport.top}px`;
            hudElement.style.width = `${viewport.width}px`;
            hudElement.style.height = `${viewport.height}px`;

            // Optionally, position HUD elements inside the container
            const hpDisplay = (hudElement as any).hpElement as HTMLDivElement;
            const missileDisplay = (hudElement as any).missileElement as HTMLDivElement;

            if (hpDisplay) {
                hpDisplay.style.position = 'absolute';
                hpDisplay.style.left = '10px';
                hpDisplay.style.top = '10px';
            }

            if (missileDisplay) {
                missileDisplay.style.position = 'absolute';
                missileDisplay.style.left = '10px';
                missileDisplay.style.top = '30px';
            }
        });
    }

    private getTotalMissiles(player: Player): number {
        let totalMissiles = 0;
        for (const weapon of player.weapons) {
            totalMissiles += weapon.property.totalNumber - weapon.totalMissilesFired;
        }
        return totalMissiles;
    }
}
