import { html } from "@elysiajs/html";
import { staticPlugin } from "@elysiajs/static";
import { Elysia } from "elysia";
import { Effect } from "effect";
import { deleteFunnel, getFunnelIndex, getFunnels, insertFunnel, setFunnel} from "./repo/funnels";
import { parseFunnel, parseFunnelCreate } from "./dto/funnel";
import swagger from "@elysiajs/swagger";

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

    .get('/funnels', () => Effect.runPromise(getFunnels('04.2024')))
    .post('/funnels', ({ body }) => Effect.runPromise(
        parseFunnelCreate(body).pipe(Effect.flatMap(funnel => insertFunnel('04.2024', funnel)))
    ))
    .put('/funnels', ({ body }) => Effect.runPromise(Effect.gen(function*(_) {
        const funnel = yield* _(parseFunnel(body));
        const index = yield* _(getFunnelIndex('04.2024', funnel.id));
        return yield* _(setFunnel('04.2024', funnel, index));
    })))
    .delete('/funnels/:id', ({ params: { id } }) => Effect.runPromise(deleteFunnel('04.2024', id)))
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
