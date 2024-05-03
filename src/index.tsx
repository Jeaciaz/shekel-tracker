import { html } from "@elysiajs/html";
import { staticPlugin } from "@elysiajs/static";
import { Elysia } from "elysia";
import { Effect } from "effect";
import { funnelRepo } from "./repo/funnels";
import { parseFunnel, parseFunnelCreate } from "./dto/funnel";
import swagger from "@elysiajs/swagger";
import { spendingsRepo } from "./repo/spendings";
import { displaySpending, parseSpending, parseSpendingCreate } from "./dto/spending";
import './lib/dayjs';

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
            <h1>dashboard</h1>
            <button class="text-lg" hx-post="/clicked" hx-swap="innerHtml">
                I was not clicked
            </button>
        </BaseHtml>
    ))
    .post('/clicked', () => <p>I was clicked</p>)

    .group('/funnels', app => 
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
    )
    .listen(3000);

type BaseHtmlProps = {
    children: Html.Children;
}

function BaseHtml({children}: BaseHtmlProps) {
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
