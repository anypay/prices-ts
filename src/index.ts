
import log from './log';

import * as fixer from './fixer';

export { fixer }

import { BigNumber } from 'bignumber.js'

import * as bittrex from './bittrex'

import * as kraken from './kraken'

export { bittrex, kraken }

import prisma from './prisma'

import { publish } from './amqp'

import { Price as PriceRecord } from '@prisma/client'

const MAX_DECIMALS = 8;

interface Amount {
  currency: string;
  value: number;
};

interface Conversion {
  input: Amount;
  output: Amount;
  timestamp: Date
};

async function createConversion(inputAmount: Amount, outputCurrency: string): Promise<Conversion> {
  let input = inputAmount;
  let output = await convert(inputAmount, outputCurrency);
  let timestamp = new Date();

  return {
    input,
    output,
    timestamp
  };
};

export class PriceNotFoundError implements Error {

  name = "PriceNotFoundError"
  message = "price not found for pair"

  constructor(input: string, output: string) {
    this.message = `price not found to convert ${input} to ${output}`
  }
}

async function convert(inputAmount: Amount, outputCurrency: string, precision: number = 2): Promise<Amount> {

  // Normalize input to USD if neither input or output is USD 
  if (inputAmount.currency !== 'USD' && outputCurrency !== 'USD') {

    inputAmount = await convert(inputAmount, 'USD')

  }

  // input currency is the account's denomination 
  // output currency is the payment option currency

  let where = {
    base: outputCurrency,
    currency: inputAmount.currency
  };

  let price = await prisma.price.findFirst({ where })

  if (price) {

    let targetAmount = new BigNumber(inputAmount.value).times(price.value.toNumber()).dp(MAX_DECIMALS).toNumber();

    return {
      currency: outputCurrency,
      value: targetAmount
    };

  } else {

    let inverse = await prisma.price.findFirst({
      where: {
        quote: inputAmount.currency,
        base: outputCurrency
      }
    })

    if (!inverse) {

      throw new PriceNotFoundError(inputAmount.currency, outputCurrency)

    }

    let price = new BigNumber(1).dividedBy(inverse.value.toNumber())

    let targetAmount = price.times(inputAmount.value).dp(MAX_DECIMALS).toNumber()

    return {
      currency: outputCurrency,
      value: targetAmount
    };

  }
};

import { Decimal } from '@prisma/client/runtime/library';

export interface SetPriceParams {
  base: string;
  quote: string;
  value: Decimal;
  source: string;
}

export async function setPrice(price: SetPriceParams): Promise<PriceRecord> {

  price.value = new Decimal(new BigNumber(price.value.toNumber()).dp(MAX_DECIMALS).toNumber())

  log.debug("price.set", price);

  const existing = await prisma.price.findFirst({
    where: {
      quote: price.quote,
      base: price.base
    }
  })

  let record = await prisma.price.upsert({
    where: {
        id: existing?.id || 0,
        quote: price.quote,
        base: price.base
    },
    create: {
      quote: price.quote,
      base: price.base,
      source: price.source,
      value: price.value,
      updatedAt: new Date(),
      createdAt: new Date()
    },
    update: {
      value: price.value,
      updatedAt: new Date()
    }
  })

  await publish('price/updated', record)

  await prisma.priceRecords.create({
    data: {
      value: price.value,
      base: price.base,
      quote: price.quote,
      source: price.source,
      updatedAt: new Date(),
      createdAt: new Date()
    }
  })

  return record;

}

export async function updateUSDPrices() {

  let prices: Price[] = await fixer.fetchCurrencies('USD');

  await Promise.all(prices.map(async (price: Price) => {

    await setPrice({
      base: price.base,
      quote: price.quote,
      value: new Decimal(price.value),
      source: 'fixer'    
    })

  }))

  return Promise.all(prices.map(price => {
    const setPriceParams: SetPriceParams = {
      base: price.base,
      quote: price.quote,
      value: new Decimal(1 / Number(price.value)),
      source: price.source
    };
    return setPrice(setPriceParams);
  }));

}

import { NewPriceParams } from './price'

export async function setAllCryptoPrices() {

  const prices: Promise<NewPriceParams>[] = [];


  //prices.push(getPrice({ chain: 'BSV', currency: 'BSV' }))
  //prices.push(getPrice({ chain: 'XRP', currency: 'XRP' }))

  //prices.push(bittrex.getPrice('USDC'))
  //prices.push(bittrex.getPrice('USDT'))
  //prices.push(bittrex.getPrice('MATIC'))

  prices.push(kraken.getPrice('XMR'))
  prices.push(kraken.getPrice('DASH'))
  prices.push(kraken.getPrice('BTC'))
  prices.push(kraken.getPrice('BCH'))
  prices.push(kraken.getPrice('ETH'))
  prices.push(kraken.getPrice('SOL'))
  prices.push(kraken.getPrice('AVAX'))
  prices.push(kraken.getPrice('DOGE'))
  prices.push(kraken.getPrice('LTC'))
  prices.push(kraken.getPrice('ZEC'))
  prices.push(kraken.getPrice('XLM'))

  await Promise.all(prices.map(async priceResult => {
    const result: NewPriceParams = await priceResult;

    try {

      return setPrice({
        base: result.base,
        quote: result.quote,
        value: new Decimal(result.value),
        source: result.source
      })

    } catch(error) {

      console.error(`error getting price`, error)
    }

  }))

}

export async function setAllFiatPrices(): Promise<Price[]> {

  let prices: Price[] = await fixer.fetchCurrencies('USD')

  for (let price of prices) {
    const setPriceParams: SetPriceParams = {
      base: price.base,
      quote: price.quote,
      value: new Decimal(price.value),
      source: price.source
    };

    await setPrice(setPriceParams)
  }

  return prices

}


export async function listPrices(coins: string[]): Promise<Price[]> {

  return prisma.price.findMany({
    where: {
      quote: 'USD',
      base: {
        in: coins.map(coin => coin.toUpperCase())
      }
    },
    orderBy: {
      base: 'asc'
    }
  })

}

interface Price {
  id: number;
  source: string;
  base: string;
  quote: string;
  value: Decimal;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Retrieves the hourly average price records for a given currency over the past specified number of days.
 * 
 * @param currency - The currency for which to retrieve price history.
 * @param days - The number of days in the past to retrieve history for. Defaults to 30 days.
 * @returns A Promise resolved with the price history, including timestamps and average values.
 */
export async function getPriceHistory(currency: string, days: number = 30): Promise<{ createdAt: Date; avg: number }[]> {
  // Calculate the start date based on the days parameter
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Use raw query for parts that Prisma does not directly support, like date_trunc
  const results = await prisma.$queryRaw<{ createdAt: Date; avg: string }[]>`
    SELECT date_trunc('hour', "createdAt") AS "createdAt", AVG("value") AS "avg"
    FROM "PriceRecords"
    WHERE "currency" = ${currency}
      AND "createdAt" >= ${startDate}
    GROUP BY date_trunc('hour', "createdAt")
    ORDER BY date_trunc('hour', "createdAt") ASC;
  `;

  // Map results to ensure types are correctly converted
  return results.map(result => ({
    createdAt: result.createdAt,
    avg: parseFloat(result.avg),
  }));
}

export {
  convert, createConversion
};

