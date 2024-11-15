async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function receiveFirstMessage(socket: WebSocket): Promise<MessageEvent> {
    return new Promise((resolve) => {
        socket.addEventListener('message', function onMessage(event: MessageEvent) {
            socket.removeEventListener('message', onMessage);
            resolve(event);
        });
    });
}

export { sleep, nextFrame, receiveFirstMessage };