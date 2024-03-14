import prisma from "./prisma";
import { Price } from '@prisma/client';

export type PriceSource = string;

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

    const basePrice = await getPrice({ base: quote.currency, quote: base.currency, source: base.source || 'default' })

    const value = base.value / basePrice.value.toNumber();
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
    const price = await prisma.price.findFirst({
        where: {
            quote: params.quote,
            base: params.base,
            source: params.source
        }
    })



    if (!price) {
        throw new Error('Price not found')
    }

    return price
}



export async function getSource(source: PriceSource): Promise<PriceSource> {
    return source
}

export async function listSources(): Promise<PriceSource[]> {
    return []
}