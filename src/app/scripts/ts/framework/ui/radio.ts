namespace app.ui {
    //----- radio
    var sample = app.grabSample('.i-radio')
        , CLASS_CHECKED = 'checked'
        ;

    var counter = 0;

    export class Radio extends Input {
        private static counter = 0;
        name: string;
        inputs = {};
        private valElm: HTMLElement;

        private _enable = true;

        constructor() {
            super(null);
            var _ = this;

            _.name = 'radio' + counter++;
            _.inputs = {};
        }

        val(value?) {
            var _ = this;
            if (value !== undefined) {
                //uncheck old
                if (_.valElm) app.remClass(_.valElm, CLASS_CHECKED);
                _.valElm = _.inputs[value];
                if (_.valElm) app.addClass(_.valElm, CLASS_CHECKED);

                _.onchange(_, value, false);
            }
            return (_.valElm && (<any>_.valElm).pval);
        }

        enable(isEnable) {
            var _ = this;
            if (isEnable !== undefined) {
                for (var i in _.inputs) {
                    var input = _.inputs[i];
                    if (isEnable) app.remAttr(input, 'disabled');
                    else app.attr(input, 'disabled', true);
                }
                _._enable = isEnable;
            }
            return _._enable;
        };

        /**
         * Select radio elm
         * @param radioElm 
         */
        select(radioElm: HTMLElement) {
            this.val((<any>radioElm).pval);
        };

        /**
         * Add new elm
         */
        add(target) {
            var elm, val, label;
            var obj = this;

            if (target.constructor.name.startsWith('HTML')) {
                elm = target;
                val = app.attr(elm, 'value');
            } else {
                elm = target.elm;
                val = target.val;
                label = target.label;
            }

            var sampleClone = app.clone(sample);
            var input = <any>app.s(sampleClone, "button");
            app.replace(elm, sampleClone, true, true);

            //label
            if (label) {
                app.s(sampleClone, 'label').innerHTML = label;
            }

            app.attr(input, 'name', obj.name);
            if (val !== undefined) {
                obj.inputs[val] = input;
                input.pradio = obj;
                input.pval = val;
                app.click(input, function (inputElm) {
                    inputElm.pradio.select(inputElm);
                }, true);

                //trigger label click
                if (label) {
                    app.s(sampleClone, 'label').onclick = function () {
                        input.click();
                    };
                }
            }
        }

        /**
         * Override this func to intercept onchange
         */
        onchange(inputObj:Radio, value, isFromUser:boolean) { };
    }

    export function radio(elms, option: TInputOpt) {
        var obj = new Radio();
        for (var i = 0; i < elms.length; i++) obj.add(elms[i]);
        return obj.opt(option);
    };
}