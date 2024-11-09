// src/Managers/HUDManager.ts

import * as THREE from 'three';
import { Player } from '../Entities/Player';
import { CameraManager } from './CameraManager';
import { Weapon } from '../Core/Weapon';
import { Game } from '../Game';

export class HUDManager {
    private game: Game;
    private players: Player[];
    private cameraManager: CameraManager;
    private domElements: Map<Player, HTMLDivElement>;

    // 定义 HUD 的尺寸
    private hudWidth: number = 400;  // 根据需要调整
    private hudHeight: number = 300; // 根据需要调整

    private lastFrameTime: number = 0;
    private frameCount: number = 0;

    constructor(game: Game) {
        this.game = game;
        this.players = Array.from(game.playerMap.values());
        this.cameraManager = game.cameraManager;
        this.domElements = new Map();
    }

    /**
     * 更新 HUD，每次重新绘制所有内容。
     */
    public update(deltaTime: number): void {
        // 清除现有的 HUD 元素
        this.dispose();

        // 重新获取当前的玩家列表
        this.players = Array.from(this.game.playerMap.values());

        // 重新绘制所有 HUD 元素
        this.players.forEach((player) => {
            const hudElement = this.createHUDElementForPlayer(player);
            document.body.appendChild(hudElement);
            this.domElements.set(player, hudElement);
        });

        if (this.lastFrameTime === 0)
            this.lastFrameTime = performance.now();
        this.frameCount++;
        if (this.frameCount >= 30 || (this.frameCount >= 4 && performance.now() - this.lastFrameTime >= 2000)) {
            var fps = this.frameCount / ((performance.now() - this.lastFrameTime) / 1000);
            this.frameCount = 0;
            this.lastFrameTime = performance.now();
            document.getElementById('fps-display')!.innerText = `FPS: ${Math.round(fps)}`;
        }

        this.render();
    }

    private createHUDElementForPlayer(player: Player): HTMLDivElement {
        const hudContainer = document.createElement('div');
        hudContainer.classList.add('hud-container');

        // 设置 HUD 容器的固定尺寸
        hudContainer.style.width = `${this.hudWidth}px`;
        hudContainer.style.height = `${this.hudHeight}px`;

        // 创建血量条
        const hpBarContainer = document.createElement('div');
        hpBarContainer.classList.add('hp-bar-container');
        hudContainer.appendChild(hpBarContainer);

        const hpBar = document.createElement('div');
        hpBar.classList.add('hp-bar');
        hpBarContainer.appendChild(hpBar);

        const hpText = document.createElement('div');
        hpText.classList.add('hp-text');
        hpBarContainer.appendChild(hpText);

        // 设置血量条的宽度和文本
        const hp = Math.max(0, player.currentHP);
        const maxHP = player.property.hp;
        const hpPercentage = (hp / maxHP) * 100;
        hpBar.style.width = `${hpPercentage}%`;
        hpText.textContent = `${Math.round(hp)} / ${maxHP}`;

        // 创建上方的容器（在血量条上方）
        const upperContainer = document.createElement('div');
        upperContainer.classList.add('upper-container');
        hudContainer.appendChild(upperContainer);

        // 左侧：当前选中武器的装填状态
        const reloadContainer = document.createElement('div');
        reloadContainer.classList.add('reload-container');
        upperContainer.appendChild(reloadContainer);

        // 创建装填状态竖条
        const selectedWeapon = player.weapons[player.selectedWeaponIndex];
        const loadNumber = selectedWeapon.property.loadNumber;
        for (let i = 0; i < loadNumber; i++) {
            const bar = document.createElement('div');
            bar.classList.add('reload-bar');
            reloadContainer.appendChild(bar);

            const missilesRemaining = selectedWeapon.property.totalNumber - selectedWeapon.totalMissilesFired;
            if (i >= missilesRemaining) {
                // 没有剩余的导弹，此槽为空
                bar.style.backgroundColor = 'gray';
                bar.style.height = '100%';
            } else {
                const loadTimer = selectedWeapon.loadTimers[i];
                if (loadTimer <= 0) {
                    // 槽已装填
                    bar.style.backgroundColor = '#00ff00'; // 绿色
                    bar.style.height = '100%';
                } else {
                    // 槽正在装填
                    const loadPercentage = Math.max(0, Math.min(1, (selectedWeapon.property.loadTime - loadTimer) / selectedWeapon.property.loadTime));
                    bar.style.backgroundColor = '#ffff00'; // 黄色
                    bar.style.height = `${loadPercentage * 100}%`;
                }
            }
        }

        // 右侧：武器列表
        const weaponListContainer = document.createElement('div');
        weaponListContainer.classList.add('weapon-list-container');
        upperContainer.appendChild(weaponListContainer);

        // 创建武器条目
        player.weapons.forEach((weapon, index) => {
            const weaponEntry = document.createElement('div');
            weaponEntry.classList.add('weapon-entry');

            // 武器名称
            const weaponNameElement = document.createElement('div');
            weaponNameElement.classList.add('weapon-name');
            const weaponName = this.extractWeaponName(weapon.name);
            weaponNameElement.textContent = (index === player.selectedWeaponIndex ? '>' : '') + weaponName;
            weaponEntry.appendChild(weaponNameElement);

            // 剩余数量
            const weaponCountElement = document.createElement('div');
            weaponCountElement.classList.add('weapon-count');
            weaponCountElement.textContent = this.getWeaponRemainingCount(weapon).toString();
            weaponEntry.appendChild(weaponCountElement);

            // 迷你装填指示容器
            const miniReloadContainer = document.createElement('div');
            miniReloadContainer.classList.add('mini-reload-container');
            weaponEntry.appendChild(miniReloadContainer);

            // 创建迷你竖条
            for (let i = 0; i < weapon.property.loadNumber; i++) {
                const miniBar = document.createElement('div');
                miniBar.classList.add('mini-reload-bar');
                miniReloadContainer.appendChild(miniBar);

                const missilesRemaining = weapon.property.totalNumber - weapon.totalMissilesFired;
                if (i >= missilesRemaining) {
                    // 没有剩余的导弹，此槽为空
                    miniBar.style.backgroundColor = 'gray';
                    miniBar.style.height = '100%';
                } else {
                    const loadTimer = weapon.loadTimers[i];
                    if (loadTimer <= 0) {
                        // 槽已装填
                        miniBar.style.backgroundColor = '#00ff00'; // 绿色
                        miniBar.style.height = '100%';
                    } else {
                        // 槽正在装填
                        const loadPercentage = Math.max(0, Math.min(1, (weapon.property.loadTime - loadTimer) / weapon.property.loadTime));
                        miniBar.style.backgroundColor = '#ffff00'; // 黄色
                        miniBar.style.height = `${loadPercentage * 100}%`;
                    }
                }
            }

            weaponListContainer.appendChild(weaponEntry);
        });

        // 设置 HUD 容器样式
        hudContainer.style.position = 'absolute';
        hudContainer.style.pointerEvents = 'none'; // 使其不阻挡鼠标事件

        return hudContainer;
    }

    public render(): void {
        // 根据视口调整 HUD 元素的位置
        this.players.forEach((player) => {
            const hudElement = this.domElements.get(player);
            if (!hudElement) return;

            // 从 CameraManager 获取视口尺寸
            const viewport = this.cameraManager.getViewportForPlayer(player);

            // 使用 CSS 设置 HUD 元素的位置
            hudElement.style.left = `${viewport.left + viewport.width - this.hudWidth - 20}px`; // 右侧留出20px边距
            hudElement.style.top = `${viewport.top + viewport.height - this.hudHeight - 20}px`; // 下方留出20px边距

            // 固定 HUD 容器的宽度和高度
            hudElement.style.width = `${this.hudWidth}px`;
            hudElement.style.height = `${this.hudHeight}px`;
        });
    }

    private extractWeaponName(fullName: string): string {
        const parts = fullName.split('_');
        const name = parts[parts.length - 1];
        return name.toUpperCase();
    }

    private getWeaponRemainingCount(weapon: Weapon): number {
        return weapon.property.totalNumber - weapon.totalMissilesFired;
    }

    public dispose(): void {
        // 从 DOM 中移除 HUD 元素
        this.domElements.forEach((hudElement) => {
            if (hudElement.parentNode) {
                hudElement.parentNode.removeChild(hudElement);
            }
        });
        // 清空映射
        this.domElements.clear();
    }
}
