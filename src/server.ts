import * as Hapi from '@hapi/hapi';
import log from './log';
import * as Joi from '@hapi/joi';
import { CreatePriceConversionParams, PriceConversionResult, convertPrice, listSources, getSource, getPrice, PriceSource, GetPriceParams } from './lib';
import { Price } from '@prisma/client'

export async function createServer(): Promise<Hapi.Server> {

    const server = Hapi.server({
        port: process.env.PRICES_HTTP_PORT || 3000,
        host: process.env.PRICES_HTTP_HOST || '0.0.0.0'
    });

    server.route({
        method: 'GET',
        path: '/api/sources/{source}',
        options: {
            response: {
                schema: Joi.object({
                    source: Joi.object({
                        name: Joi.string().required(),
                        active: Joi.boolean().required(),                
                    })
                })
            }
        },
        handler: async (request, h) => {

            const source: PriceSource = await getSource(request.params.source);

            return h.response({
                source,
                prices: []
            }).code(200);
        }        
    })

    server.route({
        method: 'GET',
        path: '/api/sources',
        options: {
            response: {
                schema: Joi.object({
                    sources: Joi.array().items(Joi.string()) 
                })
            }
        },
        handler: async (request, h) => {

            const sources: PriceSource[] =  await listSources()

            return h.response({
                sources
            }).code(200);

        }        
    })

    const PriceSchema = Joi.object({
        quote: Joi.string().required(),
        currency: Joi.string().required(),
        value: Joi.number().required(),
        source: Joi.string().required(),
        updated_at: Joi.date().required()
    }).label('Price')

    // HTTP GET endpoint to retrieve price
    server.route({
        method: 'GET',
        path: '/api/prices/{base}/{quote}/{source}',
        options: {
            validate: {
                params: Joi.object({
                    quote: Joi.string().required(),
                    base: Joi.string().required(),
                    source: Joi.string().required()  
                }).label('GetPriceParams'),
            },
            response: {
                failAction: 'log',
                schema: Joi.object({
                    price: PriceSchema
                })
            },
        },
        handler: async (request, h) => {

            try {

                const price: Price = await getPrice(request.params as GetPriceParams);

                return h.response({ price }).code(200);

            } catch (error) {

                console.error("ERROR", error)

                return h.response({ error }).code(500);


            }

        }
    });

    server.route({
        method: 'POST',
        path: '/api/conversions',
        options: {
            validate: {
                payload: Joi.object({
                    base: {
                        value: Joi.number().required(),
                        currency: Joi.string().required(),
                        source: Joi.string().optional()
                    },
                    quote: {
                        currency: Joi.string().required(),
                        source: Joi.string().optional()
                    },
                }).label('CreatePriceConversionParams'),
            },
            response: {
                schema: Joi.object({
                    conversion: Joi.object({                        
                        base: {
                            value: Joi.number().required(),
                            currency: Joi.string().required(),
                            source: Joi.string().optional()
                        },
                        quote: {
                            value: Joi.number().required(),
                            currency: Joi.string().required(),
                            source: Joi.string().optional()
                        },
                        timestamp: Joi.date().required()
                    }).label('PriceConversion')
                })
            },
        },
        handler: async (request, h) => {

            try {

                const createPriceConversionParams = request.payload as CreatePriceConversionParams;

                const conversion: PriceConversionResult = await convertPrice(createPriceConversionParams);

                return h.response({ conversion }).code(200);

            } catch(error) {

                console.error("ERROR", error)

                return h.response({ error }).code(500);
            }

        }
    });

    return server
    
};



export async function startServer(): Promise<Hapi.Server> {
    const server = await createServer();
    await server.start();
    log.info('hapi.server.started', server.info.uri);
    return server;
}
