import ws from 'ws';
import crypto from 'crypto';
import express from 'express';

import { OnlineInputState, KeyNames } from '../src/Configs/KeyBound';
import { InputSerializer } from '../src/Utils/InputSerializer';
import { Room, GameStatus } from './room';
import { receiveNextMessage } from './utils';

const rooms: Map<string, Room> = new Map();
const userRooms: Map<string, Room> = new Map();

const app = express();

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

app.listen(17130, () => {
    console.log('HTTP Server started on port 17130...');
});


const server = new ws.Server({ port: 17129 });

console.log('Websocket Server started on port 17129...');

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
            room.removeConnection(user_id);
            userRooms.delete(user_id);
            console.log('Client disconnected');
        });
    });
});
