// src/Entities/NPC.ts

import { Plane } from './Plane';
import { Game } from '../Game';
import { EntityName } from '../Configs/EntityPaths';
import { PlaneProperty, NPCProperties } from '../Configs/EntityProperty';
import { Player } from "./Player";
import * as THREE from 'three';

export class NPCPlane extends Plane {
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

    public getOwnerPlayer(): Player[] {
        // NPCs may have different logic; for now, return an empty array
        return [];
    }

    public update(deltaTime: number): void {
        if (!this.ready || !this.model) return;

        // Implement AI-specific update logic here
        this.controlAI(deltaTime);

        // Call the parent update
        super.update(deltaTime);
    }

    private controlAI(deltaTime: number): void {
        // Implement AI logic to control NPC's movement
        // Adjust yawSpeed, pitchSpeed, rollSpeed, and pulsion based on AI decisions
    }

    public dispose(): void {
        this.game.npcPlaneMap.delete(this.entityId);
        super.dispose();
    }
}
