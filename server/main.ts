import ws from 'ws';
import crypto from 'crypto';
import express from 'express';
import path from 'path';

import { OnlineInputState, KeyNames } from '../src/Configs/KeyBound';
import { InputSerializer } from '../src/Utils/InputSerializer';
import { Room, GameStatus } from './room';
import { receiveNextMessage } from './utils';
import { replayStorage } from './replay';

const rooms: Map<string, Room> = new Map();
const userRooms: Map<string, Room> = new Map();

const app = express();

const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.get('/', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});


app.use(express.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.get("/room_info", (req, res) => {
    let room_info: any[] = [];
    for (let [room_id, room] of rooms) {
        room_info.push(room.getRoomInfo());
    }
    res.send(JSON.stringify(room_info));
});

app.post("/replay_info", (req, res) => {
    if (req.body.room_uuid === undefined) {
        res.status(400).send('Room UUID not provided');
        return;
    }
    const room_uuid = req.body.room_uuid;
    const replay = replayStorage.getReplay(room_uuid);
    if (replay === undefined) {
        res.status(400).send('Replay not found');
        return;
    }
    res.send(JSON.stringify(replay.getInfo()));
})

app.post("/create_room", (req, res) => {
    if (req.body.user_id === undefined) {
        res.status(400).send('User ID not provided');
        return;
    }
    const user_id = req.body.user_id;
    if (userRooms.has(user_id)) {
        res.status(400).send('User already in a room');
        return;
    }
    let room_id = crypto.randomInt(10000000, 99999999).toString();
    while (rooms.has(room_id)) {
        room_id = crypto.randomInt(10000000, 99999999).toString();
    }
    const new_room = new Room(room_id);
    new_room.addUser(user_id);
    rooms.set(room_id, new_room);
    userRooms.set(user_id, new_room);
    res.send(JSON.stringify({ room_id: room_id }));
});

app.post("/join_room", (req, res) => {
    if (req.body.user_id === undefined || req.body.room_id === undefined) {
        res.status(400).send('User ID or Room ID not provided');
        return;
    }
    const user_id = req.body.user_id;
    const room_id = req.body.room_id;
    if (userRooms.has(user_id)) {
        res.status(400).send('User already in a room');
        return;
    }
    if (!rooms.has(room_id)) {
        res.status(400).send('Room not found');
        return;
    }
    const room = rooms.get(room_id);
    if (room === undefined) {
        res.status(500).send('Internal server error');
        return;
    }
    const ret = room.addUser(user_id);
    if (!ret) {
        res.status(400).send('Room is full');
        return;
    }
    userRooms.set(user_id, room);
    res.send(JSON.stringify({ room_id: room_id }));
});

app.post("/leave_room", (req, res) => {
    if (req.body.user_id === undefined) {
        res.status(400).send('User ID not provided');
        return;
    }
    const user_id = req.body.user_id;
    if (!userRooms.has(user_id)) {
        res.status(400).send('User not in a room');
        return;
    }
    const room = userRooms.get(user_id);
    if (room === undefined) {
        res.status(500).send('Internal server error');
        return;
    }
    const ret = room.removeUser(user_id);
    if (!ret) {
        res.status(500).send('Internal server error');
        return;
    }
    userRooms.delete(user_id);
    if (room.userReady.size === 0) {
        rooms.delete(room.room_id);
    }
    res.send('OK');
});

app.post("/room_status", (req, res) => {
    if (req.body.user_id === undefined) {
        res.status(400).send('User ID not provided');
        return;
    }
    const user_id = req.body.user_id;
    const room = userRooms.get(user_id);
    if (room === undefined) {
        res.status(400).send('User not in a room');
        return;
    }
    res.send(JSON.stringify(room.getRoomInfoDetail()));
});

app.get("/new_uuid", (req, res) => {
    res.send(crypto.randomUUID());
});

app.listen(48001, () => {
    console.log('HTTP Server started on port 48001...');
});


const server = new ws.Server({ port: 48002 });

console.log('Websocket Server started on port 48002...');

function handleMessages(user_id: string, room: Room, data: ws.RawData) {
    let message = JSON.parse(data.toString());

    room.handleMessages(user_id, message);
}

server.on('connection', (socket) => {
    console.log('Client connected');

    receiveNextMessage(socket).then((data) => {
        let first_message = JSON.parse(data.toString());

        let user_id = first_message.user_id;
        if (user_id === undefined) {
            socket.close();
            return;
        }

        let room_uuid = first_message.room_uuid;
        if (room_uuid) {
            // Replay connection
            let replay = replayStorage.getReplay(room_uuid);
            if (replay === undefined) {
                socket.close();
                return;
            }

            let status = GameStatus.Waiting;
            let tick = 0;
            let startTime = Date.now();
            const oneTick = () => {
                if (status === GameStatus.Ended) {
                    return;
                }

                const inputs = replay.inputs[tick];
                if (inputs === undefined) {
                    status = GameStatus.Ended;
                    socket.send(JSON.stringify({ type: 'end' }));
                    socket.close();
                    return;
                }
                const data = JSON.stringify({ type: 'input', tick: tick, input: inputs });
                socket.send(data);

                tick++;
                const nextTickTime = tick * 1000 / 60 - (Date.now() - startTime);
                if (nextTickTime < 1) {
                    setTimeout(oneTick, 1);
                } else {
                    setTimeout(oneTick, nextTickTime);
                }
            }

            socket.on('message', (data) => {
                let message = JSON.parse(data.toString());
                if (message.type === 'ready' && status === GameStatus.Waiting) {
                    status = GameStatus.Started;
                    socket.send(JSON.stringify({ type: 'start', playerId: 0, roomUUID: room_uuid }));
                    setImmediate(oneTick);
                }
            });
            socket.on('close', () => {
                status = GameStatus.Ended;
            });
        } else {
            let room = userRooms.get(user_id);
            if (room === undefined) {
                socket.close();
                return;
            }

            room.addConnection(user_id, socket);

            // socket.send(JSON.stringify({ type: 'uuid', data: user_id }));
            let ping_task = setInterval(() => { socket.ping(); }, 10000);

            socket.on('message', (data) => handleMessages(user_id, room, data));

            socket.on('close', () => {
                clearInterval(ping_task);
                room.removeUser(user_id);
                userRooms.delete(user_id);
                if (room.gameStatus === GameStatus.Ended) {
                    rooms.delete(room.room_id);
                }
                console.log('Client disconnected');
            });
        }
    });
});
