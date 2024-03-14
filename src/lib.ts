import prisma from "./prisma";
import { prices as PriceModel } from '@prisma/client';

export type PriceSource = string;

export interface Price {
    base: string,
    quote: string,
    value: number,
    source: string,
    timestamp: Date
}

export interface CreatePriceConversionParams {
    base: {
        value: number,
        currency: string,
        source?: string,
    },
    quote: {
        currency: string,
        source?: string,
    }
}

export interface PriceConversionResult {
    base: {
        value: number,
        currency: string,
        source?: string,
    },
    quote: {
        value: number,
        currency: string,
        source?: string,
    },
    timestamp: Date
}

export async function convertPrice({ base, quote }: CreatePriceConversionParams): Promise<PriceConversionResult> {

    const basePrice = await getPrice({ base: base.currency, quote: quote.currency, source: base.source || 'default' })

    const value = base.value / basePrice.value;
    // lookup prices from database

    // Convert price from base to quote
    const conversion: PriceConversionResult = {
        base,
        quote: {
            value,
            currency: quote.currency,
            source: quote.source,
        },
        timestamp: new Date()
    }

    console.log('conversion', conversion)

    return conversion;
}

export async function listPrices(): Promise<any[]> {
    return []
}

export interface GetPriceParams {
    base: string,
    quote: string,
    source: string
}

export async function getPrice(params: GetPriceParams): Promise<Price> {
    console.log('GET PRICE', params)
    const price = await prisma.prices.findFirst({
        where: {
            base_currency: params.quote,
            currency: params.base,
            source: params.source
        }
    })



    if (!price) {
        throw new Error('Price not found')
    }

    return toPrice(price!)
}

function toPrice(price: PriceModel): Price {
    return {
        base: String(price.base_currency),
        quote: price.currency,
        value: price.value.toNumber(),
        source: String(price.source),
        timestamp: price.updatedAt
    }
}

export async function getSource(source: PriceSource): Promise<PriceSource> {
    return source
}

export async function listSources(): Promise<PriceSource[]> {
    return []
}