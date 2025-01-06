import ws from 'ws';
import crypto from 'crypto';

import { OnlineInputState, KeyNames } from '../src/Configs/KeyBound';
import { InputSerializer } from '../src/Utils/InputSerializer';

class Replay {
    public inputs: string[][] = [];
    public users: string[] = [];
    public room_id: string;

    constructor(room_id: string) {
        this.room_id = room_id;
    }

    public addUser(user: string) {
        this.users.push(user);
    }

    public addInputs(inputs: string[]) {
        this.inputs.push(inputs);
    }

    public getInfo() {
        return {
            users: this.users,
            room_id: this.room_id,
            ticks: this.inputs.length
        }
    }
}

class ReplayStorage {
    replayData: Map<string, Replay> = new Map();

    addReplay(room_uuid: string, replay: Replay) {
        this.replayData.set(room_uuid, replay);
    }

    getReplay(room_uuid: string) {
        return this.replayData.get(room_uuid);
    }
}

const replayStorage = new ReplayStorage();

export { Replay, ReplayStorage, replayStorage };

