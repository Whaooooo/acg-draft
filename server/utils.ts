import ws from 'ws';
import crypto from 'crypto';
import express from 'express';

function receiveNextMessage(socket: ws): Promise<string> {
    return new Promise((resolve, reject) => {
        socket.once('message', (data) => {
            resolve(data.toString());
        });
    });
}

export { receiveNextMessage };