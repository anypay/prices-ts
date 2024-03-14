import { config } from 'dotenv';
import { setPrice } from '../';
import { Decimal } from '@prisma/client/runtime/library';

export async function main() {

    config();

    const price = await setPrice({
        base: 'USD',
        quote: 'USD',
        value: new Decimal(1),
        source: 'manual'
    });

    console.log(price);

}

if (require.main === module) {
    main()
}