import * as Joi from '@hapi/joi'

export const PriceSchema = Joi.object({
    base_currency: Joi.string().required(),
    currency: Joi.string().required(),
    value: Joi.number().required(),
    source: Joi.string().required(),
    updated_at: Joi.date().required()
}).label('Price')
