import { createServer } from '../src/server'; // Adjust the import path according to your project structure
import prisma from '../src/prisma';

import { Server } from '@hapi/hapi'
import { Decimal } from '@prisma/client/runtime/library';
import { PriceConversionResult } from '../src/lib';

var server: Server;

beforeAll(async () => {
  server = await createServer();
  await prisma.$connect();
});

afterAll(async () => {
  await server.stop();
});

describe('API Sources', () => {
  test.skip('GET /api/sources/{source} should return source details', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/sources/testSource', // Replace 'testSource' with a valid source ID for your test
    });

    expect(response.statusCode).toBe(200);
    expect(response.result).toHaveProperty('source');
    // Add more assertions based on the expected structure of 'source'
  });

  test('GET /api/sources should return list of sources', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/sources',
    });

    expect(response.statusCode).toBe(200);
    expect(response.result).toHaveProperty('sources');
    // Add more assertions based on the expected structure of 'sources'
  });
});

describe('API Prices', () => {
  test('GET /api/prices/{base}/{quote}/{source} should return price details', async () => {
    // mock a Price record in the database BTC, USD, testSource

      const mockPrice = {
        quote: 'USD',
        value: new Decimal(72000.00), // Assuming you're using a Decimal library
        base: 'BTC',
        createdAt: new Date(),
        updatedAt: new Date(),
        source: 'MockSource',
      };

    let price = await prisma.price.findFirst({
        where: {
            base: mockPrice.base,
            quote: mockPrice.quote,
            source: mockPrice.source
        },

    })

    if (!price) {
        price = await prisma.price.create({
            data: mockPrice,
        })
    }

    const response = await server.inject({
      method: 'GET',
      url: '/api/prices/BTC/USD/MockSource', // Adjust parameters as needed
    });

    expect(response.statusCode).toBe(200);
    expect(response.result).toHaveProperty('price');
    // Add more assertions based on the expected structure of 'price'
  });
});

describe('API Conversions', () => {
  test('POST /api/conversions should perform currency conversion', async () => {

    const mockPrice = {
        quote: 'USD',
        value: new Decimal(100_000), // Assuming you're using a Decimal library
        base: 'BTC',
        createdAt: new Date(),
        updatedAt: new Date(),
        source: 'MockSource',
      };

    let price = await prisma.price.findFirst({
        where: {
            quote: mockPrice.quote,
            base: mockPrice.base,
            source: mockPrice.source
        },

    })

    if (!price) {
        price = await prisma.price.create({
            data: mockPrice,
        })
    }
    
    await prisma.price.update({
            where: { id: price.id },
            data: {
                    value: new Decimal(100_000)
            }
    });

    const response = await server.inject({
        method: 'POST',
        url: '/api/conversions',
        payload: {
            base: { value: 1000, currency: 'USD', source: 'MockSource' },
            quote: { currency: 'BTC', source: 'MockSource' },
        },
    });

    const json = response.result as {
        conversion: PriceConversionResult
    };

    expect(response.statusCode).toBe(200);
    expect(json.conversion.quote.value).toEqual(0.01)
    expect(json.conversion.base.value).toEqual(1000)
    expect(json.conversion.quote.currency).toEqual('BTC')
    expect(json.conversion.base.currency).toEqual('USD')
    // Add more assertions based on the expected structure of 'conversion'
  });
});
