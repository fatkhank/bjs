namespace app.ui {
    //----- checkbox
    var checkboxSample = app.grabSample('.i-check');
    var CLASS_CHECKED = 'checked';

    export class UICheckbox {
        /**
         * Get/set check state
         * @param elm
         * @param isChecked
         */
        static check(elm: any, isChecked?: boolean) {
            if (elm.pcheck) {
                elm.pcheck.checked(isChecked);
            }
        }
    }

    export type TCheckboxOption = TInputOpt & {
        /**
         * The size of checkbox
         */
        size?: "small"
    };

    export class Checkbox extends Input {
        btn: HTMLButtonElement;
        constructor(elm, input) {
            super(elm);
            var _ = this;

            this.btn = input;

            input.onclick = function () {
                if (app.hasClass(input, CLASS_CHECKED)) {
                    app.remClass(input, CLASS_CHECKED);
                    _.onchange(_, false, true);
                } else {
                    app.addClass(input, CLASS_CHECKED);
                    _.onchange(_, true, true);
                }
            };
        }

        val(val?: boolean) {
            var button = this.btn;
            if (val !== undefined) {
                app.setClass(button, CLASS_CHECKED, val === true);
            }
            return app.hasClass(button, CLASS_CHECKED);
        }

        opt(option: TCheckboxOption) {
            if (option) {
                if (option.size) {
                    var elm = this.elm;
                    switch (option.size) {
                        case 'small':
                            app.addClass(elm, 'small');
                            break;
                        default:
                            app.remClass(elm, 'small');
                            break;
                    }
                }
            }
            return super.opt(option);
        }

        /**
         * Get or set checked
         */
        checked(isChecked?: boolean) {
            var _ = this;
            var input = _.btn;
            if (isChecked !== undefined) {
                if (isChecked) {
                    app.addClass(input, CLASS_CHECKED);
                    _.onchange(_, true, false);
                } else {
                    app.remClass(input, CLASS_CHECKED);
                    _.onchange(_, false, false);
                }
            } else return app.hasClass(input, CLASS_CHECKED);
        };
    }

    /**
     * Grab elm as checkbox
     * @param elm
     * @param option
     */
    export function checkbox(elm: any, option?: TCheckboxOption): Checkbox {
        if (elm.pcheck) return elm.pcheck;//init once
        var sampleClone = app.clone(checkboxSample);

        var input = <HTMLButtonElement>app.s(sampleClone, "button");
        app.replace(elm, sampleClone, true, true);

        var obj = new Checkbox(sampleClone, input);
        //hook
        (<any>sampleClone).pcheck = obj;

        //cek jika ada label
        var label = <HTMLElement>sampleClone.nextElementSibling;
        if (label && ((label.tagName == 'LABEL') || (label.tagName == 'B'))) {
            label.onclick = input.onclick;
        }

        return obj.opt(option);
    };
}