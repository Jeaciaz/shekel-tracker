import { html } from "@elysiajs/html";
import { staticPlugin } from "@elysiajs/static";
import { Elysia } from "elysia";
import { Effect } from "effect";
import * as z from 'zod';
import { funnelRepo } from "./repo/funnels";
import { parseFunnel, parseFunnelCreate } from "./dto/funnel";
import swagger from "@elysiajs/swagger";
import { spendingsRepo } from "./repo/spendings";
import { SPENDING_DATETIME_FORMAT, displaySpending, parseSpending, parseSpendingCreate } from "./dto/spending";
import './lib/dayjs';
import { Dashboard } from "./views/dashboard";
import { FunnelsView, RELOAD_FUNNELS } from "./views/funnels-view";
import { SpendingCreateButtons } from "./views/spending-create-buttons";
import dayjs from "dayjs";
import { SpendingsHistory } from "./views/spendings-history";

const _TEMP_SPREADSHEET_ID = '1uXFBpCiKD1rzxi9DM-0rkpCR7g8SgivsT9A6aTIQAN8';
const _TEMP_TABLE_NAME = '04.2024';

const app = new Elysia()
    .use(html())
    .use(staticPlugin())
    .use(swagger())
    .onError(console.log)
    .get('/', () => (
        <BaseHtml>
            <h1>This is a work in progress. You can visit dashboard for now.</h1>
            <h2><a class="text-blue-500" href="/dashboard">Go to dashboard!</a></h2>
        </BaseHtml>
    ))
    .get('/dashboard', () => (
        <BaseHtml>
            <Dashboard />
        </BaseHtml>
    ))

    .group('/view', app =>
        app
            .get('/funnels-view', () => Effect.runPromise(
                funnelRepo.get({
                    spreadsheetId: _TEMP_SPREADSHEET_ID,
                    tableName: _TEMP_TABLE_NAME,
                }).pipe(Effect.map(funnels => <FunnelsView funnels={funnels} />))
            ))
            .get('/spending-create-buttons', () => Effect.runPromise(
                funnelRepo.get({
                    spreadsheetId: _TEMP_SPREADSHEET_ID,
                    tableName: _TEMP_TABLE_NAME,
                }).pipe(Effect.map(funnels => <SpendingCreateButtons funnels={funnels} />))
            ))
            .get('/spendings-history', () => Effect.runPromise(Effect.all([
                funnelRepo.get({
                    spreadsheetId: _TEMP_SPREADSHEET_ID,
                    tableName: _TEMP_TABLE_NAME,
                }),
                spendingsRepo.get({
                    spreadsheetId: _TEMP_SPREADSHEET_ID,
                    tableName: _TEMP_TABLE_NAME,
                })
            ], { concurrency: 'unbounded'}).pipe(Effect.map(
                ([funnels, spendings]) => <SpendingsHistory funnels={funnels} spendings={spendings} />
            ))))
    )

    .post('/create-spending/:funnelName', ({ body, params: { funnelName }, ...ctx }) => Effect.runPromise(Effect.gen(function*(_) {
        const { amount } = yield* _(Effect.try(() => z.object({ amount: z.string() }).parse(body)));
        const spendingCreate = yield* _(parseSpendingCreate({
            funnel_name: funnelName,
            amount: parseFloat(amount),
            datetime: dayjs().format(SPENDING_DATETIME_FORMAT)
        }));
        yield* spendingsRepo.insert({
            spreadsheetId: _TEMP_SPREADSHEET_ID,
            tableName: _TEMP_TABLE_NAME,
            value: spendingCreate,
        });
        ctx.set.redirect = '/dashboard';
    })))
    .delete('/spending/:spendingId', ({ params: { spendingId }, set }) => Effect.runPromise(spendingsRepo.delete({
        spreadsheetId: _TEMP_SPREADSHEET_ID,
        tableName: _TEMP_TABLE_NAME,
        id: spendingId,
    }).pipe(Effect.map(() => {
        set.headers['HX-Trigger'] = RELOAD_FUNNELS;
        return undefined;
    }))))

    .group('/api', app =>
        app.group('/funnels', app =>
            app
                .get('/', () => Effect.runPromise(funnelRepo.get({
                    spreadsheetId: _TEMP_SPREADSHEET_ID,
                    tableName: _TEMP_TABLE_NAME,
                })))
                .post('/', ({ body }) => Effect.runPromise(
                    parseFunnelCreate(body).pipe(Effect.flatMap(funnel => funnelRepo.insert({
                        spreadsheetId: _TEMP_SPREADSHEET_ID,
                        tableName: _TEMP_TABLE_NAME,
                        value: funnel,
                    })))
                ))
                .put('/', ({ body }) => Effect.runPromise(parseFunnel(body).pipe(Effect.flatMap(funnel => funnelRepo.set({
                    spreadsheetId: _TEMP_SPREADSHEET_ID,
                    tableName: _TEMP_TABLE_NAME,
                    value: funnel,
                })))))
                .delete('/:id', ({ params: { id } }) => Effect.runPromise(funnelRepo.delete({
                    spreadsheetId: _TEMP_SPREADSHEET_ID,
                    tableName: _TEMP_TABLE_NAME,
                    id,
                })))
        )
            .group('/spendings', app =>
                app
                    .get('/', () => Effect.runPromise(spendingsRepo.get({
                        spreadsheetId: _TEMP_SPREADSHEET_ID,
                        tableName: _TEMP_TABLE_NAME,
                    }).pipe(Effect.map(spendings => spendings.map(displaySpending)))))
                    .post('/', ({ body }) => Effect.runPromise(
                        parseSpendingCreate(body).pipe(Effect.flatMap(spending => spendingsRepo.insert({
                            spreadsheetId: _TEMP_SPREADSHEET_ID,
                            tableName: _TEMP_TABLE_NAME,
                            value: spending,
                        })))
                    ))
                    .put('/', ({ body }) => Effect.runPromise(parseSpending(body).pipe(Effect.flatMap(spending => spendingsRepo.set({
                        spreadsheetId: _TEMP_SPREADSHEET_ID,
                        tableName: _TEMP_TABLE_NAME,
                        value: spending,
                    })))))
                    .delete('/:id', ({ params: { id } }) => Effect.runPromise(spendingsRepo.delete({
                        spreadsheetId: _TEMP_SPREADSHEET_ID,
                        tableName: _TEMP_TABLE_NAME,
                        id,
                    })))
            ))
    .listen(3000);

type BaseHtmlProps = {
    children: Html.Children;
}

function BaseHtml({ children }: BaseHtmlProps) {
    return (
        <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Shekel Tracker</title>
                <script src="https://unpkg.com/htmx.org@1.9.12"></script>
                <link href="/public/styles.css" rel="stylesheet" />
            </head>
            <body>
                {children}
            </body>
        </html>
    );
}
console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
