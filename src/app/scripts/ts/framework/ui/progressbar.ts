namespace app.ui {
    var sample = app.grabSample(".progress");

    export function progress(percentage: number): HTMLElement;
    export function progress(done: number, total: number): HTMLElement;

    /**
     * Create progerss bar
     * @param percentageOrDone
     * @param total
     */
    export function progress(percentageOrDone: number, total?: number): HTMLElement {
        var clone = app.clone(sample);
        let percentage = percentageOrDone;

        //there is total, display both done and total
        if (total) {
            //has total
            app.s(clone, "label").innerHTML = (percentageOrDone + "/" + total);

            //calculate percentage
            percentage = 100 * parseFloat(<any>(total ? percentageOrDone / total : percentageOrDone));
            percentage = Math.min(100, parseFloat(percentage.toFixed(2)));
        } else {
            //no total, first param is percentage
            app.s(clone, "label").innerHTML = percentageOrDone + "%";
        }

        //display percentage
        app.s(clone, ".bar").style.width = percentage + "%";
        return clone;
    }
}