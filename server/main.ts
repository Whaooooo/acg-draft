import ws from 'ws';
import crypto from 'crypto';

import { OnlineInputState } from '../src/Configs/KeyBound';

const server = new ws.Server({ port: 17129 });

console.log('Server started on port 17129...');

const userConnections: Map<string, ws> = new Map();

let gameStarted = false;

async function startGame() {
    let cnt = 0;
    for (let [user_id, connection] of userConnections) {
        connection.send(JSON.stringify({ type: 'start', playerId: cnt }));
        cnt++;
    }
    gameStarted = true;
}

function handleMessages(user_id: string, data: ws.RawData) {
    let message = JSON.parse(data.toString());

    switch (message.type) {

    }

    if (!gameStarted && userConnections.size >= 2) {
        startGame();
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
});

