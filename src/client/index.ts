
/*
    import { Price, Consumer, Producer } from '@anypay/prices'

    const consumer = new PricesService({
        url: 'https://prices.anypayx.com'
    })

    consumer.on('price.created', (price: Price) => {
        
    })

    consumer.on('price.updated', (price: Price) => {

    })

    consumer.on('price.removed', (price: Price) => {
        
    })

    consumer.on('price.error', (error: Error) => {
        
    })

    consumer.connect()

    const price = await consumer.getPrice({ base: 'USD', currency: 'BTC', provider: 'coinmarketcap' })

    const price2 = await consumer.getPrice({ base: 'USD', currency: 'ETH', provider: 'binance' })

    const price3 = await consumer.getPrice({ base: 'USD', currency: 'DOGI', provider: 'doggy.markets' })

    const producer = new Producer({
        url: 'https://prices.anypayx.com',
        token: 'signed-json-webtoken-required'
    })

    producer.connect()

    const price = await producer.setPrice({
        chain: 'BTC',
        currency: 'BTC',
        amount: {
            currency: 'USD',
            value: 10000
        },
        source: 'coinmarketcap'
    })

*/

// Import necessary modules
import { Price } from '@prisma/client';
import axios from 'axios';
import { WebSocket } from 'ws';

// Consumer class
export class Consumer {
  private ws: WebSocket;
  private url: string;
  private doConnect: boolean;

  constructor({ url }: { url: string }) {
    this.url = url;
    this.ws = new WebSocket(url);
    this.doConnect = false;
  }

  connect() {

    this.doConnect = true

    this.ws.on('open', () => {
      this.emit('ws.open', null);
    });

    this.ws.on('close', async () => {
        this.emit('ws.close', null);
        if (this.doConnect) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            this.connect();
        }
    });

    this.ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      this.emit(message.event, message.data);
    });

    this.ws.on('error', (error) => {
      this.emit('ws.error', error);
    });
  }

  on(event: string, callback: (data: any) => void) {
    this.ws.on(event, callback);
  }

  emit(event: string, data: any) {
    this.ws.emit(event, data);
  }

  async getPrice(params: { base: string; currency: string; provider: string }): Promise<Price> {
    const response = await axios.get(`${this.url}/api/price`, { params });
    return response.data;
  }
}

// Producer class
export class Producer {
  private ws: WebSocket;
  private url: string;

  constructor({ url }: { url: string }) {
    this.url = url;
    this.ws = new WebSocket(url);
  }

  connect() {
    this.ws.on('open', () => {
      console.log('Connected to the server as Producer');
    });
  }

  async setPrice(price: Price): Promise<void> {
    await axios.post(`${this.url}/api/price`, price);
  }
}

