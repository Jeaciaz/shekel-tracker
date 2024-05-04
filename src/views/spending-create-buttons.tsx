import { Funnel } from "../dto/funnel";
import { createLoader } from "./load";

type SpendingCreateButtonsProps = {
    funnels: Funnel[];
}
export const SpendingCreateButtons = Object.assign(function ({ funnels }: SpendingCreateButtonsProps) {
    return (
        <div id={SpendingCreateButtons.id} class="grid grid-cols-2">
            {funnels.map(funnel => (
                <button
                    class="py-2 active:brightness-75"
                    style={{ backgroundColor: funnel.color }}
                    type="submit"
                    formaction={`/create-spending/${funnel.name}`}
                >{funnel.emoji}</button>
            ))}
        </div>
    );
}, { id: 'spending-create-buttons' })

export const LoadSpendingCreateButtons = createLoader({
    id: SpendingCreateButtons.id,
    url: '/view/spending-create-buttons',
});
