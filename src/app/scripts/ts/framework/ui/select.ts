namespace app.ui {
    var w = <any>window;
    var selectSample = app.grabSample(".p-select")
        , liSample = app.grabSample(selectSample, "li");
    ;
    const LABEL_DEFAULT = "label";
    const VALUE_DEFAULT = "value";

    type TOption = {
        label: string,
        value: any
    };

    type TSelectElm<V> = HTMLElement & {
        pselectval: V
    };

    export type TSelectOption = TInputOpt & {
        options?: any[] | Promise<any[]>,
        optionLabel?: string,
        optionValue?: string,
    };

    export class Select<V = any> extends Input {
        private ulElm: HTMLUListElement;
        private previewElm: HTMLElement;
        private _fromuser = false;

        private _opt: TSelectOption;

        constructor(elm: HTMLElement, previewElm: HTMLElement, ulElm: HTMLUListElement) {
            super(elm);
            var _ = this;
            _.previewElm = previewElm;
            _.ulElm = ulElm;
        }
        opt(option: TSelectOption) {
            var _ = this;
            _._opt = option;
            if (option) {
                if (Array.isArray(option)) option = { options: option };
                if (option.options) {
                    var result = option.options;
                    var useLabel = option.optionLabel;
                    var useValue = option.optionValue;

                    if (typeof option.options == "function") {
                        result = option.options();
                    }

                    if (result instanceof app.Cache) {
                        result.getMany().then(function (data) {
                            _.addOptions(data, useValue, useLabel);
                        });
                    } else if ((<any>option.options).then) {//promise hack
                        (<any>result).then(function (data) {
                            _.addOptions(data, useValue, useLabel);
                        });
                    } else {
                        _.addOptions(<any[]>result, useValue, useLabel);
                    }
                }
            }
            return super.opt(option);
        }

        val(val?: V): V | void {
            var _ = this;
            var ulElm = _.ulElm;
            var elm = _.elm;
            if (val !== undefined) {
                //deselect previous
                app.remClass(app.s(ulElm, ".active") || ulElm, "active");
                //set val
                (<TSelectElm<V>>elm).pselectval = val;

                var previewTxt = "";
                var lis = app.sa(ulElm, "li");
                for (var i = 0; i < lis.length; i++) {
                    var li = lis[i];
                    if ((<TSelectElm<V>>li).pselectval == val) {
                        previewTxt = li.innerHTML;

                        //select choosen
                        app.setClass(li, "active");

                        //trigger onchange
                        _.onchange(_, val, !!_._fromuser);
                        delete _._fromuser;

                        break;
                    }
                }

                //display
                if (_.previewElm instanceof HTMLInputElement) {
                    _.previewElm.value = previewTxt;
                } else {
                    _.previewElm.innerHTML = previewTxt;
                }
            } else return (<TSelectElm<V>>elm).pselectval;
        }

        enable(isEnable) {
            var _ = this;
            if (isEnable !== undefined) {
                app.setClass(_.elm, "disabled", !isEnable);
                app.setClass(_.previewElm, "disabled", !isEnable);
            } else return !app.hasClass(_.elm, "disabled");
        }

        /**
         * Clear options
         */
        empty() {
            app.empty(this.ulElm);
            app.setClass(this.ulElm, "empty");
        }
        addOption(opt: TOption, useValue?: string, useLabel?: string) {
            var _ = this;
            var ulElm = _.ulElm;
            if (typeof opt == "string") opt = { label: opt, value: opt };

            var liElm = app.clone(liSample);
            liElm.innerHTML = opt[useLabel || LABEL_DEFAULT];

            var value = opt[useValue || VALUE_DEFAULT];
            if (value !== undefined) (<any>liElm).pselectval = value;
            ulElm.appendChild(liElm);

            app.click(liElm, function (liElm, e) {
                if (_._fromuser !== undefined) _._fromuser = true;//hack
                _.val(value);

                e.stopPropagation();
                return false;
            }, false);
            app.onKeyEnter(liElm, function () { liElm.click(); });

            //select first jika belum ada
            if (_._opt && (_._opt.required !== false) && ((<any>_.elm).pselectval === undefined)) {
                _._fromuser = false;//hack
                liElm.click();
            }

            //tidak lagi kosong
            app.remClass(ulElm, "empty");
        }

        addOptions(options: TOption[], useValue?: string, useLabel?: string) {
            var _ = this;
            for (var i = 0; i < options.length; i++) {
                _.addOption(options[i], useValue, useLabel);
            }

            //jika tiba2 ada yang cocok dengan value
            if ((<any>_.elm).pselectval) {
                _._fromuser = false;//hack
                _.val((<any>_.elm).pselectval);
            }
        }

        /**
         * select option/liElm; if no param, will select first options if avail
         */
        select(optionElmOrIndex?: HTMLElement | number) {
            var _ = this;
            //cari elemen pertama
            var optionElm = optionElmOrIndex;
            if (typeof optionElmOrIndex == "number") {
                optionElm = app.s(_.ulElm, "li:nth-child(" + (optionElmOrIndex + 1) + ")");
            }
            if (!optionElm) optionElm = app.s(_.ulElm, "li");

            return optionElm ? _.val((<any>optionElm).pselectval) : null;
        }
    }

    /**
     * Create select input
     * @param elm
     * @param option
     */
    export function select(elm: HTMLElement, option?: TSelectOption) {
        var selectElm = app.clone(selectSample);
        app.replace(elm, selectElm, true);

        var ulElm = <HTMLUListElement>app.s(selectElm, "ul");
        var previewElm = app.s(selectElm, "button");
        if (!(elm instanceof HTMLSelectElement)) {
            previewElm.remove();//remove default button
            previewElm = elm;
            selectElm.insertBefore(previewElm, ulElm);
            //make focusable
            app.attr(previewElm, "tabindex", 0);
        }

        var obj = new Select(selectElm, previewElm, ulElm);

        //scan default options
        var optionElms = app.sa(elm, "option");
        for (var i = 0; i < optionElms.length; i++) {
            var opt = optionElms[i];
            obj.addOption({
                label: opt.innerHTML,
                value: app.attr(opt, "value") || opt.innerHTML
            });
        }

        //set default option
        if (previewElm instanceof HTMLInputElement) {
            (<any>selectElm).pselectval = previewElm.value || undefined;
        }

        //add row nav
        app.onArrowUp(selectElm, function (selectElm, ev) {
            var selected = app.s(selectElm, "li:focus") || app.s(selectElm, "li.active");
            selected = <HTMLElement>(selected.previousElementSibling || selected);
            if (app.hasClass(ulElm, "on")) selected.focus();
            else selected.click();
            return false;
        }, true);
        app.onArrowDown(selectElm, function (selectElm, ev) {
            var selected = app.s(selectElm, "li:focus") || app.s(selectElm, "li.active");
            selected = <HTMLElement>(selected.nextElementSibling || selected);
            if (app.hasClass(ulElm, "on")) selected.focus();
            else selected.click();
            return false;
        }, true);

        //open ul on click
        function showUl(btnElm, e) {
            if (app.hasClass(selectElm, "disabled")
                || (app.hasClass(ulElm, "on")))
                return;
            app.setClass(ulElm, "on");

            setTimeout(function () {
                function hide(ev) {
                    if (app.sup(ev.target, "button") != btnElm) {
                        app.remClass(ulElm, "on");
                        w.$(document).off("click", hide);
                    }
                }
                w.$(document).on("click", hide);
                //focus first
                (app.s(ulElm, "li:first-child") || btnElm).focus();
            });
        }
        app.click(previewElm, showUl);
        app.onKeyEnter(previewElm, showUl);

        return obj.opt(option);
    };
}