// src/Managers/TargetManager.ts

import { Entity } from '../Core/Entity';

export class TargetManager {
    private entities: Set<Entity>;

    constructor(allEntities: Entity[][]) {
        this.entities = new Set<Entity>();

        // Flatten the array of arrays and add each entity to the set
        allEntities.forEach((entityArray) => {
            entityArray.forEach((entity) => {
                this.entities.add(entity);
            });
        });
    }

    public addEntity(entity: Entity): void {
        this.entities.add(entity);
    }

    public removeEntity(entity: Entity): void {
        this.entities.delete(entity);
    }

    public getLockList(entity: Entity): Entity[] {
        const lockList: Entity[] = [];
        for (const e of this.entities) {
            if (e !== entity && e.iFFNumber !== entity.iFFNumber) {
                lockList.push(e);
            }
        }
        return lockList;
    }

    public reTarget(entity: Entity): Entity[] {
        return []
    }

    public getAllEntities(): Entity[] {
        return Array.from(this.entities);
    }
}
