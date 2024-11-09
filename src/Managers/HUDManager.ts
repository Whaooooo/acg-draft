import * as THREE from 'three';
import { Player } from '../Entities/Player';
import { CameraManager } from './CameraManager';
import { Weapon } from '../Core/Weapon';
import { Game } from '../Game';
import { Entity } from '../Core/Entity';
import { Missile } from '../Entities/Missile';

export class HUDManager {
    private game: Game;
    private cameraManager: CameraManager;
    private domElements: Map<Player, {
        hudElement: HTMLDivElement;
        hudOverlay: HTMLDivElement;
        svgOverlay: SVGSVGElement;
    }>;

    // HUD dimensions
    private hudWidth: number = 400;  // Adjust as needed
    private hudHeight: number = 300; // Adjust as needed

    private lastFrameTime: number = 0;
    private frameCount: number = 0;

    constructor(game: Game) {
        this.game = game;
        this.cameraManager = game.cameraManager;
        this.domElements = new Map();
    }

    /**
     * Updates the HUD, refreshing all HUD elements.
     */
    public update(deltaTime: number): void {
        // Get the current list of local players
        const currentPlayers = Array.from(this.game.playerMap.values()).filter(player => player.isLocalPlayer);

        // Check for added or removed players
        const playersAdded = currentPlayers.filter(p => !this.domElements.has(p));
        const playersRemoved = Array.from(this.domElements.keys()).filter(p => !currentPlayers.includes(p));

        // Dispose HUD elements of removed players
        playersRemoved.forEach(player => {
            const elements = this.domElements.get(player);
            if (elements) {
                const { hudElement, hudOverlay, svgOverlay } = elements;
                if (hudElement && hudElement.parentNode) {
                    hudElement.parentNode.removeChild(hudElement);
                }
                if (hudOverlay && hudOverlay.parentNode) {
                    hudOverlay.parentNode.removeChild(hudOverlay);
                }
                if (svgOverlay && svgOverlay.parentNode) {
                    svgOverlay.parentNode.removeChild(svgOverlay);
                }
                this.domElements.delete(player);
            }
        });

        // Create HUD elements for newly added players
        playersAdded.forEach(player => {
            const elements = this.createHUDElementForPlayer(player);
            document.body.appendChild(elements.hudElement);
            document.body.appendChild(elements.hudOverlay);
            document.body.appendChild(elements.svgOverlay);
            this.domElements.set(player, elements);
        });

        // Update HUD elements for all current players
        currentPlayers.forEach(player => {
            this.updateHUDElementForPlayer(player);
        });

        // Update FPS display
        this.updateFPSDisplay();

        // Render the HUD
        this.render();
    }

    /**
     * Creates HUD element for a player.
     */
    private createHUDElementForPlayer(player: Player): {
        hudElement: HTMLDivElement;
        hudOverlay: HTMLDivElement;
        svgOverlay: SVGSVGElement;
    } {
        const hudContainer = document.createElement('div');
        hudContainer.classList.add('hud-container');

        hudContainer.style.width = `${this.hudWidth}px`;
        hudContainer.style.height = `${this.hudHeight}px`;
        hudContainer.style.position = 'absolute';
        hudContainer.style.pointerEvents = 'none'; // Make it non-interactive

        // Create health bar container
        const hpBarContainer = document.createElement('div');
        hpBarContainer.classList.add('hp-bar-container');
        hudContainer.appendChild(hpBarContainer);

        // Create health bar
        const hpBar = document.createElement('div');
        hpBar.classList.add('hp-bar');
        hpBarContainer.appendChild(hpBar);

        // Create health text
        const hpText = document.createElement('div');
        hpText.classList.add('hp-text');
        hpBarContainer.appendChild(hpText);

        // Create upper container (above the health bar)
        const upperContainer = document.createElement('div');
        upperContainer.classList.add('upper-container');
        hudContainer.appendChild(upperContainer);

        // Left side: reload status of selected weapon
        const reloadContainer = document.createElement('div');
        reloadContainer.classList.add('reload-container');
        upperContainer.appendChild(reloadContainer);

        // Right side: weapon list
        const weaponListContainer = document.createElement('div');
        weaponListContainer.classList.add('weapon-list-container');
        upperContainer.appendChild(weaponListContainer);

        // Store references to dynamically updated elements
        hudContainer.dataset.playerId = player.entityId.toString();

        // Store elements for future updates
        (hudContainer as any).hpBar = hpBar;
        (hudContainer as any).hpText = hpText;
        (hudContainer as any).reloadContainer = reloadContainer;
        (hudContainer as any).weaponListContainer = weaponListContainer;

        // Create per-player HUD Overlay
        const hudOverlay = document.createElement('div');
        hudOverlay.classList.add('hud-overlay');
        hudOverlay.style.position = 'absolute';
        hudOverlay.style.top = '0';
        hudOverlay.style.left = '0';
        hudOverlay.style.width = '100%';
        hudOverlay.style.height = '100%';
        hudOverlay.style.pointerEvents = 'none';
        hudOverlay.style.zIndex = '15'; // Adjust as needed

        // Create per-player SVG Overlay
        const svgOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgOverlay.setAttribute('class', 'svg-overlay');
        svgOverlay.setAttribute('width', '100%');
        svgOverlay.setAttribute('height', '100%');
        svgOverlay.style.position = 'absolute';
        svgOverlay.style.top = '0';
        svgOverlay.style.left = '0';
        svgOverlay.style.pointerEvents = 'none';
        svgOverlay.style.zIndex = '16'; // Above HUD overlay

        return { hudElement: hudContainer, hudOverlay, svgOverlay };
    }

    /**
     * Updates the HUD element for a player.
     */
    private updateHUDElementForPlayer(player: Player): void {
        const elements = this.domElements.get(player);
        if (!elements) return;

        const { hudElement, hudOverlay, svgOverlay } = elements;

        const hpBar = (hudElement as any).hpBar as HTMLDivElement;
        const hpText = (hudElement as any).hpText as HTMLDivElement;
        const reloadContainer = (hudElement as any).reloadContainer as HTMLDivElement;
        const weaponListContainer = (hudElement as any).weaponListContainer as HTMLDivElement;

        // Update health bar
        const hp = Math.max(0, player.currentHP);
        const maxHP = player.property.hp;
        const hpPercentage = (hp / maxHP) * 100;
        hpBar.style.width = `${hpPercentage}%`;
        hpText.textContent = `${Math.round(hp)} / ${maxHP}`;

        // Update reload status of selected weapon
        this.updateReloadContainer(reloadContainer, player);

        // Update weapon list
        this.updateWeaponListContainer(weaponListContainer, player);

        // Update target indicators
        this.updateTargetIndicators(player, hudOverlay, svgOverlay);
    }

    /**
     * Updates the reload container with the selected weapon's reload status.
     */
    private updateReloadContainer(container: HTMLDivElement, player: Player): void {
        // Clear previous reload bars
        container.innerHTML = '';

        const selectedWeapon = player.weapons[player.selectedWeaponIndex];
        const loadNumber = selectedWeapon.property.loadNumber;

        for (let i = 0; i < loadNumber; i++) {
            const bar = document.createElement('div');
            bar.classList.add('reload-bar');
            container.appendChild(bar);

            const missilesRemaining = selectedWeapon.property.totalNumber - selectedWeapon.totalMissilesFired;
            if (i >= missilesRemaining) {
                // No missiles left, slot is empty
                bar.style.backgroundColor = 'gray';
                bar.style.height = `100%`;
            } else {
                const loadTimer = selectedWeapon.loadTimers[i];
                if (loadTimer <= 0) {
                    // Slot is loaded
                    bar.style.backgroundColor = '#00ff00'; // Green
                    bar.style.height = `100%`;
                } else {
                    // Slot is loading
                    const loadPercentage = Math.max(0, Math.min(1, (selectedWeapon.property.loadTime - loadTimer) / selectedWeapon.property.loadTime));
                    bar.style.backgroundColor = '#ffff00'; // Yellow
                    bar.style.height = `${loadPercentage * 100}%`;
                }
            }
        }
    }

    /**
     * Updates the weapon list container with the player's weapons.
     */
    private updateWeaponListContainer(container: HTMLDivElement, player: Player): void {
        // Clear previous weapon entries
        container.innerHTML = '';

        player.weapons.forEach((weapon, index) => {
            const weaponEntry = document.createElement('div');
            weaponEntry.classList.add('weapon-entry');

            // Weapon name
            const weaponNameElement = document.createElement('div');
            weaponNameElement.classList.add('weapon-name');
            const weaponName = this.extractWeaponName(weapon.name);
            weaponNameElement.textContent = (index === player.selectedWeaponIndex ? '>' : '') + weaponName;
            weaponEntry.appendChild(weaponNameElement);

            // Remaining count
            const weaponCountElement = document.createElement('div');
            weaponCountElement.classList.add('weapon-count');
            weaponCountElement.textContent = this.getWeaponRemainingCount(weapon).toString();
            weaponEntry.appendChild(weaponCountElement);

            // Mini reload indicator container
            const miniReloadContainer = document.createElement('div');
            miniReloadContainer.classList.add('mini-reload-container');
            weaponEntry.appendChild(miniReloadContainer);

            // Create mini reload bars
            for (let i = 0; i < weapon.property.loadNumber; i++) {
                const miniBar = document.createElement('div');
                miniBar.classList.add('mini-reload-bar');
                miniReloadContainer.appendChild(miniBar);

                const missilesRemaining = weapon.property.totalNumber - weapon.totalMissilesFired;
                if (i >= missilesRemaining) {
                    // No missiles left, slot is empty
                    miniBar.style.backgroundColor = 'gray';
                    miniBar.style.height = `100%`;
                } else {
                    const loadTimer = weapon.loadTimers[i];
                    if (loadTimer <= 0) {
                        // Slot is loaded
                        miniBar.style.backgroundColor = '#00ff00'; // Green
                        miniBar.style.height = `100%`;
                    } else {
                        // Slot is loading
                        const loadPercentage = Math.max(0, Math.min(1, (weapon.property.loadTime - loadTimer) / weapon.property.loadTime));
                        miniBar.style.backgroundColor = '#ffff00'; // Yellow
                        miniBar.style.height = `${loadPercentage * 100}%`;
                    }
                }
            }

            container.appendChild(weaponEntry);
        });
    }

    /**
     * Updates the target indicators for the player.
     */
    private updateTargetIndicators(
        player: Player,
        hudOverlay: HTMLDivElement,
        svgOverlay: SVGSVGElement
    ): void {
        // Remove previous target and missile indicators
        const existingIndicators = hudOverlay.querySelectorAll('.target-indicator, .missile-indicator');
        existingIndicators.forEach(indicator => indicator.remove());

        // Clear previous SVG elements (lines)
        while (svgOverlay.firstChild) {
            svgOverlay.removeChild(svgOverlay.firstChild);
        }

        const weapon = player.weapons[player.selectedWeaponIndex];
        const potentialTargets = weapon.potentialTargets;
        const lockedOnTargets = weapon.lockedOnTargets;

        const camera = this.cameraManager.cameras.get(player);
        if (!camera) return;

        const viewport = this.cameraManager.getViewportForPlayer(player);
        const width = viewport.width;
        const height = viewport.height;

        // Screen center relative to hudOverlay (no need to add cameraLeft and cameraTop)
        const screenCenterX = width / 2;
        const screenCenterY = height / 2;

        // Highest priority target
        const highestPriorityTarget = potentialTargets[0];

        // Flag to check if highest priority target is off-screen
        let highestPriorityOffScreen = false;

        // Iterate over all entities in the game
        this.game.entityMap.forEach((entity) => {
            if (entity === player) return; // Exclude the player himself

            // Get entity position in world coordinates
            const entityPosition = entity.getPosition();

            // Project entity position to Normalized Device Coordinates (NDC)
            const ndc = entityPosition.clone().project(camera);

            // Check if the entity is within the camera's frustum (NDC range)
            const isInFrustum = ndc.x >= -1 && ndc.x <= 1 && ndc.y >= -1 && ndc.y <= 1 && ndc.z >= -1 && ndc.z <= 1;

            // Convert NDC to screen coordinates relative to hudOverlay
            const x = (ndc.x * 0.5 + 0.5) * width;
            const y = (-ndc.y * 0.5 + 0.5) * height;

            // Calculate distance between player and entity
            const distance = entityPosition.distanceTo(player.getPosition());

            if (entity instanceof Missile) {
                if (!isInFrustum) return; // Only show missile indicators for missiles in view

                // Create Missile Indicator
                const missileIndicator = document.createElement('div');
                missileIndicator.classList.add('missile-indicator');
                missileIndicator.style.left = `${x}px`;
                missileIndicator.style.top = `${y}px`;

                // Determine color based on alliance
                const isAlly = (entity.iFFNumber === player.iFFNumber);
                const color = isAlly ? 'darkblue' : 'lightgreen';

                // Clip distance to range [100, 10000] for size calculation
                const minDistance = 100;
                const maxDistance = 10000;
                const clippedDistance = Math.max(minDistance, Math.min(maxDistance, distance));

                // Calculate size based on logarithmic distance scaling
                const minDiameter = 5;
                const maxDiameter = 20;
                const logMin = Math.log(minDistance);
                const logMax = Math.log(maxDistance);
                const logDistance = Math.log(clippedDistance);

                const sizeRatio = (logDistance - logMin) / (logMax - logMin);
                const diameter = minDiameter + (maxDiameter - minDiameter) * (1 - sizeRatio); // Closer missiles are larger

                // Apply styles to Missile Indicator
                missileIndicator.style.width = `${diameter}px`;
                missileIndicator.style.height = `${diameter}px`;
                missileIndicator.style.marginLeft = `${-diameter / 2}px`; // Center the circle
                missileIndicator.style.marginTop = `${-diameter / 2}px`;
                missileIndicator.style.borderColor = color;

                // Append Missile Indicator to hudOverlay
                hudOverlay.appendChild(missileIndicator);

            } else if (entity.iFFNumber >= 0) {
                // Handle other entities with iFFNumber >= 0 (excluding the player himself)
                const isHighestPriority = (entity === highestPriorityTarget);

                if (isInFrustum) {
                    // Ensure x and y are within screen bounds
                    if (x < 0 || x > width || y < 0 || y > height) return;

                    // Create Target Indicator
                    const indicator = document.createElement('div');
                    indicator.classList.add('target-indicator');
                    indicator.style.left = `${x - 25}px`; // Center the indicator
                    indicator.style.top = `${y - 25}px`;

                    // Determine colors based on alliance and lock status
                    const isAlly = (entity.iFFNumber === player.iFFNumber);
                    const isLockedOn = lockedOnTargets.includes(entity);
                    const isInPotentialTargets = potentialTargets.includes(entity);

                    let squareColor = '';
                    let fontColor = isAlly ? 'blue' : 'green';

                    if (isAlly) {
                        squareColor = 'lightblue';
                    } else if (isHighestPriority) {
                        squareColor = isLockedOn ? 'darkred' : 'darkgreen';
                    } else if (isLockedOn) {
                        squareColor = 'lightred';
                    } else if (isInPotentialTargets) {
                        squareColor = 'lightgreen';
                    } else {
                        // Skip non-potential enemy targets
                        return;
                    }

                    // Apply styles to Target Indicator
                    indicator.style.borderColor = squareColor;
                    indicator.style.color = fontColor;

                    // Add extra smaller square for highest priority target
                    if (isHighestPriority) {
                        const extraIndicator = document.createElement('div');
                        extraIndicator.classList.add('highest-priority-indicator');
                        extraIndicator.style.borderColor = squareColor;
                        indicator.appendChild(extraIndicator);
                    }

                    // Display entity name at the upper right corner
                    const nameLabel = document.createElement('div');
                    nameLabel.classList.add('indicator-name');
                    nameLabel.textContent = entity.assetName;
                    indicator.appendChild(nameLabel);

                    // Display distance at the lower right corner
                    const distanceLabel = document.createElement('div');
                    distanceLabel.classList.add('indicator-distance');
                    distanceLabel.textContent = `${distance.toFixed(0)}`;
                    indicator.appendChild(distanceLabel);

                    // Append Target Indicator to hudOverlay
                    hudOverlay.appendChild(indicator);

                } else if (isHighestPriority) {
                    // Handle off-screen highest priority target
                    highestPriorityOffScreen = true;

                    // Calculate angle between camera's z-axis and vector to target
                    const cameraBack = new THREE.Vector3(0, 0, 1).applyQuaternion(camera.quaternion);
                    const toTarget = entityPosition.clone().sub(camera.position).normalize();

                    const angleBetween = Math.acos(cameraBack.dot(toTarget));

                    // Calculate 2D screen angle (azimuth) for placement around circle
                    const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
                    const cameraUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
                    let screenAngle = Math.atan2(toTarget.dot(cameraUp), toTarget.dot(cameraRight));

                    // Ensure angle is between 0 and 2π
                    if (screenAngle < 0) screenAngle += 2 * Math.PI;

                    // Distance from center
                    const distanceFromCenter = Math.cos(angleBetween) * 150 + 150;

                    const posX = screenCenterX + distanceFromCenter * Math.cos(screenAngle);
                    const posY = screenCenterY - distanceFromCenter * Math.sin(screenAngle); // Subtract because screen Y increases downward

                    // Create central deep green square
                    const centerSquare = document.createElement('div');
                    centerSquare.classList.add('center-square');
                    centerSquare.style.left = `${screenCenterX - 20}px`; // Center the square
                    centerSquare.style.top = `${screenCenterY - 20}px`;
                    hudOverlay.appendChild(centerSquare);

                    // Draw lines from square's vertices to the indicator point
                    const squareSize = 40;
                    const squareVertices = [
                        { x: screenCenterX - squareSize / 2, y: screenCenterY - squareSize / 2 }, // Top-left
                        { x: screenCenterX + squareSize / 2, y: screenCenterY - squareSize / 2 }, // Top-right
                        { x: screenCenterX + squareSize / 2, y: screenCenterY + squareSize / 2 }, // Bottom-right
                        { x: screenCenterX - squareSize / 2, y: screenCenterY + squareSize / 2 }, // Bottom-left
                    ];

                    // Draw lines using SVG in per-player svgOverlay
                    squareVertices.forEach(vertex => {
                        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                        line.setAttribute('x1', `${vertex.x}`);
                        line.setAttribute('y1', `${vertex.y}`);
                        line.setAttribute('x2', `${posX}`);
                        line.setAttribute('y2', `${posY}`);
                        line.setAttribute('stroke', 'darkgreen');
                        line.setAttribute('stroke-width', '2');
                        svgOverlay.appendChild(line);
                    });
                }
            }

            if (!highestPriorityOffScreen) {
                // Remove any existing center square if highest priority target is on-screen
                const existingCenterSquare = hudOverlay.querySelector('.center-square');
                if (existingCenterSquare) {
                    existingCenterSquare.remove();
                }
            }
        })
    }

        /**
     * Updates the FPS display.
     */
    private updateFPSDisplay(): void {
        if (this.lastFrameTime === 0) {
            this.lastFrameTime = performance.now();
        }

        this.frameCount++;
        const now = performance.now();

        if (this.frameCount >= 30 || (this.frameCount >= 4 && now - this.lastFrameTime >= 2000)) {
            const fps = this.frameCount / ((now - this.lastFrameTime) / 1000);
            this.frameCount = 0;
            this.lastFrameTime = now;

            let fpsDisplay = document.getElementById('fps-display');
            if (!fpsDisplay) {
                fpsDisplay = document.createElement('div');
                fpsDisplay.id = 'fps-display';
                document.body.appendChild(fpsDisplay);
            }
            fpsDisplay.innerText = `FPS: ${Math.round(fps)}`;
        }
    }

    /**
     * Renders the HUD by adjusting positions based on viewport.
     */
    public render(): void {
        // Adjust HUD element positions based on viewport
        this.domElements.forEach((elements, player) => {
            const { hudElement, hudOverlay, svgOverlay } = elements;

            // Get viewport dimensions from CameraManager
            const viewport = this.cameraManager.getViewportForPlayer(player);

            // Position and size the hudElement (for health bar and weapon status)
            hudElement.style.left = `${viewport.left + viewport.width - this.hudWidth - 20}px`; // Adjust margins as needed
            hudElement.style.top = `${viewport.top + viewport.height - this.hudHeight - 20}px`;
            hudElement.style.width = `${this.hudWidth}px`;
            hudElement.style.height = `${this.hudHeight}px`;

            // Position and size the hudOverlay and svgOverlay to cover the player's viewport
            hudOverlay.style.left = `${viewport.left}px`;
            hudOverlay.style.top = `${viewport.top}px`;
            hudOverlay.style.width = `${viewport.width}px`;
            hudOverlay.style.height = `${viewport.height}px`;

            svgOverlay.style.left = `${viewport.left}px`;
            svgOverlay.style.top = `${viewport.top}px`;
            svgOverlay.style.width = `${viewport.width}px`;
            svgOverlay.style.height = `${viewport.height}px`;
        });
    }

    /**
     * Extracts the weapon name from the full name.
     */
    private extractWeaponName(fullName: string): string {
        const parts = fullName.split('_');
        const name = parts[parts.length - 1];
        return name.toUpperCase();
    }

    /**
     * Calculates the remaining count of a weapon.
     */
    private getWeaponRemainingCount(weapon: Weapon): number {
        return weapon.property.totalNumber - weapon.totalMissilesFired;
    }

    /**
     * Disposes of the HUD elements.
     */
    public dispose(): void {
        // Remove HUD elements from the DOM
        this.domElements.forEach(({ hudElement, hudOverlay, svgOverlay }) => {
            if (hudElement.parentNode) {
                hudElement.parentNode.removeChild(hudElement);
            }
            if (hudOverlay.parentNode) {
                hudOverlay.parentNode.removeChild(hudOverlay);
            }
            if (svgOverlay.parentNode) {
                svgOverlay.parentNode.removeChild(svgOverlay);
            }
        });
        // Clear the map
        this.domElements.clear();
    }
}
