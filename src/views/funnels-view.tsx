import { Funnel } from "../dto/funnel"
import { createLoader } from "./load";

type FunnelsViewProps = {
    funnels: Funnel[];
};

export const RELOAD_FUNNELS = 'reloadFunnels';

export const FunnelsView = Object.assign(function({ funnels }: FunnelsViewProps) {
    return (
        <div id={FunnelsView.id} class="grid grid-cols-12 gap-2 items-end">
            {funnels.map(funnel => (
                <>
                    <div class="col-span-2 text-sm">{funnel.name}</div>
                    <div class="col-span-8 text-center text-lg relative">
                        <div class="pb-1">{funnel.remainder}</div>
                        <div class="absolute bottom-0 h-1 rounded" style={{ backgroundColor: funnel.color, opacity: 0.33, width: '100%' }} />
                        <div
                            class="absolute bottom-0 h-1 rounded"
                            style={{ backgroundColor: funnel.color, opacity: 0.67, width: `${100 * funnel.remainder / funnel.limit}%` }}
                        />
                    </div>
                    <div class="col-span-2 text-sm text-end">{funnel.limit}</div>
                </>
            ))}
        </div>
    )
}, { id: 'funnels-view' });

export const LoadFunnelsView = createLoader({
    id: FunnelsView.id,
    url: '/view/funnels-view',
    trigger: `load, ${RELOAD_FUNNELS} from:body`,
});
