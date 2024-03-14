import { Price } from "@prisma/client";

export type NewPriceParams = Pick<Price, 'base' | 'value' | 'quote' | 'source'>;
