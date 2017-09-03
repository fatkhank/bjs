namespace app.ui {
    export type TInputFieldOpt = TInputOpt & {
        maxlength?: number,
        minlength?: number,
        transform?: "upper" | "lower"
    };

    export class InputField<V = string> extends Input<V> {
        inputElm: HTMLInputElement;

        constructor(elm?: HTMLElement, inputElm?: HTMLInputElement) {
            super(elm);
            var _ = this;

            _.elm = elm;
            _.inputElm = inputElm;
            _.inputElm.onchange = function () {
                _.onchange(this, <any>inputElm.value, true);
            };
        }

        val(val?: V): V {
            var inputElm = this.inputElm;
            if (val !== undefined) {
                inputElm.value = <any>val;
                this.onchange(this, val, false);
            }
            return <any>inputElm.value;
        }

        opt(option: TInputFieldOpt) {
            let _ = this;
            if (option) {
                //default disable attribute
                if (hasAttr(_.inputElm, "disabled")) {
                    let disabled = attr(_.inputElm, "disabled");
                    _.enable(disabled === "false");
                }

                if (option.transform == "lower") {
                    //intercept alphabet
                    app.onKeyUp(_.inputElm, KEYS.ALPHA, function (elm, ev) {
                        let val = _.inputElm.value;
                        _.inputElm.value = val ? val.toLowerCase() : null;
                    });
                } else if (option.transform == "upper") {
                    //intercept alphabet
                    app.onKeyUp(_.inputElm, KEYS.ALPHA, function (elm, ev) {
                        let val = _.inputElm.value;
                        _.inputElm.value = val ? val.toUpperCase() : null;
                    });
                }
            }
            return super.opt(option);
        }

        enable(isEnable?: boolean): boolean | void {
            var inputElm = this.inputElm;
            if (isEnable !== undefined) {
                if (isEnable) inputElm.removeAttribute("disabled");
                else inputElm.setAttribute("disabled", "1");
            }
            return !inputElm.hasAttribute("disabled");
        };

        focus() {
            this.inputElm.focus();
        }

        required(isRequired?: boolean): (boolean | void) {
            //todo maybe wrong
            // if (this.inputElm.required) {
            //     app.attr(this.inputElm, "disabled")
            //     this.inputElm.enable(isRequired);
            // } else {
            if (isRequired) app.attr(this.inputElm, "required", "1");
            else app.remAttr(this.inputElm, "required");
            // }
            return app.hasAttr(this.inputElm, "required")
        };

        placeholder(placeholder) {
            if (placeholder !== undefined) {
                app.attr(this.elm, "placeholder", placeholder);
            }
            return app.attr(this.elm, "placeholder");
        };

        /**
         * Get or set pattern
         */
        pattern(pattern: string) {
            if (pattern !== undefined) {
                app.attr(this.elm, "pattern", pattern);
            }
            return app.attr(this.elm, "pattern");
        };

        /**
         * Cek if valid
         */
        isValid() {
            return this.inputElm.validity.valid && !app.hasClass(this.elm, "invalid");
        };

        /**
         * Set valid status
         */
        setValid(isValid: boolean) {
            app.setClass(this.elm, "invalid", !isValid);
        }
    }

    //----- input textfield
    /**
     * Input textfield
     * @param elm
     * @param option
     */
    export function input(elm: HTMLElement, option?: TInputFieldOpt) {
        var obj = new InputField(elm, <HTMLInputElement>elm);
        app.addClass(elm, "input");

        obj.opt(option);

        //another option
        if (option) {
            if (option.maxlength) {
                app.attr(obj.inputElm, "maxlength", option.maxlength);
            }
        }

        return obj;
    };

    //----- input bilangan cacah
    var inputWholeSample = app.grabSample(".input-whole");
    export type TInputWholeOpt = TInputFieldOpt & {
        max?: number,
        min?: number
    };
    export class InputWhole extends InputField<number> {
        val(val?: number) {
            var input = this.inputElm;
            if (val !== undefined) input.valueAsNumber = val;
            return input.value && parseInt(input.value);
        }

        min(number?: number): number {
            var input = this.inputElm;
            if (number !== undefined) {
                app.attr(input, "min", number);
            } else {
                var num = app.attr(input, "min");
                return num && parseInt(num);
            }
        };

        max(number?: number): number {
            var input = this.inputElm;
            if (number !== undefined) {
                app.attr(input, "max", number);
            } else {
                var num = app.attr(input, "max");
                return num && parseInt(num);
            }
        };

        opt(option: TInputWholeOpt) {
            if (option) {
                if (option.min) this.min(option.min);
                if (option.max) this.max(option.max);
            }
            return super.opt(option);
        }

    }
    /**
     * Whole number/bilangan cacah
     * @param elm
     * @param option
     */
    export function inputWhole(elm, option?: TInputWholeOpt) {
        var sampleClone = app.clone(inputWholeSample);
        var input = <HTMLInputElement>app.s(sampleClone, "input");
        app.replace(elm, sampleClone);

        return new InputWhole(sampleClone, input).opt(option);
    };

    //----- input float
    var inputFloatSample = app.grabSample(".input-float");
    export type TInputFloatOpt = TInputFieldOpt & {
        step?: number,
        max?: number,
        min?: number
    };

    export class InputFloat extends InputField<number> {
        val(val?: number) {
            var input = this.inputElm;
            if (val !== undefined) input.valueAsNumber = val;
            return input.value ? parseFloat(input.value) : null;
        }
        opt(option: TInputFloatOpt) {
            var inputElm = this.inputElm;

            if (option) {
                if (!option.required) inputElm.value = null;
                if (option.step) app.attr(inputElm, "step", option.step);
            }
            return super.opt(option);
        }

        min(number: number) {
            var input = this.inputElm;
            if (number !== undefined) {
                app.attr(input, "min", number);
            } else {
                var num = app.attr(input, "min");
                return num && parseInt(num);
            }
        };

        max(number: number) {
            var input = this.inputElm;
            if (number !== undefined) {
                app.attr(input, "max", number);
            } else {
                var num = app.attr(input, "max");
                return num && parseInt(num);
            }
        };
    }

    /**
     * Create input for float number
     * @param elm
     * @param option
     */
    export function inputFloat(elm, option?: TInputFloatOpt) {
        var sampleClone = app.clone(inputFloatSample);
        var input = <HTMLInputElement>app.s(sampleClone, "input");
        app.replace(elm, sampleClone);

        return new InputFloat(sampleClone, input).opt(option);
    };

    //----- input percent
    var inputPercentSample = app.grabSample(".input-percent");
    export type TInputPercentOption = TInputFieldOpt & {
        native?: boolean,
        /**
         * Step of percentage
         */
        step?: number,
    };
    export class InputPercent extends InputField<number> {
        scale = 100;
        _opt: TInputPercentOption;
        constructor(elm: HTMLElement, inputElm) {
            super(elm, inputElm);
            var _ = this;

            inputElm.onchange = function () {
                _.onchange(_, parseFloat(inputElm.value) / _.scale, true);
            };
        }
        /**
         * Get value normalize (100% = 1)
         */
        val(val?: number) {
            var _ = this;
            var input = this.inputElm;
            if (val !== undefined) {
                //set value
                input.value = val === null ? null : ((val * _.scale).toFixed(_._opt.step)).toString();
                _.onchange(_, val, false);
            } else {
                return input.value ? parseFloat(input.value) / _.scale : null;
            }
        }
        opt(option: TInputPercentOption) {
            if (option) {
                var _ = this;
                _._opt = option;

                //set step
                if (!option.step) option.step = 2;

                var inputElm = _.inputElm;
                _.scale = option.native ? 1 : 100;
                inputElm.value = option.required ? "0.0" : null;
                if (option.step) app.attr(inputElm, "step", option.step);
            }
            return super.opt(option);
        }
    }

    /**
     * Create input for percentage
     * @param elm
     * @param option
     */
    export function inputPercent(elm, option?: TInputPercentOption) {
        var sampleClone = app.clone(inputPercentSample);
        var input = <HTMLInputElement>app.s(sampleClone, "input");
        app.replace(elm, sampleClone);

        return new InputPercent(sampleClone, input).opt(option || {});
    };

    //----- input text multiple line
    var inputTextSample = app.grabSample(".input-text");

    export class InputText extends Input {
        constructor(elm: HTMLElement) {
            super(elm);
            var _ = this;

            elm.onblur = function (e) {
                if (_.required()) {
                    app.setClass(elm, "invalid", !(elm.innerHTML && elm.innerHTML.trim()));
                }
                _.onchange(_, elm.innerHTML, true);
            };
        }
        val(val?) {
            var _ = this;
            var elm = this.elm;
            if (val !== undefined) {
                elm.innerText = val;
                if (_.required()) {
                    app.setClass(elm, "invalid", !val);
                }
            }
            return elm.innerText;
        }
        focus() { this.elm.focus(); };
        enable(isEnable?: boolean): boolean | void {
            var _ = this;
            if (isEnable !== undefined) {
                app.attr(_.elm, "contenteditable", isEnable);
            }
            return app.attr(_.elm, "contenteditable") == "true";
        };

        required(isRequired?: boolean): (boolean | void) {
            var elm = this.elm;
            if (isRequired !== undefined) {
                app.setClass(elm, "required", isRequired);
                app.setClass(elm, "invalid", isRequired && !(elm.innerHTML && elm.innerHTML.trim()));
            } else return app.hasClass(elm, "required");
        };

    }

    /**
     * Input text multiline
     * @param elm
     * @param option
     */
    export function inputText(elm, option?: TInputFieldOpt) {
        var sampleClone = app.clone(inputTextSample);
        app.replace(elm, sampleClone);

        return new InputText(sampleClone).opt(option);
    };

    /**
     * Create email input
     * @param elm
     * @param option
     */
    export function inputEmail(elm: HTMLElement, option?: TInputFieldOpt) {
        var obj = app.ui.input(elm, option);
        app.attr(obj.inputElm, "type", "email");
        return obj;
    };

    /**
     * Create input for phone number
     * @param elm
     * @param option
     */
    export function inputPhone(elm, option?: TInputFieldOpt) {
        var obj = app.ui.input(elm, option);
        app.attr(obj.inputElm, "type", "tel");
        app.attr(obj.inputElm, "pattern", "[+]?[0-9 ()-]*");
        return obj;
    };

    //----- html as input
    /**
     * HTML gettable value
     * @param elm
     * @param selector
     */
    export function valhtml<V = string>(elm: HTMLElement, selector: string): IInput<V> {
        if (selector) elm = app.s(elm, selector);
        (<any>elm).val = function (html) {
            if (html !== undefined) elm.innerHTML = html;
            return elm.innerHTML
        };
        return <any>elm;
    };

    //----- input extensions
    (function () {
        (<any>HTMLButtonElement.prototype).val = function (v) { if (v != undefined) { this.value = v; } return this.value; };
        (<any>HTMLButtonElement.prototype).enable = function (e) {
            var _ = this;
            if (e != undefined) {
                if (e) _.removeAttribute("disabled");
                else _.setAttribute("disabled", 1);
            }
            return !_.hasAttribute("disabled");
        };

        (<any>HTMLButtonElement.prototype).enable = function (e) {
            var _ = this;
            if (e != undefined) {
                if (e) _.removeAttribute("disabled");
                else _.setAttribute("disabled", 1);
            }
            return !_.hasAttribute("disabled");
        };
    })();

    //----- input & preview json
    var jsonViewerSample = app.grabSample(".view-json")
        , jsonDefaultPropSample = app.grabSample(jsonViewerSample, ".prop")
        ;

    export type TJSONViewerOption = TInputOpt & {
        propSample?: HTMLElement,
        customElm?: boolean
    };

    export class JSONViewer extends Input {
        data: null;
        private ps: HTMLElement;
        constructor(elm: HTMLElement) {
            super(elm);
            this.ps = app.s(elm, ".prop") || jsonDefaultPropSample;
        }
        val(val?) {
            var _ = this;
            if (val !== undefined) {
                _.data = val;
                _.reload();
            } else return _.data;
        }
        opt(option: TJSONViewerOption) {
            if (option) {
                if (option.propSample) this.ps = option.propSample;
            }
            return super.opt(option);
        }
        reload() {
            var _ = this;
            var val = _.data;
            try {
                //_.elm.innerHTML = "";
                //clear prop
                var props = app.sa(_.elm, ".prop");
                for (let i = 0; i < props.length; i++) {
                    props[i].remove();
                }

                if (val === null) return;
                //tampilkan isi yang baru
                var jsonMsg = (typeof val == "object") ? val : JSON.parse(val);
                for (var i in jsonMsg) {
                    var vk = app.clone(_.ps);
                    app.s(vk, ".key").innerHTML = i;
                    app.s(vk, ".val").innerHTML = jsonMsg[i];
                    _.elm.appendChild(vk);
                }
            } catch (e) {
                _.elm.innerHTML = val || "";
            }
        };
    }

    /**
     * Create json viewer
     * @param elm
     * @param option
     */
    export function json(elm, option?: TJSONViewerOption) {
        var sampleClone = elm;
        if (!option.customElm) {
            sampleClone = app.clone(jsonViewerSample);
            app.replace(elm, sampleClone, true, true);
        }

        return new JSONViewer(sampleClone).opt(option);
    };
}