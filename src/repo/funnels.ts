import { Effect } from "effect";
import { Funnel, FunnelCreate, funnelCreateToGs, funnelToGs, gsToFunnel } from "../dto/funnel";
import { uuidv7 } from "uuidv7";
import { createRepo } from "./gsheetsEntity";
import { get } from "../lib/get";

export const funnelRepo = createRepo<Funnel, FunnelCreate>({
    rangeLeft: 'A',
    rangeRight: 'E',
    idColumn: 'E',
    rowsOffset: 2,
    gsToValue: gsToFunnel,
    valueToGs: funnel => Effect.sync(() => funnelToGs(funnel)),
    valueCreateToGs: funnelCreate => Effect.sync(() => uuidv7()).pipe(Effect.map(id => funnelCreateToGs(id, funnelCreate))),
    getId: get('id'),
});

