import * as WebSocket from 'ws';
import { connect, Connection } from 'amqplib';
import log from '../../log';
import WebsocketClientSession from './session';
import { Server } from 'http'
import * as Hapi from '@hapi/hapi';

const RABBITMQ_URL = 'amqp://localhost'; // RabbitMQ connection URL

export async function buildServer({ listener }: { listener: Server }): Promise<WebSocket.Server> {
    const wsServer = new WebSocket.Server({
        server: listener
    });

    let rabbitConnection: Connection;
    try {
        rabbitConnection = await connect(process.env.AMQP_URL || RABBITMQ_URL);
    } catch (error) {
        console.error('Failed to connect to RabbitMQ', error);
        process.exit(1);
    }

    const channel = await rabbitConnection.createChannel();

    await channel.assertExchange('anypay.prices', 'direct', { durable: true });

    wsServer.on('connection', async (ws: WebSocket) => {

        const channel = await rabbitConnection.createChannel();

        const session = new WebsocketClientSession(ws, channel);

        log.info('websocket.client.connected', { uid: session.uid });

    });

    return wsServer;
};

export async function startServer(): Promise<WebSocket.Server> {

    const server = Hapi.server({
        port: process.env.PRICES_WEBSOCKETS_PORT || 3000,
        host: process.env.PRICES_WEBSOCKETS_HOST || '0.0.0.0'
    });

    const wsServer = await buildServer({ listener: server.listener });

    server.start()

    return wsServer;
}


