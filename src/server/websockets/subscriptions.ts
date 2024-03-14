import Joi from "@hapi/joi"
import { registerSchema } from "../../amqp"

export const topics = [
    'price/updated',
    'priceCreated',
    'priceUpdated',
    'priceRemoved',
    'sourceAdded',
    'sourceRemoved',
    'sourceRemoved'
]

registerSchema(
    'price/updated',
    Joi.object({
        quote: Joi.string().required(),
        base: Joi.string().required(),
        value: Joi.number().required(),
        source: Joi.string().required(),
        updated_at: Joi.date().required()
    }).label('PriceUpdated')
)

registerSchema(
    'app.started',
    Joi.object({
        timestamp: Joi.date().required()
    }).label('AppStarted')
)
