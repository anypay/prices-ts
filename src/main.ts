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
    publish('anypay.prices', 'app.started', { timestamp: new Date() })
    log.info('amqp.connected')

    // start websockets server
    const server = await createServer()

    const wsServer = await startWebsocketServer({ listener: server.listener })

    await publish('anypay.prices', 'websocket.server.started', { timestamp: new Date() })
    log.info('websocket.server.started', {address: wsServer.address()})

    // start cron jobs
    startCronJobs()
    await publish('anypay.prices', 'cron.started', { timestamp: new Date() })
    log.info('cron.started')


    // start hapi server
    server.start()
    await publish('anypay.prices', 'hapi.server.started', { timestamp: new Date() })
    log.info('hapi.server.started', {info: server.info})

    log.info('app.startup.complete')
}

if (require.main === module) {
    main().catch(console.error)
}