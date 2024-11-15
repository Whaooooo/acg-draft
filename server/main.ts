import ws from 'ws';
import crypto from 'crypto';

import { OnlineInputState, KeyNames } from '../src/Configs/KeyBound';
import { InputSerializer } from '../src/Utils/InputSerializer';

const server = new ws.Server({ port: 17129 });

console.log('Server started on port 17129...');

const userConnections: Map<string, ws> = new Map();

let gameStarted = false;

const userInputs = Array(2);
for (let i = 0; i < 2; i++) {
    userInputs[i] = InputSerializer.createEmptyInputState();
}

const roomUsers = new Map();

async function startGame() {
    let cnt = 0;
    for (let [user_id, connection] of userConnections) {
        connection.send(JSON.stringify({ type: 'start', playerId: cnt }));
        roomUsers.set(user_id, cnt);
        cnt++;
    }
    gameStarted = true;

    console.log('Game started');

    let tick = 0;
    const oneTick = () => {
        tick++;
        const data = JSON.stringify({ type: 'input', tick: tick, input: userInputs.map((input) => InputSerializer.serialize(input)) });
        for (let user_id of roomUsers.keys()) {
            const connection = userConnections.get(user_id);
            if (connection === undefined) {
                throw new Error('Connection not found');
            }
            connection.send(data);
        }
        for (let key of KeyNames) {
            userInputs[0][key] = false;
            userInputs[1][key] = false;
        }
    };
    setInterval(oneTick, 15);
}

function handleMessages(user_id: string, data: ws.RawData) {
    let message = JSON.parse(data.toString());

    switch (message.type) {
        case 'input':
            let playerId = roomUsers.get(user_id);
            if (playerId === undefined) {
                return;
            }
            const input = InputSerializer.deserialize(message.input);
            for (let key of KeyNames) {
                userInputs[playerId][key] ||= input[key];
            }
            break;
    }
}

server.on('connection', (socket) => {
    console.log('Client connected');

    let user_id = crypto.randomUUID();
    userConnections.set(user_id, socket);

    // socket.send(JSON.stringify({ type: 'uuid', data: user_id }));

    let ping_task = setInterval(() => { socket.ping(); }, 10000);

    socket.on('message', (data) => handleMessages(user_id, data));

    socket.on('close', () => {
        clearInterval(ping_task);
        userConnections.delete(user_id);
    });

    if (!gameStarted && userConnections.size >= 2) {
        startGame();
    }
});

