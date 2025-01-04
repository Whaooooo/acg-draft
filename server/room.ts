import ws from 'ws';
import crypto from 'crypto';

import { OnlineInputState, KeyNames } from '../src/Configs/KeyBound';
import { InputSerializer } from '../src/Utils/InputSerializer';
import { Replay, replayStorage } from './replay';

enum GameStatus {
    Waiting = 0,
    Started = 1,
    Ended = 2
}

class Room {
    private userConnections: Map<string, ws> = new Map();
    private userInputs: OnlineInputState[];
    private roomUsers = new Map<string, number>();
    private historyInputs: Replay;
    private room_uuid: string;
    private userAlive: Map<string, boolean> = new Map();

    public gameStatus: GameStatus = GameStatus.Waiting;
    public userReady: Map<string, boolean> = new Map();
    public UserNum = 2;

    public room_id: string;

    constructor(room_id: string) {
        this.room_id = room_id;
        this.userInputs = Array(this.UserNum);
        for (let i = 0; i < this.UserNum; i++) {
            this.userInputs[i] = InputSerializer.createEmptyInputState();
        }
        this.room_uuid = crypto.randomUUID();
        this.historyInputs = new Replay(room_id);
    }

    async startGame() {
        let cnt = 0;
        for (let [user_id, connection] of this.userConnections) {
            connection.send(JSON.stringify({ type: 'start', playerId: cnt, roomUUID: this.room_uuid }));
            this.roomUsers.set(user_id, cnt);
            this.historyInputs.addUser(user_id);
            this.userAlive.set(user_id, true);
            cnt++;
        }
        this.gameStatus = GameStatus.Started;

        console.log('Game started');

        let tick = 0;
        let startTime = Date.now();
        const oneTick = () => {
            tick++;
            const serializedInputs = this.userInputs.map((input) => InputSerializer.serialize(input));
            this.historyInputs.addInputs(serializedInputs);
            const data = JSON.stringify({ type: 'input', tick: tick, input: serializedInputs });
            for (let user_id of this.roomUsers.keys()) {
                const connection = this.userConnections.get(user_id);
                if (connection === undefined) {
                    console.log('Connection not found');
                    return;
                }
                connection.send(data);
            }
            for (let key of KeyNames) {
                for (let i = 0; i < this.UserNum; i++) {
                    this.userInputs[i][key] = false;
                }
            }

            if (tick > 60 * 60 * 15) {
                this.stopGame('Time out');
                return;
            }

            let hasAlive = false;
            for (let [user_id, alive] of this.userAlive) {
                if (alive) {
                    hasAlive = true;
                    break;
                }
            }
            if (!hasAlive) {
                this.stopGame('All players dead');
                return;
            }

            const nextTickTime = tick * 1000 / 60 - (Date.now() - startTime);
            if (nextTickTime < 1) {
                setTimeout(oneTick, 1);
            } else {
                setTimeout(oneTick, nextTickTime);
            }
        };

        setImmediate(oneTick);
    }

    addUser(user_id: string): boolean {
        if (this.userReady.size >= this.UserNum) {
            return false;
        }
        this.userReady.set(user_id, false);
        return true;
    }

    removeUser(user_id: string): boolean {
        if (!this.userReady.has(user_id)) {
            return false;
        }
        this.userConnections.get(user_id)?.close();
        this.userConnections.delete(user_id);
        this.userReady.delete(user_id);
        this.roomUsers.delete(user_id);
        switch (this.gameStatus) {
            case GameStatus.Waiting:
                this.sendRoomStatus();
                break;
            case GameStatus.Started:
                const alive = this.userAlive.get(user_id);
                if (alive === undefined) {
                    return false;
                }
                if (alive) {
                    this.stopGame('User left');
                }
                break;
        }
        return true;
    }

    addConnection(user_id: string, connection: ws) {
        this.userConnections.set(user_id, connection);
    }

    removeConnection(user_id: string) {
        this.userConnections.delete(user_id);
    }

    getRoomInfo() {
        return {
            room_id: this.room_id,
            user_count: this.userConnections.size,
            user_num: this.UserNum,
            status: this.gameStatus,
        };
    }

    getRoomInfoDetail() {
        return {
            room_id: this.room_id,
            user_count: this.userConnections.size,
            user_num: this.UserNum,
            user_ready: Array.from(this.userReady),
        };
    }

    stopGame(reason = '') {
        replayStorage.addReplay(this.room_uuid, this.historyInputs);
        this.gameStatus = GameStatus.Ended;
        for (let [user_id, connection] of this.userConnections) {
            connection.send(JSON.stringify({ type: 'end', reason: reason }));
            connection.close();
        }
    }

    checkAllReady(): boolean {
        if (this.userReady.size < this.UserNum) {
            return false;
        }
        for (let [user_id, ready] of this.userReady) {
            if (!ready) {
                return false;
            }
        }
        return true;
    }

    sendRoomStatus() {
        for (let [id, connection] of this.userConnections) {
            connection.send(JSON.stringify({ type: 'ready', ready_status: Array.from(this.userReady) }));
        }
    }

    handleMessages(user_id: string, message: any) {
        switch (message.type) {
            case 'input':
                let playerId = this.roomUsers.get(user_id);
                if (playerId === undefined) {
                    return;
                }
                this.userInputs[playerId] = InputSerializer.deserialize(message.input);
                break;
            case 'ready':
                let ready = message.ready;
                if (ready === undefined) {
                    return;
                }
                let ori_ready = this.userReady.get(user_id);
                if (ori_ready === undefined) {
                    return;
                }
                this.userReady.set(user_id, ready);
                // broadcast ready status
                this.sendRoomStatus();
                if (this.checkAllReady()) {
                    this.startGame();
                }
            case 'end':
                this.userAlive.set(user_id, false);
        }
    }

}

export { Room, GameStatus };