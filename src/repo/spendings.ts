import { Effect } from "effect";
import { Spending, SpendingCreate, gsToSpending, spendingCreateToGs, spendingToGs } from "../dto/spending";
import { createRepo } from "./gsheetsEntity";
import { uuidv7 } from "uuidv7";
import { get } from "../lib/get";

export const spendingsRepo = createRepo<Spending, SpendingCreate>({
    rangeLeft: 'M',
    rangeRight: 'P',
    idColumn: 'P',
    rowsOffset: 2,
    gsToValue: gsToSpending,
    valueToGs: spending => Effect.sync(() => spendingToGs(spending)),
    valueCreateToGs: spendingCreate => Effect.sync(() => uuidv7()).pipe(Effect.map(id => spendingCreateToGs(id, spendingCreate))),
    getId: get('id'),
});

