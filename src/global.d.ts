declare namespace JSX {
    interface HtmlTag {
        inputmode?: undefined | 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
    }
    interface HtmlButtonTag {
        formaction?: string
    }
}
