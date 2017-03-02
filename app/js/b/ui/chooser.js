(function (app) {
    var TAG_NAME = 'p-chooser'
        , ROWS_CONTAINER_SELECTOR = '.ch-item-container'
        , ROW_ELM_SELECTOR = '.ch-item'
        , SEARCH_FIELD_SELECTOR = '.ch-search'

        , ROW_CHECKED = 'ch-ek'
        , STATUS_BAR = '.ch-status'
        , STATUS_COUNT = '.ch-count'
        , STATUS_SELECTED = '.ch-selected'

        , TAG_ROW = 'p-r';
    ;

    var inputSample = app.grabSample(appSamples, TAG_NAME);
    //var selectOptionSample = app.grabSample(inputSample, 'option');//remove

    //init dialog
    var dialogSample = app.grabSample(appSamples, '.chooser-dialog');

    app.onStarting(function () {
        app.lang.scan(dialogSample);
    });

    var rowSample = app.grabSample(dialogSample, ROW_ELM_SELECTOR);
    var rowCellSample = app.grabSample(rowSample, '.ch-v');

    var component = {
        list: {},
        globalFetchParam: {}
    };

    function DefinitionOption() {
        return {
            /**
             * Column to render in table. Overridable!
             */
            columns: [
                { title: 'Code', val: 'code' },
                { title: 'Desc', val: 'name' }
            ],

            defaultFetchParam: {},

            /**
             * Fetch function
             */
            fetch: null,

            /**
             * Column yang dijadikan nilai
             */
            key: 'id',
            title: app.getText('choose_x', '', name),

            /**
             * Search param
             */
            search: null,

            /**
             * Fetch count
             */
            paging: 20,

            /**
             * Fill rowElm with data when reloading
             */
            fillRow: null,

            /**
             * Default focus when window open. Option = ['row', 'search']
             */
            focus: 'row',

            /**
             * Use custom dialog
             */
            dialog: {
                def: null,
                //function when dialog created
                oncreate: null,
                moreParam: function (dialogObj, existingParam) { return existingParam; }
            },

            /**
             * Mengecek apakah suatu entry bisa dipilih atau tidak
             */
            choosable: null
        };
    }

    function ChooserDefinition(name, option) {
        var _ = this;

        _.name = name;
        _.opt = option || DefinitionOption();

        _.setDialog = function (dialogDef) {
            _.dialog = dialogDef;
            _.dialog.oncreate = function (instance) {
                instance = _.dialog.ins(instance);
                var contentElm = instance.contentElm;

                if (_.opt.title) instance.title(_.opt.title);

                //render header
                var titles = app.s(contentElm, '.ch-titles');
                var thSample = app.grabSample(titles, 'p-c');
                titles.innerHTML = '';
                for (var i = 0; i < _.opt.columns.length; i++) {
                    var col = _.opt.columns[i];
                    var th = app.clone(thSample);
                    th.innerHTML = col.title;
                    titles.appendChild(th);
                }

                //add reload control
                app.click(app.s(contentElm, '[btn=reload]'), function () {
                    instance.chooser.reload(true);
                }, true);

                //add cancel control
                app.click(app.s(contentElm, '[btn=cancel]'), function () {
                    instance.close(true);
                }, true);

                //check add function
                if (_.addData) {
                    var btnAdd = app.s(contentElm, '[btn=add]');
                    app.show(btnAdd);
                    app.click(btnAdd, function () {
                        _.addData();
                    }, true);
                }

                //empty cache
                app.click(app.s(contentElm, '[btn=empty]'), function () {
                    instance.close(false);
                    instance.chooser.onvalue(null);
                }, true);

                //check search
                if (_.opt.search) {
                    app.show(app.s(contentElm, '.actions'));

                    var filterValue = app.ui.input(app.s(contentElm, SEARCH_FIELD_SELECTOR));
                    if (_.opt.search.txt) filterValue.placeholder(_.opt.search.txt);

                    app.onTypeDone(filterValue.elm, function () {
                        instance.chooser.filter(filterValue.val());
                    });
                }

                //update paging button
                //next
                app.click(app.s(contentElm, '[btn=next]'), function () {
                    instance.chooser.next();
                }, true, true);
                app.onArrowRight(contentElm, function (contentElm) {
                    app.s(contentElm, '[btn=next]').click();
                }, true);

                //prev
                app.click(app.s(contentElm, '[btn=prev]'), function () {
                    instance.chooser.prev();
                }, true, true);
                app.onArrowLeft(contentElm, function (contentElm) {
                    app.s(contentElm, '[btn=prev]').click();
                }, true);

                //add arrow nav
                app.onArrowUp(contentElm, function (contentElm) {
                    var rowElm = app.s(contentElm, TAG_ROW + ':focus');
                    ((rowElm && rowElm.previousElementSibling) || app.s(contentElm, TAG_ROW + ':last-child')).focus();
                }, true);
                app.onArrowDown(contentElm, function (contentElm) {
                    var rowElm = app.s(contentElm, TAG_ROW + ':focus');
                    ((rowElm && rowElm.nextElementSibling) || app.s(contentElm, TAG_ROW + ':first-child')).focus();
                }, true);

                //run default init
                if (_.opt.dialog.oncreate) _.opt.dialog.oncreate(instance);
            };
        };

        _.display = function (row) { return row; };

        /**
         * default dialogDef
         */
        _.dialog = null;

        /**
         * Open chooser with promise
         */
        _.open = function (fetchParam, option) {
            if (!option) option = {
                input: null,
                nullable: true,
                onready: null,
                count: 1
            };

            /**
             * The dialog component
             */
            var dialog = (_.dialog).open();
            dialog.title(option.title || _.opt.title);
            if (_.opt.full) {
                dialog.full();
                dialog.top();
            }
            var oldDialogObj = dialog.chooser;
            var oldDialogParam = dialog.chooser && dialog.chooser.oriFetchParam;

            var dialogObj = dialog.chooser || (dialog.chooser = {
                /**
                 * Triggered when dialog closed without result
                 */
                oncancel: function () { },

                /**
                 * Triggered when dialog closed with result
                 */
                onvalue: function (valueObj) { },

                onready: null
            });

            dialogObj.dialog = dialog;

            //untuk cek reload
            dialogObj.oriFetchParam = {};

            //jika null atau undefined
            var usedParam = {};
            for (var i in component.globalFetchParam) {
                dialogObj.oriFetchParam[i] = usedParam[i] = component.globalFetchParam[i];
            }
            var defaultFetchParams = _.opt.defaultFetchParam(dialogObj);
            for (var i in defaultFetchParams) usedParam[i] = defaultFetchParams[i];
            for (var i in fetchParam) {
                dialogObj.oriFetchParam[i] = usedParam[i] = fetchParam[i];
            }

            /**
             * Param passed to fetch function
             */
            dialogObj.fetchParam = usedParam;

            //add default paging
            if (!dialogObj.fetchParam.count) dialogObj.fetchParam.count = _.opt.paging;
            if (!dialogObj.fetchParam.skip) dialogObj.fetchParam.skip = 0;

            /**
             * Filled input, null when triggered from code
             */
            dialog.input = option.input;

            dialog.onclose = function (fromUser) {
                //refocus ke input
                if(dialogObj.input)dialogObj.input.btn.focus();

                if (fromUser) dialogObj.oncancel();
            };

            //atur ui
            var btnEmpty = app.s(dialog.contentElm, '[btn=empty]')
            app.show(btnEmpty, option.nullable);
            btnEmpty.innerHTML = (option.input && option.input.nullTxt) || app.getText('empty');

            /**
             * Render dialog
             */
            dialogObj.reload = function (fromUser) {
                //update table
                var contentElm = dialog.contentElm;

                //add filter search txt
                if (_.opt.search) {
                    var filterValue = app.ui.input(app.s(contentElm, SEARCH_FIELD_SELECTOR));
                    _.opt.search.filterParam(filterValue.val(), dialogObj.fetchParam);
                }

                //add other filter from dialog
                if (_.opt.dialog.moreParam) dialogObj.fetchParam = _.opt.dialog.moreParam(dialogObj, dialogObj.fetchParam);

                app.ui.loading(contentElm, _.opt.fetch(dialogObj.fetchParam, fromUser).then(function (response) {
                    var tbody = app.s(contentElm, ROWS_CONTAINER_SELECTOR);
                    tbody.innerHTML = '';
                    var data = null;
                    var btnNext = app.s(contentElm, '[btn=next]');
                    var btnPrev = app.s(contentElm, '[btn=prev]');

                    if (response.data && (response.data instanceof Array)) {
                        data = response.data;

                        //update paging button
                        if (btnNext) {
                            btnNext.enable(response.total > response.skip + data.length);
                        }
                        if (btnPrev) {
                            btnPrev.enable(response.skip > 0);
                        }
                    } else {
                        data = response;
                        //disable karena tidak tau totalnya
                        if (btnNext) btnNext.enable(false);
                        if (btnPrev) btnPrev.enable(false);
                    }

                    //untuk setiap baris
                    for (var d = 0; d < data.length; d++) {
                        var item = data[d];

                        var rowElm = app.clone(rowSample);
                        rowElm.chItem = item;

                        //render colomn
                        for (var i = 0; i < _.opt.columns.length; i++) {
                            var col = _.opt.columns[i];
                            var cellElm = app.clone(rowCellSample);
                            var cell = (typeof col.val == 'string') ? item[col.val] : col.val(item);
                            if (cell !== undefined) {//angka 0 dan '' harus tetap muncul
                                if (cell instanceof HTMLElement || cell instanceof Text) {
                                    cellElm.innerHTML = '';
                                    cellElm.appendChild(cell);
                                } else cellElm.innerHTML = cell;

                            }
                            if (col.classes) for (var c = 0; c < col.classes.length; c++) app.addClass(cellElm, col.classes[c]);
                            rowElm.appendChild(cellElm);
                        }

                        //jika ada method override
                        if (_.opt.fillRow) {
                            _.opt.fillRow(rowElm, item);
                        }

                        tbody.appendChild(rowElm);
                    }

                    chooserReady();
                }));
            };

            dialogObj.filter = function (keyword) {
                if (_.opt.search) {
                    dialogObj.fetchParam.skip = 0;//reset page 1
                    _.opt.search.filterParam(keyword, dialogObj.fetchParam);
                    dialogObj.reload(true);
                }
            };

            dialogObj.next = function () {
                dialogObj.fetchParam.skip += _.opt.paging;
                dialogObj.reload(true);
            };
            dialogObj.prev = function () {
                dialogObj.fetchParam.skip -= _.opt.paging;
                if (dialogObj.skip < 0) dialogObj.skip = 0;
                dialogObj.reload(true);
            };

            _.onopen(dialogObj, fetchParam);

            //init
            var btnOK = app.s(dialog.contentElm, '[btn=ok]');
            if (option.count > 1) {
                app.s(dialog.contentElm, STATUS_SELECTED).innerHTML = '0';
                var totalCount = app.s(dialog.contentElm, STATUS_COUNT);
                app.show(totalCount, (option.count < 100));
                totalCount.innerHTML = option.count;
                app.show(app.s(dialog.contentElm, STATUS_BAR));
                app.show(btnOK);

                //selesai memilih
                app.click(btnOK, function () {
                    var rows = app.sa(dialog.contentElm, ROW_ELM_SELECTOR + '.' + ROW_CHECKED);
                    var items = [];
                    for (var i = 0; i < rows.length; i++) {
                        items.push(rows[i].chItem);
                    }
                    dialogObj.onvalue(items);
                    dialog.close(false);
                }, true);
            } else {
                app.hide(app.s(dialog.contentElm, STATUS_BAR));
                app.hide(btnOK);
            }

            //Tandai baru saja dibuka
            dialogObj.fresh = true;

            //--- check if need reload
            if (!oldDialogObj) {
                //reload if has not been reloaded
                dialogObj.reload();
            } else {
                //add more param before reload
                if (!app.propsEqual(oldDialogParam, dialogObj.oriFetchParam, 20)) {
                    //reload if has different param
                    dialogObj.reload(true);
                } else chooserReady();
            }

            //chooser ready
            function chooserReady() {
                setTimeout(function () {
                    var rows = app.sa(dialog.contentElm, ROW_ELM_SELECTOR)
                    for (var i = 0; i < rows.length; i++) {
                        var rowElm = rows[i];

                        //langsung pilih 1
                        //add trigger
                        //TODO wait trigger
                        function chooseOne(clickedRow) {
                            var item = clickedRow.chItem;
                            if (_.opt.choosable && (_.opt.choosable(item, option) === false)) return;

                            dialogObj.onvalue(item);
                            dialog.close(false);
                        }

                        //langsung pilih 1
                        app.click2(rowElm, chooseOne, true);

                        if (option.count > 1) {
                            //jika bisa pilih banyak
                            function choose(clickedRow) {
                                //skip jika tidak bisa terpilih
                                if (_.opt.choosable && (_.opt.choosable(clickedRow.chItem, option) === false)) return;

                                var count = app.sa(dialog.contentElm, ROW_ELM_SELECTOR + '.' + ROW_CHECKED).length;
                                if (app.hasClass(clickedRow, ROW_CHECKED)) {
                                    app.remClass(clickedRow, ROW_CHECKED);
                                    count--;
                                } else if (count < option.count) {
                                    app.class(clickedRow, ROW_CHECKED);
                                    count++;
                                }

                                //update jumlah terpilih
                                app.s(dialog.contentElm, STATUS_SELECTED).innerHTML = count || '0';
                            };

                            app.click(rowElm, choose, true);
                            app.onKeyEnter(rowElm, choose, true);
                        } else {
                            app.onKeyEnter(rowElm, chooseOne, true);
                        }
                    }
                }, 200);

                //set fokus
                setTimeout(function () {
                    var focusTarget;
                    if (_.opt.focus == 'search') {
                        //jika reload saat open dialog focus ke search
                        if (dialogObj.fresh) {
                            focusTarget = app.s(dialog.contentElm, SEARCH_FIELD_SELECTOR);
                            focusTarget.setSelectionRange(0, focusTarget.value.length);//select all
                        } else {
                            //reload selanjutnya, fokus ke result
                            focusTarget = app.s(dialog.contentElm, ROW_ELM_SELECTOR);
                        }
                        dialogObj.fresh = false;
                    } else if (_.opt.focus == 'row') {
                        //focus ke row
                        focusTarget = app.s(dialog.contentElm, ROW_ELM_SELECTOR);
                    }
                    if (focusTarget) focusTarget.focus();
                });

                if (option.onready) option.onready(dialogObj);
            }

            return dialogObj;
        };

        /**
         * Override me! Executed when dialog open
         */
        _.onopen = function (chooserInputInstance, fetchParam) { };

        /**
         * Overridable. If provided, will show add button on choose dialog
         */
        _.addData = null;
    }

    /**
     * define chooser
     */
    component.define = function (name, option) {
        //--- setup options
        var defaultOption = DefinitionOption();
        for (var i in option) defaultOption[i] = option[i];
        option = defaultOption;

        if (!option.fetch) {
            option.fetch = function (param, fromUser) {
                return new Promise(function (done) {
                    var cache = app.cache[name];

                    //set value 
                    if (cache) return cache.getMany().then(done);
                    else done([]);
                });
            };
        };

        if (typeof option.defaultFetchParam != 'function') {
            var value = option.defaultFetchParam;
            option.defaultFetchParam = function () { return value; };
        };

        //default
        var definition = component.list[name] = new ChooserDefinition(name, option);

        if (option.display) {
            if (typeof (option.display) === 'string') {
                definition.display = function (row) {
                    return (row && row[option.display]) || '';
                }
            } else {
                definition.display = option.display;
            }
        }

        //add button
        if (option.addData) {
            definition.addData = option.addData;
        }


        //atur dialog yang digunakan
        var customDialog = option.dialog && option.dialog.def;
        if (customDialog instanceof AppPart) {
            app.usePart(customDialog).then(function () {
                definition.setDialog(app.ui.dialog().define(customDialog.getViewElm(), 'chooser_' + name));
            });
        } else if (customDialog instanceof HTMLElement) {
            definition.setDialog(app.ui.dialog().define(customDialog, 'chooser_' + name));
        } else {
            //use default dialog
            definition.setDialog(app.ui.dialog().define(dialogSample, 'chooser'));
        }

        /**
         * Gunakan chooser untuk mengisi input tertentu
         */
        definition.fill = function (elm, param) {
            var obj = new AppInput();

            var defaultParam = {
                key: null,
                /**
                 * Trigger when setup ready
                 */
                onReady: null,

                enable: true,

                /**
                 * Disallow empty result
                 */
                nullable: true,

                /**
                 * Switch to select if data length <= this number
                 */
                collapseOn: 10,

                /**
                 * How to display
                 */
                display: null,

                /**
                 * Param passed to fetch
                 */
                fetchParam: null,
            };
            //patch param
            for (var i in param) defaultParam[i] = param[i];
            param = defaultParam;

            //Text to display when null
            if (!param.nullTxt) param.nullTxt = '';

            //key used
            obj.key = param.key || definition.opt.key;

            //clone
            var sampleClone = app.clone(inputSample);
            app.replace(elm, sampleClone, true, true);
            obj.chooserElm = sampleClone;

            //hook
            obj.def = definition;
            sampleClone.pchooser = obj;

            //set input
            var previewElm = app.s(sampleClone, 'button span');
            obj.elm = previewElm;
            previewElm.innerHTML = param.nullTxt || '';

            obj.nullTxt = param.nullTxt;

            /**
             * Selected item
             */
            obj._item = null;

            obj._val = null;

            /**
             * Get or set value
             */
            obj.val = function (val) {
                if (val !== undefined) {
                    if (val) obj._cosDef = false;
                    else previewElm.innerHTML = param.nullTxt;

                    obj.onchange(obj, val, false);
                }

                return (obj._item && obj._item[obj.key]) || obj._val || null;
            };

            obj.valObj = function (valObj) {
                if (valObj !== undefined) {
                    obj._item = valObj;
                    obj.elm.innerHTML = valObj == null ? (param.nullTxt || '') : (obj.def.display(valObj));
                    obj.objProxy.onchange(obj, valObj, false);
                }
                return obj._item;
            };

            /**
             * Select default entry or first
             */
            obj.chooseDefault = function () {
                if (option.defaultVal) {
                    obj.val(option.devaultVal);
                } else {
                    var promise = definition.fetchPromise;
                    obj._cosDef = true;
                    if (!promise) {
                        var paramClone = JSON.parse(JSON.stringify(param.fetchParam)) || {};
                        paramClone.count = 1;//fetch only one
                        promise = definition.fetchPromise = definition.opt.fetch(paramClone, false).then(function (data) {
                            definition.fetchPromise = null;
                            return data;
                        }, function () {
                            definition.fetchPromise = null;
                        });
                    }
                    promise.then(function (data) {
                        if (obj._cosDef) {
                            obj.valObj((data.data && (data.data instanceof Array)) ? data.data[0] : (data instanceof Array ? data[0] : data));
                            obj._cosDef = false;
                        }
                    });
                }
            };

            /**
             * current objek bound to value
             */
            obj._item = null;

            /**
             * Proxy to set object
             */
            obj.objProxy = {
                /**
                 * Set or get val
                 */
                val: function (item) {
                    return obj.valObj(item);
                },
                /**
                 * When valobj is changed
                 */
                onchange: function (chooser, valObj, fromUser) { }
            };

            obj.focus = function () {
                obj.btn.focus();
            };

            obj.enable = function (enable) {
                return obj.btn.enable(enable);
            };

            obj.fetchParam = param.fetchParam || {};

            //set dialog
            obj.btn = app.s(sampleClone, 'button');
            obj.btn.pchooser = obj;

            obj.open = function () {
                //var obj = btn.pchooser;
                var dialog = definition.open(obj.fetchParam, {
                    input: obj,
                    nullable: param.nullable
                });

                dialog.input = obj;
                dialog.onvalue = function (value) {
                    var obj = dialog.input;
                    if (value !== undefined) {
                        obj.elm.innerHTML = value == null ? (param.nullTxt || '') : (obj.def.display(value) || '');

                        obj._item = value;
                        obj._val = value && value[obj.key];

                        obj.onchange(obj, obj._val, true);
                        obj.objProxy.onchange(obj, value, true);
                    }

                    obj.btn.focus();
                };

                return dialog;
            };

            app.click(app.s(obj.chooserElm, 'button'), obj.open, true);

            //--- init input
            if (param.suggest) {
                obj.chooseDefault();
            }
            obj.enable(param.enable);

            return obj;
        }

        return definition;
    };

    app.ui.chooser = function (name) {
        if (name === undefined) return component;

        return component.list[name]
            //for intellisense
            || component.define(name);
    };

    app.addScanner(function (elm) {
        app.each(app.sa(elm, TAG_NAME), function (chooserElm) {
            if (chooserElm.pchooser) return;//scan once
            var name = app.attr(chooserElm, 'name');
            app.ui.chooser(name).fill(chooserElm);
        });
    });
})(app);