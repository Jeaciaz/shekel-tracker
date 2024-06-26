import { Effect } from 'effect';
import * as z from 'zod';

const Funnel = z.object({
    name: z.string(),
    limit: z.number(),
    color: z.string(),
    emoji: z.string().emoji(),
    id: z.string(),
    remainder: z.number(),
});

export type Funnel = z.infer<typeof Funnel>;

export const parseFunnel = (data: unknown) => Effect.try(() => Funnel.parse(data));

const FunnelCreate = Funnel.omit({ id: true });

export type FunnelCreate = z.infer<typeof FunnelCreate>;

export const parseFunnelCreate = (data: unknown) => Effect.try(() => FunnelCreate.parse(data));

export const gsToFunnel = (cols: string[]) => Effect.try({
    try: () => Funnel.parse({
        name: cols[0],
        limit: parseFloat(cols[1]),
        color: cols[2],
        emoji: cols[3],
        id: cols[4],
        remainder: parseFloat(cols[5]),
    }),
    catch: e => e instanceof Error ? e : new Error('Could not parse funnel')
});

export const funnelCreateToGs = (id: string, funnel: FunnelCreate) =>
    [funnel.name, funnel.limit, funnel.color, funnel.emoji, id, funnel.remainder];

export const funnelToGs = (funnel: Funnel) =>
    [funnel.name, funnel.limit, funnel.color, funnel.emoji, funnel.id, funnel.remainder];
