
const rabbi = require('rabbi');

const exchange = process.env.PRICES_AMQP_EXCHANGE || 'prices';

export async function publish(routingkey: string, message: any) {

    return rabbi.publish(exchange, routingkey, Buffer.from(JSON.stringify(message)))
}

export async function setup() {
    const channel = await rabbi.getChannel()
    await channel.assertExchange(exchange, 'direct', { durable: true });
}

export { exchange }