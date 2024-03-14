
import axios from 'axios'

import log from './log'

import { Decimal } from '@prisma/client/runtime/library'

class InvalidPricePair implements Error {
  name = 'KrakenInvalidPricePair'
  message = 'pair is not a valid kraken price pair'

  constructor(pair: string) {
    this.message = `${pair} is not a valid kraken price pair`
  }
  
}

import { NewPriceParams } from './price'

export async function getPrice(currency: string): Promise<NewPriceParams> {

  if (currency === 'DOGE') {
    currency = 'XDG'
  }
  if (currency === 'BTC') {
    currency = 'XBT'
  }

  const pair = `${currency}USD`

  try {

    let {data} = await axios.get(`https://api.kraken.com/0/public/Ticker?pair=${pair}`)

    var value: number;

    if (data.result[pair]) {

      value = parseFloat(data.result[`${currency}USD`]['a'][0])

    } else if (data.result[`X${currency}ZUSD`]) {

      value = parseFloat(data.result[`X${currency}ZUSD`]['a'][0])

    } else if (data.result[`X${currency}USD`]) {

      value = parseFloat(data.result[`X${currency}USD`]['a'][0])

    } else {

      throw new Error(`kraken pair ${pair} not supported`)

    }

    if (currency === 'XDG') {
      currency = 'DOGE'
    }

    if (currency === 'XBT') {
      currency = 'BTC'
    }

    return {
      quote: 'USD',
      base: currency,
      value: new Decimal(value),
      source: 'kraken'
    }

  } catch(error) {

    log.error('kraken.price.pair.invalid', new InvalidPricePair(pair))

    throw error
    
  }
}
