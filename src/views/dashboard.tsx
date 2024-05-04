import { FunnelsView, LoadFunnelsView } from "./funnels-view";
import { IconRefresh } from "./icons/icon-refresh";
import { LoadSpendingCreateButtons } from "./spending-create-buttons";
import { LoadSpendingsHistory } from "./spendings-history";

type DashboardProps = {
}

export const Dashboard = ({}: DashboardProps) => {
    return (
        <main class="px-4 py-8 flex flex-col h-screen dark:bg-slate-700 dark:text-slate-700">
            <header class="flex justify-between items-center">
                <h1 class="text-4xl">₪ Tracker</h1>
                <div class="flex">
                    <button
                        class="p-1"
                        aria-label="refresh"
                        hx-get="/view/funnels-view"
                        hx-target={`#${FunnelsView.id}`}
                        hx-indicator={`#${FunnelsView.id}`}
                        hx-swap="outerHTML"
                    >
                        <IconRefresh />
                    </button>
                </div>
            </header>
            <div class="mt-6 flex flex-col flex-grow">
                <form method="post" class="flex flex-col gap-4 flex-grow">
                    <LoadFunnelsView />
                    <input
                        class="p-2 rounded border border-slate-300 min-w-0 dark:bg-slate-600 dark:border-0 w-full text-2xl"
                        inputmode="decimal"
                        placeholder="20.5"
                        name="amount"
                        pattern="^\\d*\\.?\\d+$"
                    />
                    <LoadSpendingCreateButtons />
                    <div class="relative grow">
                        <div class="absolute inset-0 overflow-y-auto flex flex-col">
                            <LoadSpendingsHistory />
                        </div>
                    </div>
                </form>
            </div>
        </main>
    );
};
