/***
 * Declarasi input khusus pada aplikasi wms, agar konsisten
 */

namespace app.ui {
    /**
     * Input quantity
     * 
     * @export
     * @param {HTMLElement} elm 
     * @param {TInputFieldOpt} option 
     * @returns 
     */
    export function inputQty(elm: HTMLElement, option?: TInputWholeOpt) {
        var input = ui.inputWhole(elm, option);
        app.addClass(input.inputElm, 'input-qty');

        return input;
    }

    type TInputSNOpt = TInputFieldOpt & {
        /**
         * Use wildcard or not
         */
        wildcard?:boolean
    };

    /**
     * Input serial number
     * 
     * @export
     * @param {HTMLElement} elm 
     * @param {TInputFieldOpt} option 
     * @returns 
     */
    export function inputSN(elm: HTMLElement, option?: TInputSNOpt) {
        if(!option){
            option = {};
        }
        option.transform = "upper";
        var input = ui.input(elm, option);
        app.addClass(input.inputElm, 'input-sn');

        if(option.wildcard){
            //with wildcard
            input.pattern('[-0-9A-Za-z%]*');
        }else{
            input.pattern('[-0-9A-Za-z]*');
        }
        

        return input;
    }

    type TInputBatchOpt = TInputFieldOpt & {
        /**
         * Use wildcard or not
         */
        wildcard?:boolean
    };

    /**
     * Input batch number
     * 
     * @export
     * @param {HTMLElement} elm 
     * @param {TInputFieldOpt} option 
     * @returns 
     */
    export function inputBN(elm: HTMLElement, option?: TInputBatchOpt) {
        if(!option){
            option = {};
        }
        option.transform = "upper";
        var input = ui.input(elm, option);
        app.addClass(input.inputElm, 'input-bn');
    
        if(option.wildcard){
            //with wildcard
            input.pattern('[-0-9A-Za-z%]*');
        }else{
            input.pattern('[-0-9A-Za-z]*');
        }

        return input;
    }
}