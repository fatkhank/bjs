namespace app.ui {
    var displaySample = app.grabSample(".money")
        , inputSample = app.grabSample(".input-money");
    ;

    export class UIMoney {
        static defaultCurrency = ""
    }

    export class MoneyViewer implements IInput {
        elm: HTMLElement;
        private _value = null;
        constructor(elm, currency: string, amount: number) {
            this.elm = elm;
            var _ = this;

            //default
            if (amount !== undefined) _.val(amount);
            else _.val("0");

            _.currency(UIMoney.defaultCurrency);
            if (currency !== undefined) _.currency(currency);
        }
        val(val?) {
            var _ = this;
            var amount = app.s(_.elm, ".amount");
            if (val !== undefined) {
                _._value = val ? parseFloat(val) : null;
                amount.innerHTML = app.ui.formatMoney(_._value);
            }
            return _._value;
        };

        /**
         * Get or set currency
         */
        currency(c) {
            var currencyElm = app.s(this.elm, ".symbol");
            if (c !== undefined) currencyElm.innerHTML = c;
            return currencyElm.innerHTML;
        };
    }

    /**
     * Create elm to display money
     * @param elm if not null, will replace that
     * @param amount
     * @param currency
     */
    export function money(elm: HTMLElement = null, amount?: number, currency?: string) {
        var sampleClone = app.clone(displaySample);
        if (elm) app.replace(elm, sampleClone);

        return new MoneyViewer(sampleClone, currency, amount);
    };


    export type TInputMoneyOption = TInputFloatOpt & {
        currency?: string,
        step?: number
    };
    export class InputMoney extends InputFloat {
        private displayElm: HTMLElement;
        constructor(elm: HTMLElement, inputElm: HTMLInputElement) {
            super(elm, inputElm);
            var _ = this;

            _.currency(UIMoney.defaultCurrency);

            //setup display
            _.displayElm = s(elm, ".display");
            app.onKeyUp(inputElm, app.KEYS.ANY, function (btn, ev) {
                if (inputElm.valueAsNumber) {
                    switch (ev.which) {
                        case KEYS.K.which:
                        case KEYS.T.which:
                            //add thousand
                            inputElm.valueAsNumber *= 1000;
                            break;
                        case KEYS.H.which:
                        case KEYS.R.which:
                            //add hundred
                            inputElm.valueAsNumber *= 100;
                            break;
                        case KEYS.M.which:
                            //add million
                            inputElm.valueAsNumber *= 1000000;
                            break;
                    }
                }

                _.refresh();
            });
            app.click(_.displayElm, function () {
                inputElm.focus();
            }, true);
        }

        val(val?: number) {
            var input = this.inputElm;
            if (val !== undefined) {
                input.valueAsNumber = val;
                this.refresh();
            } else return input.value ? parseFloat(input.value) : null;
        };

        opt(option?: TInputMoneyOption) {
            var _ = this;
            if (option) {
                if (option.currency) _.currency(option.currency);
                if (option.step) _.step(option.step);

                //default
                if (option.required) this.inputElm.value = "0";
            }
            return super.opt(option);
        }

        /**
         * Get or set currency
         */
        currency(c) {
            app.s(this.elm, ".symbol").innerHTML = (typeof (c) == "string") ? c : c.code;
        };

        /**
         * Refresh display
         */
        refresh() {
            this.displayElm.innerHTML = this.inputElm.value ? formatMoney(this.inputElm.valueAsNumber) : "-";
        }

        /**
         * Get or set step
         */
        step(step) {
            var input = this.inputElm;
            if (step !== undefined) {
                app.attr(input, "step", step);
            } else return app.attr(input, "step");
        };
    }

    /**
     * Create money input
     * @param elm
     * @param option
     */
    export function inputMoney(elm, option?: TInputMoneyOption) {
        var sampleClone = app.clone(inputSample);
        var input = <HTMLInputElement>app.s(sampleClone, "input");

        app.replace(elm, sampleClone);

        return new InputMoney(sampleClone, input).opt(option);
    };

    /**
     * Number.prototype.format(n, x, s, c). From http://jsfiddle.net/hAfMM/612/
     *
     * @param integer n: length of decimal
     * @param integer x: length of whole part
     * @param mixed   s: sections delimiter
     * @param mixed   c: decimal delimiter
     */
    function doFormatMoney(value, n: number, x: number, s: string, c: string) {
        var re = "\\d(?=(\\d{" + (x || 3) + "})+" + (n > 0 ? "\\D" : "$") + ")",
            num = value.toFixed(Math.max(0, ~~n));

        return (c ? num.replace(".", c) : num).replace(new RegExp(re, "g"), "$&" + (s || ","));
    };

    /**
     * Format money with
     * @param value
     */
    export function formatMoney(value): string {
        var res = parseFloat(value)
        return doFormatMoney(isNaN(res) ? 0 : res, 2, 3, ".", ",");
    }
}