import { config } from 'dotenv';

import log from './log';

config();

import { createServer } from './server'

import { buildServer as startWebsocketServer } from './server/websockets/server';

import { start as startCronJobs } from './cron';

import { publish } from './amqp';

//import prisma from './prisma';

export default async function main() {
    log.info('app.starting')

    // connect amqp
    publish('app.started', { timestamp: new Date() })
    log.info('amqp.connected')

    // start websockets server
    const server = await createServer()

    const wsServer = await startWebsocketServer({ listener: server.listener })

    await publish('websocket.server.started', { timestamp: new Date() })
    log.info('websocket.server.started', {address: wsServer.address()})

    // start cron jobs
    startCronJobs()
    await publish('cron.started', { timestamp: new Date() })
    log.info('cron.started')

    // start hapi server
    server.start()
    await publish('hapi.server.started', { timestamp: new Date() })
    log.info('hapi.server.started', {info: server.info})

    log.info('app.startup.complete')
}

if (require.main === module) {
    main().catch(console.error)
}