
const rabbi = require('rabbi');

const exchange = process.env.PRICES_AMQP_EXCHANGE || 'prices';

import { Schema } from '@hapi/joi';

const schemas: { [key: string]: Schema } = {}

export function registerSchema(name: string, schema: Schema) {
    schemas[name] = schema;
}

export async function publish(topic: string, payload: any) {

    const schema = schemas[topic];

    if (schema) {

        const validation = schema.validate(payload);
        if (validation.error) {
            throw new Error(`Invalid payload for topic ${topic}: ${validation.error.message}`);
        }
    }


    return rabbi.publish(exchange, topic, {
        topic, payload
    })
}

export async function setup() {
    const channel = await rabbi.getChannel()
    await channel.assertExchange(exchange, 'direct', { durable: true });
}

export { exchange }