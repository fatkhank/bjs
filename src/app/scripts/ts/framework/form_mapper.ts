//--- form mapper
namespace app {
    let counter = 1;
    const ATTR_GET = "_get";
    const ATTR_SET = "_set";
    const ATTR_SKIP = "_skip";

    function mapData(form, data, parent = null, propName = null) {
        if (form instanceof Array) {
            if (data instanceof Array) parent[propName] = data;
        } else if (typeof form == 'object') {
            if (form.setVal) {
                //has val override
                form.setVal(data);
            } else if (form.val) {
                //has val override
                form.val(data);
            } else if (form.constructor.name.startsWith('HTML')) {
                if (data !== null && data.constructor.name.startsWith('HTML')) {
                    form.innerHTML = '';
                    form.appendChild(data);
                } else form.innerHTML = data;
            } else {
                //set individoal object props
                for (var d in data) {
                    var value = data[d];

                    var input = form[d], obj = form;
                    if (input === undefined) {
                        input = (obj = form._set) && form._set[d];//trust me
                    }

                    //direct prop
                    if (input !== undefined) {
                        if (input == null) {
                            obj[d] = value;
                        } else {
                            if (input.setVal) input.setVal((value === undefined) ? '' : value);
                            else if (input.val) {
                                input.val((value === undefined) ? '' : value);
                            } else if (typeof input == 'function') {

                            } else if (typeof input == 'object') {
                                mapData(input, value, form, d);
                            } else {
                                //empty variable
                                obj[d] = value;
                            }
                        }
                    }
                }
            }
        } else if (typeof form != 'function') {
            //pure value
            if (form.setVal) form.setVal((data === undefined) ? '' : data);
            else if (form.val) form.val((data === undefined) ? '' : data);
        }
    }

    function extractData(form, depth, includeSet, option, invalid: () => void = null) {
        if (depth == 0) return null;
        if (form instanceof Array) {
            var arrayPayload = [];
            for (var index = 0; index < form.length; index++) {
                var prop = form[index];

                var type = typeof prop;
                if (prop == null || (type != 'object' && type != 'function')) {
                    arrayPayload.push(prop);
                } else {
                    if (invalid && prop.validate) {
                        var validateRes = prop.validate();
                        if (validateRes) invalid();
                    }
                    if (prop.getVal) {
                        arrayPayload.push(prop.getVal(option));
                    } else if (prop.val) {
                        arrayPayload.push(prop.val());
                    } else if (!prop.constructor.name.startsWith('HTML')) {
                        //parse if not an html element
                        arrayPayload.push(extractData(prop, depth - 1, includeSet, option));
                    }
                }
            }
            return arrayPayload;
        } else if (typeof form == 'object') {
            //if has valoverride, return value
            if (form.getVal) return form.getVal(option);
            if (form.val) return form.val();

            //parse each props
            var payload = {};
            for (var f2 in form) {
                if (f2 == ATTR_SKIP || (f2 == ATTR_SET && !includeSet)) continue;

                if (f2 == ATTR_GET) {
                    let formGet = form[ATTR_GET];
                    for (var f2 in formGet) {
                        var prop = formGet[f2];
                        var type = typeof prop;
                        if (prop == null || (type != 'object' && type != 'function')) {
                            payload[f2] = prop;
                        } else if (prop.val) {
                            payload[f2] = prop.val();
                        } else if (!prop.constructor.name.startsWith('HTML')) {
                            //parse if not an html element
                            payload[f2] = extractData(prop, depth - 1, includeSet, option);
                        }
                    }
                    continue;
                }
                var prop = form[f2];
                var type = typeof prop;

                if (prop == null || (type != 'object' && type != 'function')) {
                    //pure value
                    payload[f2] = prop;
                } else if (prop.getVal) {
                    payload[f2] = prop.getVal(option);
                } else if (prop.val) {
                    payload[f2] = prop.val();
                } else if (!prop.constructor.name.startsWith('HTML')) {
                    //parse if not an html element
                    payload[f2] = extractData(prop, depth - 1, includeSet, option);
                }
            }
            return payload;
        } else if (typeof form == 'function') {
            return form();
        }

        //pure value
        return form;
    }

    type TTraverseState = {
        depth: number;
        name?: string;
        value?: any;
        underSet?: boolean;
        underGet?: boolean;
        underSkip?: boolean;
    };
    type TTraverseCommand = "next" | "stop" | "lookin";
    type TTraverseOpt = {
        withSet?: boolean,
        withGet?: boolean,
        withSkip?: boolean
    };

    function traverse(form,
        process: (state: TTraverseState) => TTraverseCommand,
        state = <TTraverseState>{}) {

        //if reach bottom, stop
        if (state.depth == 0) return null;

        if (typeof form == 'object') {
            //parse each props
            for (var propName in form) {
                state.name = propName;
                state.value = form[propName];
                let command = process(state);
                if (command == "stop") {
                    return;
                } else if (command == "lookin") {
                    traverse(state.value, process, {
                        depth: state.depth - 1,
                        underGet: state.underGet,
                        underSet: state.underSet,
                        underSkip: state.underSkip
                    });
                }
            }
        } else {
            let command = process(state);
            if (command == "stop") {
                return;
            } else if (command == "lookin") {
                traverse(state.value, process, {
                    depth: state.depth - 1,
                    underGet: state.underGet,
                    underSet: state.underSet,
                    underSkip: state.underSkip
                });
            }
        }
    }

    export class Mapper<T>{
        id = 'm' + counter++;
        private map(formElm: HTMLElement): T { return <T>null; };
        private v: (form: T) => boolean

        constructor(mapperFunc: (formElm: HTMLElement) => T, validator: (form: T) => boolean) {
            this.map = mapperFunc;
            this.v = validator;
        }

        /**
         * Mendapatkan form yang terikat pada suatu elm
         * 
         * @param {HTMLElement} elm 
         * @returns {T} 
         * 
         * @memberof Mapper
         */
        get(elm: HTMLElement): T {
            let formElm = <any>elm;
            var form = (formElm.pam || (formElm.pam = {}))[this.id];
            if (!form) {
                form = formElm.pam[this.id] = this.map(formElm || {});
            }
            return form;
        }

        /**
         * Mendapatkan data dari suatu form atau elm
         * 
         * @param {(HTMLElement | T)} formOrElm 
         * @param {any} data 
         * 
         * @memberof Mapper
         * 
         */
        setData(formOrElm: HTMLElement | T, data) {
            let form = this.formify(formOrElm);
            mapData(form, data);
        }

        getData(formOrElm: HTMLElement | T, additionalPayload?, option?: { withSet: boolean }) {
            if (!option) option = <any>{};
            let form = this.formify(formOrElm);
            //option.withSkip tidak dipake, karena _skip selalu hilang
            var payload = extractData(form, 5, option.withSet, option);
            if (additionalPayload) for (var name in additionalPayload) payload[name] = additionalPayload[name];

            return payload;
        }

        /**
         * Lakukan 
         * 
         * @param {(HTMLElement | T)} formOrElm 
         * @param {boolean} [notif=true] 
         * @returns {boolean} 
         * 
         * @memberof Mapper
         */
        validate(formOrElm: HTMLElement | T, notif = true): boolean {
            if (this.v) {
                let form = this.formify(formOrElm);
                let valid = this.v(form);
                if (!valid && notif) {
                    app.ui.notifError(app.getText('form_invalid_msg'))
                }
                return valid;
            }
            return true;
        }
        private formify(formOrElm: HTMLElement | T) {
            var form: T = <any>formOrElm;
            if (formOrElm instanceof HTMLElement) {
                form = this.get(formOrElm);
            }
            return form;
        }

        /**
         * 
         */
        traverseInput(formOrElm: HTMLElement, process: (input: Input, state?: TTraverseState) => void, opt = <TTraverseOpt>{}) {
            traverse(this.formify(formOrElm), function (state) {
                if ((state.name == ATTR_GET) && (opt.withGet === false)) return 'next';
                if ((state.name == ATTR_SET) && (opt.withSet === false)) return 'next';
                if ((state.name == ATTR_SKIP) && (opt.withSkip === false)) return 'next';

                if (state.value instanceof Input) {
                    process(state.value, state);
                }else if(state.value instanceof Object){
                    return "lookin";
                }
                return 'next';
            }, { depth: 10 });
        }
    }

    export function mapper<T>(mapperFunc: (elm: HTMLElement) => T, validateFunc?: (form: T) => boolean) {
        return new Mapper<T>(mapperFunc, validateFunc);
    };
}

namespace app {
    type TListMapperOpt<T> = {
        sampleElm: HTMLElement,
        parentElm: HTMLElement;
        setData: (HTMLElement, T) => void,
        getData: (HTMLElement) => T,
    };

    export class ListMapper<T>{
        elms: HTMLElement[];
        opt: TListMapperOpt<T>;
        constructor(option: TListMapperOpt<T>) {
            this.elms = [];
            this.opt = option;
        }
        val(data?) {
            var _ = this;
            if (data !== undefined) {
                _.setData(data);
            } else return _.getData();
        }

        setData(data) {
            var _ = this;
            _.elms = [];
            _.clear();

            for (var i = 0; i < data.length; i++) {
                var itemElm = app.clone(_.opt.sampleElm);
                if (_.opt.setData) _.opt.setData(itemElm, data[i]);
                _.opt.parentElm.appendChild(itemElm);
                _.elms.push(itemElm);
            }
        }

        /**
         * Clear content
         */
        clear() {
            app.empty(this.opt.parentElm, function (child) {
                return app.hasClass(child, 'persist');
            });
        }

        getData() {
            var _ = this;
            var data = [];
            for (var i = 0; i < _.elms.length; i++) {
                data.push(_.opt.getData(_.elms[i]));
            }
            return data;
        }
    }

    export function listMapper(option) {
        //default ambil anak pertama sebagai sample elm
        if (!option.sampleElm) {
            option.sampleElm = option.parentElm.firstElementChild;
        }
        return new ListMapper(option);
    };
}