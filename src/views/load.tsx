import { IconSpinner } from "./icons/icon-spinner";

type LoadProps = {
    id: string;
    url: string;
    trigger?: string;
}

export const Load = ({ id, url, trigger = 'load' }: LoadProps) => (
    <div id={id} hx-get={url} hx-trigger={trigger}><IconSpinner /></div>
)

export const createLoader = (props: LoadProps) => () => <Load {...props} />
