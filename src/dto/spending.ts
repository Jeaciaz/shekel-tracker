import { Effect } from 'effect';
import dayjs from 'dayjs';
import * as z from 'zod';

export const SPENDING_DATETIME_FORMAT = 'H:mm, DD.MM.YYYY';

const Spending = z.object({
    funnel_name: z.string(),
    amount: z.number(),
    datetime: z.string().transform((dt, ctx) => {
        const dtjs = dayjs(dt, SPENDING_DATETIME_FORMAT);
        if (!dtjs.isValid())
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Invalid spending date',
            })
        return dtjs;
    }),
    id: z.string(),
});

const SpendingCreate = Spending.omit({ id: true });

export type Spending = z.infer<typeof Spending>;

export type SpendingCreate = z.infer<typeof SpendingCreate>;

export const parseSpending = (data: unknown) => Effect.try(() => Spending.parse(data));

export const parseSpendingCreate = (data: unknown) => Effect.try(() => SpendingCreate.parse(data));

export const gsToSpending = (cols: string[]) => parseSpending({
    funnel_name: cols[0],
    amount: parseFloat(cols[1].replace(',', '.')),
    datetime: cols[2],
    id: cols[3],
});

export const displaySpending = ({datetime, ...spending}: Spending) => ({
    ...spending,
    datetime: datetime.format(SPENDING_DATETIME_FORMAT),
});

export const spendingToGs = (spending: Spending) => 
    [spending.funnel_name, spending.amount, spending.datetime.format(SPENDING_DATETIME_FORMAT), spending.id];

export const spendingCreateToGs = (id: string, spending: SpendingCreate) =>
    [spending.funnel_name, spending.amount, spending.datetime.format(SPENDING_DATETIME_FORMAT), id];
