import { Effect, Option, pipe } from "effect";
import { appendRange, clearRange, getRanges, writeRanges } from "../gsheets";

type GsCol = string | number;

type RepoProps<T, TCreate> = {
    rangeLeft: string;
    rangeRight: string;
    rowsOffset: number;
    idColumn: string;
    gsToValue: (arg: string[]) => Effect.Effect<T, unknown>;
    valueToGs: (value: T) => Effect.Effect<GsCol[]>;
    valueCreateToGs: (valueCreate: TCreate) => Effect.Effect<GsCol[]>;
    getId: (v: T) => string;
}

type BaseArgs = {
    spreadsheetId: string;
    tableName: string;
}

type GetArgs = BaseArgs

type GetIndexArgs = BaseArgs & {
    id: string;
}

type SetArgs<T> = BaseArgs & {
    value: T;
}

type InsertArgs<T> = BaseArgs & {
    value: T;
}

type DeleteArgs = BaseArgs & {
    id: string;
}

export const createRepo = <T, TCreate>({
    rangeLeft,
    rangeRight,
    rowsOffset,
    idColumn,
    gsToValue,
    valueToGs,
    valueCreateToGs,
    getId,
}: RepoProps<T, TCreate>) => {
    const get = ({ spreadsheetId, tableName }: GetArgs) => pipe(
        getRanges({
            spreadsheetId,
            tableName,
            ranges: [ `${rangeLeft}${rowsOffset}:${rangeRight}` ],
        }),
        Effect.map(ranges => ranges?.[0]?.values),
        Effect.flatMap(Option.fromNullable),
        Effect.map(rows => rows.filter(row => row.length && row.every(Boolean))),
        Effect.flatMap(Effect.forEach(row => gsToValue(row)))
    );
    const getIndex = ({ spreadsheetId, tableName, id }: GetIndexArgs) => pipe(
        getRanges({ spreadsheetId, tableName, ranges: [`${idColumn}${rowsOffset}:${idColumn}`] }),
        Effect.map(ranges => ranges?.[0]?.values),
        Effect.flatMap(Option.fromNullable),
        Effect.map(rows => rows.findIndex(row => row?.[0] == id))
    );
    const set = ({ spreadsheetId, tableName, value }: SetArgs<T>) => Effect.gen(function*(_) {
        const index = yield* _(getIndex({ spreadsheetId, tableName, id: getId(value) }));
        const gsValue = yield* _(valueToGs(value));
        return yield* _(writeRanges({
            spreadsheetId,
            tableName,
            ranges: {
                [`${rangeLeft}${index + rowsOffset}:${rangeRight}${index + rowsOffset}`]: [gsValue],
            }
        }));
    });
    const insert = ({ spreadsheetId, tableName, value }: InsertArgs<TCreate>) => valueCreateToGs(value).pipe(Effect.flatMap(
        gsValue => appendRange({
            spreadsheetId,
            tableName,
            range: `${rangeLeft}${rowsOffset}:${rangeRight}${rowsOffset}`,
            values: [gsValue]
        })));
    const delete_ = ({ spreadsheetId, tableName, id }: DeleteArgs) => getIndex({ spreadsheetId, tableName, id }).pipe(Effect.flatMap(
        index => clearRange({ spreadsheetId, tableName, range: `${rangeLeft}${index+rowsOffset}:${rangeRight}${index+rowsOffset}`})
    ));

    return { get, getIndex, set, insert, delete: delete_ };
}

