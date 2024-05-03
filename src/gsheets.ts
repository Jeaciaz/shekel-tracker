import { authenticate } from '@google-cloud/local-auth';
import { OAuth2Client } from 'google-auth-library'
import { promises } from 'fs';
import { google } from 'googleapis';
import path from 'path';
import process from 'process';
import { pipe, pipeline } from 'ts-pipe-compose';
import { Effect } from 'effect';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

type ValueInputOption = 'RAW' | 'USER_ENTERED';

export type GsCol = string | number;

const emitErrorOr = (unknownText: string) => (e: unknown): Error =>
    new Error(`${unknownText}: ${e instanceof Error ? e.message : JSON.stringify(e)}`)

// TODO This must later be reimplemented to not be file-based, and should work for any given google user
const readFile = (path: string) => Effect.tryPromise({
    try: () => promises.readFile(path, 'utf8'),
    catch: emitErrorOr(`Error reading file on ${path}`)
});

const writeFile = (path: string, contents: string) => Effect.tryPromise({
    try: () => promises.writeFile(path, contents),
    catch: emitErrorOr(`Error writing to file on ${path}`)
})

const loadSavedCredentialsIfExist = readFile(TOKEN_PATH)
    .pipe(Effect.map(pipeline(JSON.parse, google.auth.fromJSON))) as Effect.Effect<OAuth2Client, Error>; // google.auth.fromJSON returns wrong type

const saveCredentials = (client: OAuth2Client) => Effect.gen(function*(_) {
    const content = yield* _(readFile(CREDENTIALS_PATH));
    const keys = yield* _(Effect.try({
        try: () => JSON.parse(content),
        catch: emitErrorOr('Could not parse credentials')
    }));
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });
    yield* writeFile(TOKEN_PATH, payload);
});

const authenticateE = Effect.tryPromise({
    try: () => authenticate({ scopes: SCOPES, keyfilePath: CREDENTIALS_PATH }),
    catch: emitErrorOr('Failed to authenticate to google sheets'),
});

const authorize = pipe(
    loadSavedCredentialsIfExist,
    Effect.orElse(() => pipe(
        authenticateE,
        Effect.tap(saveCredentials)
    ))
);

type GetRangesArgs = {
    spreadsheetId: string;
    tableName: string;
    ranges: Array<string>;
}

export const getRanges = ({
    spreadsheetId,
    tableName,
    ranges,
}: GetRangesArgs) => pipe(
    authorize,
    Effect.map(auth => google.sheets({ version: 'v4', auth })),
    Effect.flatMap(sheets => Effect.tryPromise({
        try: () => sheets.spreadsheets.values.batchGet({ spreadsheetId, ranges: ranges.map(r => `${tableName}!${r}`) })
            .then(result => result.data.valueRanges),
        catch: emitErrorOr('Could not get ranges from google sheets')
    }))
);

// Apparently values.append does not work properly when there is a gap in data :\
// ====================
type AppendRangeArgs = {
    spreadsheetId: string;
    tableName: string;
    range: string;
    values: GsCol[][];
    valueInputOption?: ValueInputOption;
}

export const appendRange = ({
    spreadsheetId,
    tableName,
    range,
    values,
    valueInputOption = 'RAW',
}: AppendRangeArgs) => pipe(
    authorize,
    Effect.map(auth => google.sheets({ version: 'v4', auth })),
    Effect.flatMap(sheets => Effect.tryPromise({
        try: () => sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${tableName}!${range}`,
            valueInputOption,
            requestBody: { values },
        }),
        catch: emitErrorOr('Could not append to range')
    })),
);

type ClearRangeArgs = {
    spreadsheetId: string;
    tableName: string;
    range: string;
}

export const clearRange = ({
    spreadsheetId,
    tableName,
    range,
}: ClearRangeArgs) => pipe(
    authorize,
    Effect.map(auth => google.sheets({ version: 'v4', auth })),
    Effect.flatMap(sheets => Effect.tryPromise({
        try: () => sheets.spreadsheets.values.clear({ spreadsheetId, range: `${tableName}!${range}` }),
        catch: emitErrorOr(`Failed to clear range ${range}`)
    }))
)

type WriteRangesArgs = {
    spreadsheetId: string;
    tableName: string;
    ranges: Record<string, GsCol[][]>;
    valueInputOption?: ValueInputOption;
}

export const writeRanges = ({
    spreadsheetId,
    tableName,
    ranges,
    valueInputOption = 'RAW',
}: WriteRangesArgs) => pipe(
    authorize,
    Effect.map(auth => google.sheets({ version: 'v4', auth })),
    Effect.flatMap(sheets => Effect.tryPromise({
        try: () => sheets.spreadsheets.values.batchUpdate({
            spreadsheetId,
            requestBody: {
                data: Object.keys(ranges).map(range => ({ range: `${tableName}!${range}`, values: ranges[range] })),
                valueInputOption,
            }
        }),
        catch: emitErrorOr('Could not write values to google sheets'),
    })),
)
