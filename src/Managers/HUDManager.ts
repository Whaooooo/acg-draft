import * as THREE from 'three';
import { Player } from '../Entities/Player';
import { CameraManager } from './CameraManager';
import { Weapon } from '../Core/Weapon';
import { Game } from '../Game';
import { Entity } from '../Core/Entity';
import { Missile } from '../Entities/Missile';

export class HUDManager {
    private game: Game;
    private players: Player[];
    private cameraManager: CameraManager;
    private domElements: Map<Player, HTMLDivElement>;

    // HUD dimensions
    private hudWidth: number = 400;  // Adjust as needed
    private hudHeight: number = 300; // Adjust as needed

    private lastFrameTime: number = 0;
    private frameCount: number = 0;

    private hudOverlay: HTMLDivElement;
    private svgOverlay: SVGSVGElement; // New SVG overlay for drawing lines

    constructor(game: Game) {
        this.game = game;
        this.players = Array.from(game.playerMap.values()).filter(player => player.isLocalPlayer);
        this.cameraManager = game.cameraManager;
        this.domElements = new Map();

        // Create HUD Overlay
        this.hudOverlay = document.createElement('div');
        this.hudOverlay.id = 'hud-overlay';
        document.body.appendChild(this.hudOverlay);

        // Create SVG Overlay
        this.svgOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svgOverlay.setAttribute('id', 'svg-overlay');
        this.svgOverlay.setAttribute('width', '100%');
        this.svgOverlay.setAttribute('height', '100%');
        this.svgOverlay.style.position = 'absolute';
        this.svgOverlay.style.top = '0';
        this.svgOverlay.style.left = '0';
        this.svgOverlay.style.pointerEvents = 'none';
        this.svgOverlay.style.zIndex = '16'; // Above HUD overlay
        document.body.appendChild(this.svgOverlay);
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
            const hudElement = this.domElements.get(player);
            if (hudElement && hudElement.parentNode) {
                hudElement.parentNode.removeChild(hudElement);
            }
            this.domElements.delete(player);
        });

        // Create HUD elements for newly added players
        playersAdded.forEach(player => {
            const hudElement = this.createHUDElementForPlayer(player);
            document.body.appendChild(hudElement);
            this.domElements.set(player, hudElement);
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
    private createHUDElementForPlayer(player: Player): HTMLDivElement {
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

        return hudContainer;
    }

    /**
     * Updates the HUD element for a player.
     */
    private updateHUDElementForPlayer(player: Player): void {
        const hudElement = this.domElements.get(player);
        if (!hudElement) return;

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
        this.updateTargetIndicators(player);
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
    private updateTargetIndicators(player: Player): void {
        // Remove previous target indicators
        const existingIndicators = this.hudOverlay.querySelectorAll('.target-indicator, .missile-indicator');
        existingIndicators.forEach(indicator => indicator.remove());

        // Clear previous SVG elements
        while (this.svgOverlay.firstChild) {
            this.svgOverlay.removeChild(this.svgOverlay.firstChild);
        }

        const weapon = player.weapons[player.selectedWeaponIndex];

        const potentialTargets = weapon.potentialTargets;
        const lockedOnTargets = weapon.lockedOnTargets;

        const camera = this.cameraManager.cameras.get(player);
        if (!camera) return;

        const viewport = this.cameraManager.getViewportForPlayer(player);

        const width = viewport.width;
        const height = viewport.height;

        const cameraLeft = viewport.left;
        const cameraTop = viewport.top;

        const frustum = new THREE.Frustum();
        const projScreenMatrix = new THREE.Matrix4();
        projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        frustum.setFromProjectionMatrix(projScreenMatrix);

        // Screen center
        const screenCenterX = width / 2 + cameraLeft;
        const screenCenterY = height / 2 + cameraTop;

        // Highest priority target
        const highestPriorityTarget = potentialTargets[0];

        // Flag to check if highest priority target is off-screen
        let highestPriorityOffScreen = false;

        // Iterate over all entities
        this.game.entityMap.forEach((entity) => {
            if (entity === player) return; // Exclude the player himself

            // Get entity position in world coordinates
            const entityPosition = entity.getPosition();

            // Check if the entity is in the camera's frustum
            const isInFrustum = frustum.containsPoint(entityPosition);

            // Project entity position to normalized device coordinates (NDC)
            const ndc = entityPosition.clone().project(camera);

            // Convert NDC to screen coordinates
            const x = (ndc.x * 0.5 + 0.5) * width + cameraLeft;
            const y = (-ndc.y * 0.5 + 0.5) * height + cameraTop;

            // Calculate distance
            const distance = entityPosition.distanceTo(player.getPosition());

            if (entity instanceof Missile) {
                if (!isInFrustum) return;

                // Handle Missile entities
                const missileIndicator = document.createElement('div');
                missileIndicator.classList.add('missile-indicator');
                missileIndicator.style.left = `${x}px`;
                missileIndicator.style.top = `${y}px`;

                // Determine color based on side
                const isAlly = (entity.iFFNumber === player.iFFNumber);
                let color = isAlly ? 'darkblue' : 'lightgreen';

                // Clip distance to range [100, 10000]
                const minDistance = 100;
                const maxDistance = 10000;
                const clippedDistance = Math.max(minDistance, Math.min(maxDistance, distance));

                // Calculate size based on log of distance
                const minDiameter = 5;
                const maxDiameter = 20;
                const logMin = Math.log(minDistance);
                const logMax = Math.log(maxDistance);
                const logDistance = Math.log(clippedDistance);

                const sizeRatio = (logDistance - logMin) / (logMax - logMin);
                const diameter = minDiameter + (maxDiameter - minDiameter) * (1 - sizeRatio); // Invert sizeRatio so closer missiles are bigger

                missileIndicator.style.width = `${diameter}px`;
                missileIndicator.style.height = `${diameter}px`;
                missileIndicator.style.marginLeft = `${-diameter / 2}px`; // Center the circle
                missileIndicator.style.marginTop = `${-diameter / 2}px`;

                missileIndicator.style.borderColor = color;

                // Append to HUD overlay
                this.hudOverlay.appendChild(missileIndicator);

            } else if (entity.iFFNumber >= 0) {
                // Handle other entities with iFFNumber >= 0 (excluding the player himself)
                const isHighestPriority = (entity === highestPriorityTarget);

                if (isInFrustum) {
                    if (entity === player) return;
                    // Ensure x and y are within screen bounds
                    if (x < 0 || x > width || y < 0 || y > height) return;

                    // Create indicator container
                    const indicator = document.createElement('div');
                    indicator.classList.add('target-indicator');
                    indicator.style.left = `${x - 25}px`; // Center the indicator
                    indicator.style.top = `${y - 25}px`;

                    // Determine colors
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

                    // Apply styles
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

                    // Append to HUD overlay
                    this.hudOverlay.appendChild(indicator);

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
                    this.hudOverlay.appendChild(centerSquare);

                    // Draw lines from square's vertices to the point
                    const squareSize = 40;
                    const squareVertices = [
                        { x: screenCenterX - squareSize / 2, y: screenCenterY - squareSize / 2 }, // Top-left
                        { x: screenCenterX + squareSize / 2, y: screenCenterY - squareSize / 2 }, // Top-right
                        { x: screenCenterX + squareSize / 2, y: screenCenterY + squareSize / 2 }, // Bottom-right
                        { x: screenCenterX - squareSize / 2, y: screenCenterY + squareSize / 2 }, // Bottom-left
                    ];

                    // Draw lines using SVG
                    squareVertices.forEach(vertex => {
                        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                        line.setAttribute('x1', `${vertex.x}`);
                        line.setAttribute('y1', `${vertex.y}`);
                        line.setAttribute('x2', `${posX}`);
                        line.setAttribute('y2', `${posY}`);
                        line.setAttribute('stroke', 'darkgreen');
                        line.setAttribute('stroke-width', '2');
                        this.svgOverlay.appendChild(line);
                    });
                }
            }
        });

        if (!highestPriorityOffScreen) {
            // Remove any existing center square if highest priority target is on-screen
            const existingCenterSquare = this.hudOverlay.querySelector('.center-square');
            if (existingCenterSquare) {
                existingCenterSquare.remove();
            }
        }
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
        this.players.forEach((player) => {
            const hudElement = this.domElements.get(player);
            if (!hudElement) return;

            // Get viewport dimensions from CameraManager
            const viewport = this.cameraManager.getViewportForPlayer(player);

            // Set HUD element position using CSS
            hudElement.style.left = `${viewport.left + viewport.width - this.hudWidth - 20}px`; // Adjust margins as needed
            hudElement.style.top = `${viewport.top + viewport.height - this.hudHeight - 20}px`;

            // Set HUD container dimensions
            hudElement.style.width = `${this.hudWidth}px`;
            hudElement.style.height = `${this.hudHeight}px`;
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
        this.domElements.forEach((hudElement) => {
            if (hudElement.parentNode) {
                hudElement.parentNode.removeChild(hudElement);
            }
        });
        // Remove hudOverlay
        if (this.hudOverlay.parentNode) {
            this.hudOverlay.parentNode.removeChild(this.hudOverlay);
        }
        // Remove svgOverlay
        if (this.svgOverlay.parentNode) {
            this.svgOverlay.parentNode.removeChild(this.svgOverlay);
        }
        // Clear the map
        this.domElements.clear();
    }
}
