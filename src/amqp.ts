
const rabbi = require('rabbi');

const exchange = process.env.PRICES_AMQP_EXCHANGE || 'prices';

export async function publish(routingkey: string, message: any) {

    return rabbi.publish(exchange, routingkey, Buffer.from(JSON.stringify(message)))
}

export { exchange }