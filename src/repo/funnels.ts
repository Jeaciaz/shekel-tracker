import { Effect, pipe, Option } from "effect";
import { clearRange, getRanges, writeRanges } from "../gsheets";
import { Funnel, FunnelCreate, funnelCreateToGs, funnelToGs, gsToFunnel } from "../dto/funnel";
import { uuidv7 } from "uuidv7";

const FUNNELS_RANGE_LEFT = 'A';
const FUNNELS_RANGE_RIGHT = 'E';
const ROWS_OFFSET = 2;
const FUNNELS_RANGE = `${FUNNELS_RANGE_LEFT}${ROWS_OFFSET}:${FUNNELS_RANGE_RIGHT}`;
const FIRST_EMPTY_ROW_RANGE = 'Z6';

const _SPREADSHEET_ID_TEMP = '1uXFBpCiKD1rzxi9DM-0rkpCR7g8SgivsT9A6aTIQAN8';

export const getFunnels = (period: string) => pipe(
    getRanges({
        spreadsheetId: _SPREADSHEET_ID_TEMP,
        tableName: period,
        ranges: [FUNNELS_RANGE],
    }),
    Effect.map(ranges => ranges?.[0]?.values),
    Effect.flatMap(Option.fromNullable),
    Effect.map(rows => rows.filter(row => row.length && row.every(Boolean))),
    Effect.flatMap(Effect.forEach(gsToFunnel))
);

export const getFunnelIndex = (period: string, funnelId: string) => getFunnels(period).pipe(Effect.map(
    funnels => funnels.findIndex(({ id }) => id === funnelId)
));

export const setFunnel = (period: string, funnel: Funnel, index: number) => writeRanges({
    spreadsheetId: _SPREADSHEET_ID_TEMP,
    tableName: period,
    ranges: {
        [`${FUNNELS_RANGE_LEFT}${index+ROWS_OFFSET}:${FUNNELS_RANGE_RIGHT}${index+ROWS_OFFSET}`]: [funnelToGs(funnel)],
    }
})

export const insertFunnel = (period: string, funnel: FunnelCreate) => Effect.gen(function*(_) {
    const id = yield* _(Effect.try(() => uuidv7()));
    const [[rowIndex]] = yield* _(pipe(
        getRanges({
            spreadsheetId: _SPREADSHEET_ID_TEMP,
            tableName: period,
            ranges: [FIRST_EMPTY_ROW_RANGE]
        }),
        Effect.map(ranges => ranges?.[0]?.values),
        Effect.flatMap(Option.fromNullable))
    );
    return yield* _(writeRanges({
        spreadsheetId: _SPREADSHEET_ID_TEMP,
        tableName: period,
        ranges: {
            [`${FUNNELS_RANGE_LEFT}${rowIndex}:${FUNNELS_RANGE_RIGHT}${rowIndex}`]: [funnelCreateToGs(id, funnel)]
        }
    }));
});

export const deleteFunnel = (period: string, id: string) => getFunnelIndex(period, id).pipe(Effect.flatMap(
    index => clearRange({
        spreadsheetId: _SPREADSHEET_ID_TEMP,
        tableName: period,
        range: `${FUNNELS_RANGE_LEFT}${index+ROWS_OFFSET}:${FUNNELS_RANGE_RIGHT}${index+ROWS_OFFSET}`,
    })
))
