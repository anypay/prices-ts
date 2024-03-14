import { config } from 'dotenv';

import * as ws from 'ws'

export async function main() {

    config();

    const topic = "price/updated";

    const message = { topic: "subscribe", payload: { topics: [topic] }};

    const socket = new ws.WebSocket(String(process.env.WEBSOCKET_URL || 'ws://127.0.0.1:3020'));

    socket.on('open', () => {
        console.log('MESSAGE', message)
        socket.send(JSON.stringify(message));
    });

    socket.on('message', (data) => {
        console.log(data.toString());
    });

    socket.on('error', (error) => {
        console.error(error);
    })

}

if (require.main === module) {
    main()
}