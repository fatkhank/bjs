namespace app.ui {
    var TAG_NAME = "p-chooser"
        , ROWS_CONTAINER_SELECTOR = ".ch-item-container"
        , ROW_ELM_SELECTOR = ".ch-item"
        , SEARCH_FIELD_SELECTOR = ".ch-search"

        , ROW_CHECKED = "ch-ek"
        , STATUS_BAR = ".ch-status"
        , STATUS_COUNT = ".ch-count"
        , STATUS_SELECTED = ".ch-selected"

        , TAG_ROW = "p-r";
    ;

    var inputSample = app.grabSample(TAG_NAME);
    //var selectOptionSample = app.grabSample(inputSample, "option");//remove

    //init dialog
    var dialogSample = app.grabSample(".chooser-dialog");

    app.onStarting(function () {
        app.lang.scan(dialogSample);
    });

    var rowSample = app.grabSample(dialogSample, ROW_ELM_SELECTOR);
    var rowCellSample = app.grabSample(rowSample, ".ch-v");

    type TFetchParam<P> = P & {
        props?: "all" | string[];
        skip?: number;
        count?: number;
    };
    type TFetchResult<D> = {
        total: number;
        data: D[];
        skip: number;
    };

    type TChooserRowElm = HTMLElement & {
        chItem: any;
    };

    export type TChooserOption<D, P, V> = {
        /**
         * Column to render in table. Overridable!
         */
        columns?: { title: string, val: string | ((data: D) => (string | HTMLElement | Text)), classes?: string[] }[];

        /**
         * Fetch function
         */
        fetch?: (param: TFetchParam<P>, fromUser?: boolean) => Promise<TFetchResult<D>>;

        defaultFetchParam?: TFetchParam<P>;
        defaultVal?: D;

        /**
         * Column yang dijadikan nilai
         */
        key?: string;
        title?: string;

        /**
         * Fetch count
         */
        paging?: number;

        /**
         * Fill rowElm with data when reloading
         */
        fillRow?: (rowElm: HTMLElement, data: D) => void;

        display?: string | ((data: D) => string);

        /**
         * Default focus when window open. Option : ["row", "search"]
         */
        focus?: string;

        /**
         * Show in full mode or not
         */
        full?: boolean;

        /**
         * Class to append too chooser dialog
         */
        classes?: string[];

        /**
         * Use custom dialog
         */
        dialog?: {
            def: HTMLElement | DialogDef | Dialog | Part,
            moreParam?: (dialogObj: ChooserDialogWrapper<D, P, V>, existingParam: TFetchParam<P>) => TFetchParam<P>,
            oncreate?: (dialog: ChooserDialog<D, P, V>) => void
        };

        /**
         * Search param
         */
        search?: {
            txt?: string,
            filterParam?: any//todo type
        };

        /**
         * Mengecek apakah suatu entry bisa dipilih atau tidak
         */
        choosable?: (datum: D, param?: TFetchParam<P>) => boolean;

        addData?: (reload: () => void) => void
    };

    class ChooserDialog<D, P, V> extends Dialog {
        chooser: ChooserDialogWrapper<D, P, V>;
        input: ChooserInput<D, P, V>;
    }

    export type TChooserDialogWrapper<D, P, V> = ChooserDialogWrapper<D, P, V>;

    class ChooserDialogWrapper<D, P, V>{
        def: Chooser<D, P, V>;
        private fetchParam: TFetchParam<P>;
        private oriFetchParam: TFetchParam<P>;
        private skip: 0;
        dialog: ChooserDialog<D, P, V>;

        private fresh = true;
        input: ChooserInput<D, P, V>;

        /**
         * Triggered when dialog closed without result
         */
        oncancel = function () { };

        /**
         * Triggered when dialog closed with result
         */
        onvalue = function (valueObj) { };

        private opt: TChooserOpenParam<D, P, V>;

        constructor(def: Chooser<D, P, V>, dialog: ChooserDialog<D, P, V>, option: TChooserOpenParam<D, P, V>) {
            var _ = this;
            _.def = def;
            _.dialog = dialog;

            //atur ui
            var btnEmpty = app.s(dialog.contentElm, "[btn=empty]")
            app.show(btnEmpty, option && !option.required);
            btnEmpty.innerHTML = (option.input && option.input.nullTxt) || app.getText("empty");
        }

        reset(fetchParam: TFetchParam<P>, option: TChooserOpenParam<D, P, V>) {
            var _ = this;
            _.opt = option || <TChooserOpenParam<D, P, V>>{};
            var dialog = _.dialog;

            var oldDialogObj = dialog.chooser;
            var oldDialogParam = dialog.chooser && dialog.chooser.oriFetchParam;

            //untuk cek reload
            _.oriFetchParam = <P>{};

            var usedParam = <TFetchParam<P>>{};
            //global param
            for (let i in Chooser.globalFetchParam) {
                _.oriFetchParam[i] = usedParam[i] = Chooser.globalFetchParam[i];
            }

            //param from definition
            var defaultFetchParams = _.def.opt.defaultFetchParam;
            for (let i in defaultFetchParams) {
                usedParam[<string>i] = defaultFetchParams[i];
            }

            //param when open
            for (let i in fetchParam) {
                _.oriFetchParam[i] = <any>(usedParam[<string>i] = <any>fetchParam[i]);
            }

            /**
             * Param passed to fetch function
             */
            _.fetchParam = usedParam;

            //add default paging
            if (!_.fetchParam.count) _.fetchParam.count = _.def.opt.paging;
            if (!_.fetchParam.skip) _.fetchParam.skip = 0;

            dialog.onclosing = function (fromUser, close) {
                //refocus ke input
                if (_.input) _.input.btn.focus();

                if (fromUser) _.oncancel();
                close();
            };


            _.def.onopen(_, fetchParam);

            //init
            var btnOK = app.s(dialog.contentElm, "[btn=ok]");
            if (option.count > 1) {
                app.s(dialog.contentElm, STATUS_SELECTED).innerHTML = "0";
                var totalCount = app.s(dialog.contentElm, STATUS_COUNT);
                app.show(totalCount, (option.count < 100));
                totalCount.innerHTML = <any>option.count;
                app.show(app.s(dialog.contentElm, STATUS_BAR));
                app.show(btnOK);

                //selesai memilih
                app.click(btnOK, function () {
                    var rows = app.sa(dialog.contentElm, ROW_ELM_SELECTOR + "." + ROW_CHECKED);
                    var items = [];
                    for (var i = 0; i < rows.length; i++) {
                        items.push((<TChooserRowElm>rows[i]).chItem);
                    }

                    //tandai item dipilih terakhir
                    if (items.length) {
                        _.def.lastObj = items[items.length - 1];
                    }

                    _.onvalue(items);
                    dialog.close(false);
                }, true);
            } else {
                app.hide(app.s(dialog.contentElm, STATUS_BAR));
                app.hide(btnOK);
            }

            //Tandai baru saja dibuka
            _.fresh = true;

            //--- check if need reload
            if (!oldDialogObj) {
                //reload if has not been reloaded
                _.reload();
            } else {
                //add more param before reload
                if (!app.propsEqual(oldDialogParam, _.oriFetchParam, 20)) {
                    //reload if has different param
                    _.reload(true);
                } else _.ready();
            }
        }

        /**
         * Render dialog
         */
        reload(fromUser = false) {
            var _ = this;

            //update table
            var contentElm = _.dialog.contentElm;

            //add filter search txt
            if (_.def.opt.search) {
                var filterValue = app.ui.input(app.s(contentElm, SEARCH_FIELD_SELECTOR));
                _.def.opt.search.filterParam(filterValue.val(), _.fetchParam);
            }

            //add other filter from dialog
            if (_.def.opt.dialog && _.def.opt.dialog.moreParam) _.fetchParam = _.def.opt.dialog.moreParam(_, _.fetchParam);

            return app.ui.loading(contentElm, _.def.opt.fetch(_.fetchParam, fromUser).then(function (response) {
                var tbody = app.s(contentElm, ROWS_CONTAINER_SELECTOR);
                tbody.innerHTML = "";
                var data = null;
                var btnNext = app.s(contentElm, "[btn=next]");
                var btnPrev = app.s(contentElm, "[btn=prev]");

                if (response.data && (response.data instanceof Array)) {
                    data = response.data;

                    //update paging button
                    if (btnNext) {
                        //todo check
                        app.attr(btnNext, "disabled", "true", !(response.total > response.skip + data.length));
                    }
                    if (btnPrev) {
                        app.attr(btnPrev, "disabled", "true", !(response.skip > 0));
                    }
                } else {
                    data = response;
                    //disable karena tidak tau totalnya
                    if (btnNext) app.attr(btnNext, "disabled", true);
                    if (btnPrev) app.attr(btnPrev, "disabled", true);
                }

                //untuk setiap baris
                for (var d = 0; d < data.length; d++) {
                    var item = data[d];

                    var rowElm = app.clone(rowSample);
                    (<TChooserRowElm>rowElm).chItem = item;

                    //render colomn
                    for (var i = 0; i < _.def.opt.columns.length; i++) {
                        var col = _.def.opt.columns[i];
                        var cellElm = app.clone(rowCellSample);
                        var cell = (typeof col.val == "string") ? item[col.val] : col.val(item);
                        if (cell !== undefined) {//angka 0 dan "" harus tetap muncul
                            if (cell instanceof HTMLElement || cell instanceof Text) {
                                cellElm.innerHTML = "";
                                cellElm.appendChild(cell);
                            } else cellElm.innerHTML = cell;

                        }
                        if (col.classes) for (var c = 0; c < col.classes.length; c++) app.addClass(cellElm, col.classes[c]);
                        rowElm.appendChild(cellElm);
                    }

                    //jika ada method override
                    if (_.def.opt.fillRow) {
                        _.def.opt.fillRow(rowElm, item);
                    }

                    tbody.appendChild(rowElm);
                }

                _.ready();
            }));
        }

        //chooser ready
        private ready() {
            var _ = this;
            var dialog = _.dialog;
            var option = _.opt;

            setTimeout(function () {
                function chooseOne(clickedRow) {
                    //pilih satu saja
                    var item = <D>clickedRow.chItem;
                    if (_.def.opt.choosable && (_.def.opt.choosable(item, _.fetchParam) === false)) {
                        //filter
                        return;
                    }

                    //set recently used
                    _.def.lastObj = item;

                    _.onvalue(item);
                    _.dialog.close(false);
                }

                //jika bisa pilih banyak
                function chooseMany(clickedRow) {
                    //skip jika tidak bisa terpilih
                    if (_.def.opt.choosable && (_.def.opt.choosable(clickedRow.chItem, _.fetchParam) === false)) {
                        return;
                    }

                    var count = app.sa(dialog.contentElm, ROW_ELM_SELECTOR + "." + ROW_CHECKED).length;
                    if (app.hasClass(clickedRow, ROW_CHECKED)) {
                        app.remClass(clickedRow, ROW_CHECKED);
                        count--;
                    } else if (count < option.count) {
                        app.setClass(clickedRow, ROW_CHECKED);
                        count++;
                    }

                    //update jumlah terpilih
                    app.s(dialog.contentElm, STATUS_SELECTED).innerHTML = String(count) || "0";
                };

                var rows = app.sa(dialog.contentElm, ROW_ELM_SELECTOR)
                for (var i = 0; i < rows.length; i++) {
                    var rowElm = rows[i];

                    //langsung pilih 1
                    app.click2(rowElm, chooseOne, true);

                    if (option.count > 1) {
                        app.click(rowElm, chooseMany, true);
                        app.onKeyEnter(rowElm, chooseMany, true);
                    } else {
                        app.onKeyEnter(rowElm, chooseOne, true);
                    }
                }
            }, 200);

            //set fokus
            setTimeout(function () {
                var focusTarget;
                if (_.def.opt.focus == "search") {
                    //jika reload saat open dialog focus ke search
                    if (_.fresh) {
                        focusTarget = app.s(dialog.contentElm, SEARCH_FIELD_SELECTOR);
                        focusTarget.setSelectionRange(0, focusTarget.value.length);//select all
                    } else {
                        //reload selanjutnya, fokus ke result
                        focusTarget = app.s(dialog.contentElm, ROW_ELM_SELECTOR);
                        if (!focusTarget) {
                            //jika tetap kosong, pilih search
                            focusTarget = app.s(dialog.contentElm, SEARCH_FIELD_SELECTOR);
                        }
                    }
                    _.fresh = false;
                } else if (_.def.opt.focus == "row") {
                    //focus ke row
                    focusTarget = app.s(dialog.contentElm, ROW_ELM_SELECTOR);
                }
                if (focusTarget) focusTarget.focus();
            });
        }

        filter(keyword) {
            var _ = this;
            if (_.def.opt.search) {
                _.fetchParam.skip = 0;//reset page 1
                _.def.opt.search.filterParam(keyword, _.fetchParam);
                _.reload(true);
            }
        };

        next() {
            var _ = this;
            _.fetchParam.skip += _.def.opt.paging;
            _.reload(true);
        };
        prev() {
            var _ = this;
            _.fetchParam.skip -= _.def.opt.paging;
            if (_.skip < 0) _.skip = 0;
            _.reload(true);
        };
    }

    export type TChooserInputOption<D, P, V> = TInputOpt<V> & {
        key?: string;

        /**
         * How to display
         */
        display?: string | ((data: D) => string);

        /**
         * Param passed to fetch
         */
        fetchParam?: TFetchParam<P>;

        nullTxt?: string;
        /**
         * choose default or not
         */
        suggest?: boolean;
        /**
         * Title of dialog to choose items
         */
        dialogTitle?: string,
    }

    export type TChooserInputProxy<D = any, P = any, V = number> = {
        /**
         * Set or get val
         */
        val: (val?: D) => (D),
        /**
         * When valobj is changed
         */
        onchange: (chooserInput: ChooserInput<D, P, V>, valObj: D, fromUser: boolean) => void
    };

    export class ChooserInput<D, P = any, V = number> extends Input {
        key: string;
        /**
         * 
         */
        chooserElm: HTMLElement;
        nullTxt = "";
        def: Chooser<D, P, V>;
        btn: HTMLButtonElement;

        fetchParam: TFetchParam<P>;

        /**
         * Selected item
         */
        private _item: D = null;
        /**
         * Selected value
         */
        private _val = null;

        private _opt: TChooserInputOption<D, P, V>;

        /**
         * Proxy to set object
         */
        objProxy: TChooserInputProxy<D, P, V>;

        //todo remove
        private _cosDef;
        constructor(definition: Chooser<D, P, V>, elm, consParam: TChooserInputOption<D, P, V>) {
            super(elm);
            var _ = this;
            var option = <TChooserInputOption<D, P, V>>{};
            //patch param
            for (var i in consParam) option[i] = consParam[i];

            //ambil fetch param dari option
            _.fetchParam = (consParam && consParam.fetchParam) || <TFetchParam<P>>{};

            //setup if required
            if (option.required) _.nullTxt = "";

            _._opt = option;

            //key used
            _.key = option.key || definition.opt.key || "id";

            //clone
            var sampleClone = app.clone(inputSample);
            app.replace(elm, sampleClone, true, true);
            _.chooserElm = sampleClone;

            //hook
            _.def = definition;
            (<any>sampleClone).pchooser = _;

            //set inputs
            var previewElm = app.s(sampleClone, "button span");
            _.elm = previewElm;
            previewElm.innerHTML = option.nullTxt || "";

            _.nullTxt = option.nullTxt;

            /**
             * current objek bound to value
             */
            _._item = null;

            /**
             * Proxy to set object
             */
            _.objProxy = {
                /**
                 * Set or get val
                 */
                val: function (item) {
                    return <D>_.valObj(item);
                },
                /**
                 * When valobj is changed
                 */
                onchange: function (chooser, valObj, fromUser) { }
            };

            //setup button
            _.btn = <HTMLButtonElement>app.s(sampleClone, "button");
            (<any>_.btn).pchooser = _;
            app.click(_.btn, function () {
                let dialog = _.open();
            }, true);
        }

        opt(option: TChooserInputOption<D, P, V>) {
            var _ = this;
            if (option) {
                if (option.suggest) {
                    _.chooseDefault();
                }
            }
            return super.opt(option);
        }

        /**
         * Get or set value
         */
        val(val?: V): V {
            var _ = this;
            if (val !== undefined) {
                if (val) _._cosDef = false;
                else _.elm.innerHTML = _._opt.nullTxt || "";

                //set value
                _._val = val;

                //become valid if required
                if (val !== null) {
                    app.remClass(_.btn, "invalid");
                }

                if (_.onchange) {
                    _.onchange(_, val, false);
                }
            }

            return (_._item && _._item[_.key]) || _._val || null;
        }

        /**
         * Get detail value
         */
        valObj(valObj?: D): void | D {
            var _ = this;
            if (valObj !== undefined) {
                _._item = valObj;
                _.elm.innerHTML = valObj == null ? (_._opt.nullTxt || "") : (_.def.display(valObj));
                //become valid if required
                if (valObj !== null) app.remClass(_.btn, "invalid");

                if (_.objProxy.onchange)
                    _.objProxy.onchange(_, valObj, false);
            }
            return _._item;
        }

        /**
         * Enable
         */
        enable(isEnable?: boolean): boolean | void {
            //todo hack
            return (<any>this.btn).enable(isEnable);
        }

        /**
         * Get/set required
         */
        required(isRequired?: boolean): (boolean | void) {
            app.setClass(this.btn, "required", isRequired);
            return false;
        }

        focus() {
            this.btn.focus();
        }

        /**
         * Trigger validation for required value, return true if not null or required
         */
        isValid() {
            var _ = this;
            if (_._opt.required) {
                var hasValue = (_.val() !== null);
                app.setClass(_.btn, "invalid", !hasValue);
                return hasValue;
            }
            return true;
        }

        /**
         * Select default entry or first
         */
        chooseDefault() {
            var _ = this;
            var definition = _.def;
            var option = _._opt;
            //jika recent value, pake value tsb
            if (definition.lastObj) {
                _.valObj(definition.lastObj);
            } else if (definition.opt.defaultVal) {
                _.valObj(definition.opt.defaultVal);
            } else {
                var promise = definition.fetchPromise;
                _._cosDef = true;
                if (!promise) {
                    var paramClone = JSON.parse(JSON.stringify(_._opt.fetchParam || {}));
                    paramClone.count = 1;//fetch only one
                    promise = definition.fetchPromise = definition.opt.fetch(paramClone, false).then(function (data) {
                        definition.fetchPromise = null;
                        return data;
                    }, function () {
                        definition.fetchPromise = null;
                    });
                }
                promise.then(function (data: { data: Array<D> }) {
                    if (_._cosDef) {
                        var choice = (data.data && (data.data instanceof Array)) ? data.data[0] : (data instanceof Array ? data[0] : data);
                        _.valObj(choice);
                        definition.lastObj = choice;
                        _._cosDef = false;
                    }
                });
            }
        };
        /**
         * Open chooser dialog
         */
        open() {
            var _ = this;
            var definition = _.def;

            //var obj = btn.pchooser;
            var dialog = definition.open(_.fetchParam, {
                input: _,
                required: _._opt.required,
            });

            //set title
            var title = _._opt.dialogTitle || _.def.opt.title;
            dialog.dialog.title(title);

            dialog.input = _;
            dialog.onvalue = function (value) {
                var obj = dialog.input;
                if (value !== undefined) {
                    obj.elm.innerHTML = value == null ? (_.nullTxt || "") : (obj.def.display(value) || "");

                    obj._item = value;
                    obj._val = value && value[obj.key];

                    if (obj.onchange) {
                        obj.onchange(obj, obj._val, true);
                    }
                    if (obj.objProxy.onchange) {
                        obj.objProxy.onchange(obj, value, true);
                    }

                    //check validity
                    var hasValue = (_.val() !== null);
                    app.setClass(_.elm, "invalid", _._opt.required && !hasValue);
                }

                obj.btn.focus();
            };

            //tombol kosongkan tampil apabila tidak punya option atau tidak required
            let btnEmpty = s(dialog.dialog.contentElm, "[btn=empty]");
            app.show(btnEmpty, !_._opt || !_._opt.required);
            //set text tombol kosong
            btnEmpty.innerHTML = _._opt.nullTxt || app.getText("empty");

            return dialog;
        };
    }

    export type TChooserOpenParam<D, P, V> = {
        input?: ChooserInput<D, P, V>;
        required?: boolean,
        count?: number,
        title?: string,
        suggest?: boolean
    };

    export class Chooser<D = any, P = any, V = number> {
        static globalFetchParam: {}

        name: string;
        opt: TChooserOption<D, P, V>;
        fetchPromise: Promise<any>;
        display = function (row): string { return row; }

        constructor(name: string, option: TChooserOption<D, P, V>) {
            var _ = this;
            _.name = name;
            _.opt = option || <TChooserOption<D, P, V>>{};

            //--- setup options
            if (!option.focus) option.focus = "row";
            if (!option.paging) option.paging = 20;
            if (!option.fetch) {
                option.fetch = function (param, fromUser) {
                    return app.promise(function (done) {
                        var cache = app.cache[name];

                        //set value 
                        if (cache) return cache.getMany().then(done);
                        else done({ total: 0, skip: 0, data: [] });
                    });
                };
            };

            //default
            if (option.display) {
                if (typeof (option.display) === "string") {
                    _.display = function (row) {
                        return (row && row[<string>option.display]) || "";
                    }
                } else {
                    _.display = option.display;
                }
            }

            //add button
            if (option.addData) {
                _.addData = option.addData;
            }

            //atur dialog yang digunakan
            var customDialog = option.dialog && option.dialog.def;
            if (customDialog instanceof app.Part) {
                customDialog.load().then(function () {
                    _.setDialog(app.ui.dialog((<Part>customDialog).getViewElm(), "chooser_" + name));
                });
            } else if (customDialog instanceof HTMLElement) {
                _.setDialog(app.ui.dialog(customDialog, "chooser_" + name));
            } else {
                //use default dialog
                _.setDialog(app.ui.dialog(dialogSample, "chooser"));
            }

            //add custom classes
            if (option.classes) {
                _.dialog.sample = app.clone(_.dialog.sample);
                for (let i = 0; i < option.classes.length; i++) {
                    app.setClass(_.dialog.sample, option.classes[i]);
                }
            }
        }
        /**
         * Override me! Executed when dialog open
         */
        onopen = function (chooserInputInstance: ChooserDialogWrapper<D, P, V>, fetchParam) { };

        /**
         * Overridable. If provided, will show add button on choose dialog
         */
        addData: (reload: () => void) => void;
        /**
         * last choosed object
         */
        lastObj: D = null;

        dialog: DialogDef;

        setDialog(dialogDef: DialogDef) {
            var _ = this;
            _.dialog = dialogDef;
            _.dialog.oncreate = function (instance: ChooserDialog<D, P, V>) {
                var contentElm = instance.contentElm;

                if (_.opt.title) {
                    instance.title(_.opt.title);
                }

                //render header
                var titles = app.s(contentElm, ".ch-titles");
                var thSample = app.grabSample(titles, "p-c");
                titles.innerHTML = "";
                for (var i = 0; i < _.opt.columns.length; i++) {
                    var col = _.opt.columns[i];
                    var th = app.clone(thSample);
                    th.innerHTML = col.title;
                    titles.appendChild(th);
                }

                //add reload control
                app.click(app.s(contentElm, "[btn=reload]"), function () {
                    instance.chooser.reload(true);
                }, true);

                //add cancel control
                app.click(app.s(contentElm, "[btn=cancel]"), function () {
                    instance.close(true);
                }, true);

                //check add function
                if (_.addData) {
                    var btnAdd = app.s(contentElm, "[btn=add]");
                    app.show(btnAdd);
                    app.click(btnAdd, function () {
                        _.addData(function () {
                            instance.chooser.reload(true);
                        });
                    }, true);
                }

                //empty cache
                app.click(app.s(contentElm, "[btn=empty]"), function () {
                    instance.close(false);
                    instance.chooser.onvalue(null);
                }, true);

                var filterInput = <HTMLInputElement>app.s(contentElm, SEARCH_FIELD_SELECTOR)
                function doFilter() {
                    instance.chooser.filter(filterInput.value);
                };

                //check search
                if (_.opt.search) {
                    app.show(app.s(contentElm, ".actions"));
                    var filterValue = app.ui.input(filterInput);
                    if (_.opt.search.txt) filterValue.placeholder(_.opt.search.txt);

                    app.onTypeDone(filterValue.elm, doFilter);
                    var filterDebounce = app.debounce(doFilter, 500);
                    app.onKeyUp(contentElm, app.KEYS.ANY, function (contentElm, ev) {
                        if (ev.target != filterInput) {
                            if (ev.which >= app.KEYS.NUM0.which && ev.which < app.KEYS.Z.which) {
                                filterInput.value += ev.shiftKey ? ev.key.toUpperCase() : ev.key;
                            } else if (ev.which == app.KEYS.SPACE.which) {
                                filterInput.value += " ";
                            } else if (ev.which == app.KEYS.BACKSPACE.which) {
                                if (filterInput.value) filterInput.value = filterInput.value.substr(0, filterInput.value.length - 1);
                            } else return;

                            filterDebounce();
                        }
                    });
                }

                //update paging button
                //next
                app.click(app.s(contentElm, "[btn=next]"), function () {
                    instance.chooser.next();
                }, true, true);
                app.onArrowRight(contentElm, function (contentElm) {
                    app.s(contentElm, "[btn=next]").click();
                }, true);

                //prev
                app.click(app.s(contentElm, "[btn=prev]"), function () {
                    instance.chooser.prev();
                }, true, true);
                app.onArrowLeft(contentElm, function (contentElm) {
                    app.s(contentElm, "[btn=prev]").click();
                }, true);

                //add arrow nav
                app.onArrowUp(contentElm, function (contentElm) {
                    var rowElm = app.s(contentElm, TAG_ROW + ":focus");
                    (<HTMLElement>(rowElm && rowElm.previousElementSibling) || app.s(contentElm, TAG_ROW + ":last-child")).focus();
                }, true);
                app.onArrowDown(contentElm, function (contentElm) {
                    var rowElm = app.s(contentElm, TAG_ROW + ":focus");
                    (<HTMLElement>(rowElm && rowElm.nextElementSibling) || app.s(contentElm, TAG_ROW + ":first-child")).focus();
                }, true);

                //run default init
                if (_.opt.dialog && _.opt.dialog.oncreate) _.opt.dialog.oncreate(instance);
            };
        }

        /**
         * Open chooser with promise
         */
        open(fetchParam?: TFetchParam<P>, option?: TChooserOpenParam<D, P, V>) {
            var _ = this;
            if (!option) option = {
                input: null,
                required: true,
                count: 1
            };

            /**
             * The dialog component
             */
            var dialog = <ChooserDialog<D, P, V>>(_.dialog.open());
            dialog.title(option.title || _.opt.title);
            if (_.opt.full) {
                dialog.full();
                dialog.top();
            }

            var dialogObj: ChooserDialogWrapper<D, P, V> = dialog.chooser || (dialog.chooser = new ChooserDialogWrapper<D, P, V>(_, dialog, option));

            dialogObj.reset(fetchParam, option);

            return dialogObj;
        };

        /**
         * Gunakan chooser untuk mengisi input tertentu
         */
        fill(elm: HTMLElement, option?: TChooserInputOption<D, P, V>): ChooserInput<D, P, V> {
            return new ChooserInput(this, elm, option).opt(option);
        }
    }
}