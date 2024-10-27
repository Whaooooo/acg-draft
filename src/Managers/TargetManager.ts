// src/Managers/TargetManager.ts

import { Entity } from '../Core/Entity';
import {Game} from "../Game";

export class TargetManager {
    public game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    public getLockList(entity: Entity): Entity[] {
        const lockList: Entity[] = [];
        for (const e of Array.from(this.game.entityMap.values())) {
            if (e !== entity && e.iFFNumber !== entity.iFFNumber && e.iFFNumber >= 0) {
                lockList.push(e);
            }
        }
        return lockList;
    }

    public reTarget(entity: Entity): Entity[] {
        return []
    }
}
