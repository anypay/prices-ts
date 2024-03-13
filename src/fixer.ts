// Make sure to include the dotenv configuration at the top of your entry file.
require('dotenv').config();

import axios from 'axios'
import { BigNumber } from 'bignumber.js';
import { Price } from './price';

/**
 * Fetches currency conversion rates relative to a base currency and formats them as `Price` objects.
 *
 * @param base - The base currency code against which other currencies are compared. Defaults to 'USD'.
 * @returns A promise that resolves to an array of `Price` objects, each representing a currency's conversion rate relative to the base currency.
 */
export async function fetchCurrencies(base: string = 'USD'): Promise<Price[]> {
  const apiKey: string = String(process.env.ANYPAY_FIXER_ACCESS_KEY);
  if (!apiKey) {
    throw new Error('API key for Fixer.io is not defined in the environment variables.');
  }

  const url = `http://data.fixer.io/api/latest?access_key=${apiKey}&base=${base.toUpperCase()}`;

  let {data} = await axios.get(url);

  interface Rates {
    [currency: string]: number;
  }

  const rates: Rates = data.rates || {};

  return Object.keys(rates).map((currency) => {
    return {
      base: base.toUpperCase(),
      currency: currency,
      value: new BigNumber(1).dividedBy(new BigNumber(rates[currency])).toNumber(),
      source: 'data.fixer.io/api/latest',
    };
  });
}
