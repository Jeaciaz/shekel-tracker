import { Effect } from 'effect';
import * as z from 'zod';

const Spending = z.object({
    name: z.string(),
    amount: z.number(),
    datetime: z.date(),
});

export const gsToSpending = (cols: string[]) => Effect.try({
    try: () => Spending.parse({
        name: cols[0],
        amount: parseFloat(cols[1]),
        datetime: new Date(parseInt(cols[2])),
    }),
    catch: e => e instanceof Error ? e : new Error('Could not parse spending')
});
