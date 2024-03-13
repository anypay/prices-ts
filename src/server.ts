import * as Hapi from '@hapi/hapi';
import log from './log';
import { publish } from './amqp';

interface Price {
        base: string,
        currency: string,
        value: number,
        provider: string
}

export async function createServer(): Promise<Hapi.Server> {

    const server = Hapi.server({
        port: process.env.PORT || 3000,
        host: '0.0.0.0'
    });

    // Define a memory storage for prices
    let prices: Price[] = [];

    // HTTP GET endpoint to retrieve price
    server.route({
        method: 'GET',
        path: '/api/price',
        handler: (request, h) => {
            const { base, currency, provider } = request.query;
            // Filter prices based on query parameters
            const filteredPrices = prices.filter(price => 
                (!base || price.base === base) &&
                (!currency || price.currency === currency) &&
                (!provider || price.provider === provider)
            );
            return h.response(filteredPrices).code(200);
        }
    });

    // HTTP POST endpoint to set a new price
    server.route({
        method: 'POST',
        path: '/api/price',
        handler: (request, h) => {
            const price = request.payload as Price;
            //price.id = uuidv4(); // Assign a unique ID to each price
            prices.push(price);
            // Broadcast the new price to all connected WebSocket clients
            publish('anypay.prices', 'price.updated', price);
            return h.response(price).code(201);
        }
    });


    return server
    
};

export async function startServer(): Promise<Hapi.Server> {
    const server = await createServer();
    await server.start();
    log.info('hapi.server.started', server.info.uri);
    return server;
}
