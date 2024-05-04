import { Funnel } from "../dto/funnel";
import { Spending, displaySpending } from "../dto/spending"
import { createLoader } from "./load";

type SpendingsHistoryProps = {
    spendings: Spending[]
    funnels: Funnel[]
}

const getFunnel = (funnels: Funnel[], name: string) => funnels.find(funnel => funnel.name === name);

export const SpendingsHistory = Object.assign(function({ spendings, funnels }: SpendingsHistoryProps) {
    return (
        <div 
            id={SpendingsHistory.id}
            class="flex flex-col-reverse"
        >
            {spendings.map(displaySpending).map(spending => (
                <div
                    class="flex gap-2 py-4 border-b border-slate-300 dark:border-slate-500 active:backdrop-invert backdrop-opacity-10"
                    hx-delete={`/spending/${spending.id}`}
                    hx-confirm="Are you sure you want to delete this spending?"
                    hx-swap="outerHTML"
                >
                    <div>{getFunnel(funnels, spending.funnel_name)?.emoji || '❓'}</div>
                    <div>{spending.amount}</div>
                    <div class="ms-auto">{spending.datetime}</div>
                </div>
            ))}
        </div>
    );
}, { id: 'spendings-history' });

export const LoadSpendingsHistory = createLoader({
    id: SpendingsHistory.id,
    url: '/view/spendings-history',
});
