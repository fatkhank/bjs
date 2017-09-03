namespace app {
    export class View {
        /**
         * Element bound to view
         */
        elm: HTMLElement;

        constructor(elm: HTMLElement) {
            this.elm = elm;
        }

        /**
         * Callback on show
         */
        onShown(trigger?, param?) {
            //todo
            return null;
        };

        /**
         * Trigger show view
         */
        show(path?: string){
            let _ = this;
            state.view(_);
            _.onShown();
        }

        /**
         * Get route to current state
         */
        getRoute(): string {
            return "";
        }

        init(path:string){
            //do nothing
        }
    }
}