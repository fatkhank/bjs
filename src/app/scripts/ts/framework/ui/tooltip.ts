namespace app.ui {
    'use strict';

    /**
     * Create tooltip to elm
     * @param elm
     * @param tooltip
     */
    export function tooltip(elm: HTMLElement, tooltip) {
        if (tooltip === false) {
            app.remAttr(elm, 'title');
        } else {
            app.attr(elm, 'title', tooltip);
        }
    };
}