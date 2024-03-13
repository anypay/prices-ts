
import axios from 'axios'

import { Price } from './price'

export async function getPrice(currency: string): Promise<Price> {

  let pair = `${currency}-USDT`

  if (currency === 'USDT') {

    pair = `USDT-USD`

  }

  let {data} = await axios.get(`https://api.bittrex.com/v3/markets/${pair}/orderbook`)

  let value = parseFloat(data.bid[0].rate)

  return {
    base: 'USD',
    currency,
    value,
    source: 'bittrex'
  }

}
