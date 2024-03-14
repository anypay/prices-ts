
const rabbi = require('rabbi');

const exchange = process.env.PRICES_AMQP_EXCHANGE || 'prices';

export async function publish(topic: string, payload: any) {

    return rabbi.publish(exchange, topic, {
        topic, payload
    })
}

export async function setup() {
    const channel = await rabbi.getChannel()
    await channel.assertExchange(exchange, 'direct', { durable: true });
}

export { exchange }