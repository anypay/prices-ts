
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
    // lookup prices from database

    // Convert price from base to quote
    return {
        base,
        quote: {
            value: 0,
            currency: quote.currency,
            source: quote.source,
        },
        timestamp: new Date()
    }
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
    return {
        base: params.base,
        quote: params.quote,
        value: 0,
        source: params.source,
        timestamp: new Date()
    }
}

export async function getSource(source: PriceSource): Promise<PriceSource> {
    return source
}

export async function listSources(): Promise<PriceSource[]> {
    return []
}