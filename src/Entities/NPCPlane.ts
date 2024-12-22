// src/Entities/NPCPlane.ts

import { Plane } from './Plane';
import { Game } from '../Game';
import { EntityName } from '../Configs/EntityPaths';
import { PlaneProperty, NPCProperties } from '../Configs/EntityProperty';
import { Player } from "./Player";
import * as THREE from 'three';
import { NPCMode } from '../Enums/NPCMode';
import { calculateFinalDesiredDirection, alignToDirection, updateNPCMode } from '../Utils/NPCUtils';
import { Entity } from '../Core/Entity'
import { Missile } from './Missile'; // 假设有导弹类

export class NPCPlane extends Plane {
    public npcMode: NPCMode = NPCMode.Cruise;
    private nextFireCooldown: number = 0;
    private target: Entity | null = null; // 当前的目标

    constructor(
        game: Game,
        assetName: EntityName,
        pos?: THREE.Vector3,
        qua?: THREE.Quaternion,
        velocity?: THREE.Vector3,
        iFFNumber?: number
    ) {
        const planeProperty = NPCProperties[assetName] as PlaneProperty;
        super(game, assetName, planeProperty, pos, qua, velocity, iFFNumber);
        this.game.npcPlaneMap.set(this.entityId, this);
    }

    public update(deltaTime: number): void {
        // 1. 更新 NPC 模式
        updateNPCMode(this);

        // 2. AI 逻辑：控制机动与姿态
        this.controlAI(deltaTime);

        // 3. 简单的开火逻辑：每秒尝试一次
        this.nextFireCooldown -= deltaTime;
        if (this.nextFireCooldown <= 0) {
            this.fireWeapon();
            this.nextFireCooldown = 1.0;
        }

        // 调用父类更新
        super.update(deltaTime);
    }

    private controlAI(deltaTime: number): void {
        // 1. 计算最终目标方向
        const finalDir = calculateFinalDesiredDirection(this);

        // 2. 对齐到最终目标方向
        alignToDirection(this, finalDir, deltaTime);
    }

    public dispose(): void {
        this.game.npcPlaneMap.delete(this.entityId);
        super.dispose();
    }

    /**
     * 获取当前的目标
     * @returns 当前的目标实体
     */
    public getTarget(): Entity | null {
        return this.target;
    }

    /**
     * 设置当前的目标
     * @param target 目标实体
     */
    public setTarget(target: Entity | null): void {
        this.target = target;
    }
}
