//---- CRUD tab
/// <reference path="../app/_base.js" />
/// <reference path="./content_tab.js" />
/// <reference path="./_components.js" />

(function (app) {
    var HEAD_LIST_SELECTOR = '[crud-role=heads_list]'
        , HEAD_ACTIVE_TABS_SELECTOR = '[crud-role=heads_detail]'
        , HEAD_ACTION_SELECTOR = '[crud-role=heads_action]'
        , CLASS_VIEW = 'crud-view'
        , ATTR_MODE = 'crud-mode'

        , ACTION_BAR = '.action-bar'

        , BTN_RELOAD_LIST = '[btn=reload]'
        , BTN_SAVE = '[btn=save]'
        , BTN_DELETE = '[btn=remove]'
        , BTN_CREATE = '[btn=create]'
        , BTN_CLOSE = '[btn=tab_close]'
        , BTN_RELOAD = '[btn=tab_reload]'

        , BTN_FILTER = '[btn=filter]'
        , BTN_NEXT = '[btn=next]'
        , BTN_PREV = '[btn=prev]'

        , LIST_FILTER_BY = '[crud-role=filter_by]'
        , LIST_FILTER_TEXT_VALUE = '[crud-role=filter_text]'
        , LIST_FILTER_LIST_VALUE = '[crud-role=filter_list]'

        , CLASS_TAB_UNSAVED = 'unsaved'

        , LIST_ROW_CLASS = '.crud-row'
        , LIST_ROW_ID = 'crud-id'
        , LIST_ROW_TITLE = 'crud-title'
        , LIST_ATTR_MODE = 'crud-list'
        , LIST_HEAD_SELECTOR = 'p-menu'
        , LISTGROUP_MIN_WIDTH = 150//px

        , LIST_NAV_CURRENT = '.list_nav-current'
        , LIST_NAV_TOTAL = '.list_nav-total'
        , LIST_STATUS = '[crud-role=list_status]'

        , MODE_EDIT = 'edit'
        , MODE_CREATE = 'create'
    ;

    var component = {
        ATTR_ROW_ID: LIST_ROW_ID,
        ATTR_ROW_TITLE: LIST_ROW_TITLE,
        TAG_NAME: 'crud-tab'
    };
    var crudTabCounter = 1;
    var accessKeyIndex = app.accesskey.register({});

    var listNavSample = app.grabSample(app.samples, '.crudtab-list_nav');

    //------------ Crud Tabs
    function CrudTabInstance(elm, crudParam) {
        var _ = this;
        _.elm = elm;
        _.id = crudTabCounter++;
        /**
         * View collection
         */
        _.views = {};
        _.opt = crudParam;

        _.tab = null;
        /**
         * Default list part
         */
        _.list = {};
        /**
         * Default detail part
         */
        _.detail = {};
    }
    (function (CTProto) {
        /**
         * Open createForm
         */
        CTProto.showCreate = function (initParam) {
            var _ = this;
            var modeHandler = _.create.modes[MODE_CREATE];

            var tab = _.tab.newTab(_.opt.createView, app.getText('new'));
            if (!tab) {
                app.ui.notif(app.getText('tab_full_warning'));
                return null;
            }

            addEnterHandler([tab.headElm]);
            _.mode(tab.bodyElm, MODE_CREATE);
            addBeforeLoadControl(_, tab, tab.bodyElm, modeHandler);

            //update title
            var title = modeHandler.title || _.create.title;
            if (title) tab.title(title(tab.bodyElm, initParam) || app.getText('new'));

            addAfterLoadControl(_, modeHandler, tab, tab.bodyElm, initParam, function (data) {
                tab.close(_.list.mode.headElm);

                //open recently added
                if (data && data.message == 'created' && data.id) _.showDetail(data.id, MODE_EDIT);
            });

            improveTab(tab);
            tab.isSaved(false);

            //additional init
            if (_.create.init) _.create.init(tab.bodyElm, initParam);
            if (modeHandler.init) modeHandler.init(tab.bodyElm, initParam);

            return tab;
        };

        //--- functions
        CTProto.newList = function (listParam) {
            var _ = this;
            var listObj = {
                /**
                 * Thhe list view
                 */
                elm: null,

                /**
                 * Fetch function
                 */
                fetch: null,
                render: null,
                reload: null,

                /*
                 * load in process or not
                 */
                loading: false,

                /**
                 * Filter payload. (passed to fetch function)
                 */
                _filter: {},
                /**
                 * paging param
                 */
                _skip: 0,
                _count: 20,


                /**
                 * Available modes for list
                 */
                modes: {},

                /**
                 * Available filters
                 */
                filters: null,

                /**
                 * Current mode
                 */
                mode: null,

                /**
                 * Before row filled
                 */
                onfilling: null,
                /**
                 * After row filled
                 */
                onfilled: null,

                //aksi saat diklik (override show detail)
                action:null
            };

            if (listParam) {
                /**
                 * Content sample list
                 */
                listObj.elm = listParam.elm;
            }

            var listElm = listObj.elm;

            listObj.table = app.ui.table(app.s(_.elm, app.ui.table(0).TAG_NAME), {
                setRow: function (rowElm, data) {
                    var opt = listObj.fillRow(rowElm, data, listObj.mode && listObj.mode.name);
                    var title = opt, id = data.id;
                    if (typeof opt == 'object') {
                        title = opt.title;
                        id = opt.id || data.id;
                    }
                    app.attr(rowElm, LIST_ROW_ID, id);
                    app.attr(rowElm, LIST_ROW_TITLE, title);
                }
            });

            app.remClass(listObj.table.rowSample, 'sample');

            /**
             * Render data in list
             */
            listObj.render = function (data) {
                if (listObj.onfilling) listObj.onfilling();

                listObj.table.empty();
                for (var i in data) {
                    listObj.table.addRow(data[i], function (rowElm) {
                        //jika ada override aksi default
                        if (listObj.action) {
                            action(rowElm);
                        } else {
                            var detailMode = listObj.mode.detailMode;
                            _.showDetail(rowElm, (typeof detailMode == 'function') ? detailMode(rowElm) : detailMode);
                        }
                    });
                }

                if (listObj.onfilled) listObj.onfilled();
            };

            /**
             * Reload list
             */
            listObj.reload = function () {
                if (listObj.loading) return;

                var payload = { skip: listObj._skip, count: listObj._count };
                for (var i in listObj._filter) { payload[i] = listObj._filter[i]; }
                for (var i in listObj.filters) { payload[i] = listObj.filters[i]; }

                listObj.loading = true;
                app.ui.loading(listElm, listObj.fetch(payload).then(function (response) {
                    var data = response.data;
                    listObj.render(data);

                    var btnNext = app.s(listElm, BTN_NEXT);
                    if (btnNext) {
                        btnNext.enable(response.total > response.skip + data.length);
                    }

                    var btnPrev = app.s(listElm, BTN_PREV);
                    if (btnPrev) {
                        btnPrev.enable(response.skip > 0);
                    }

                    //update page info
                    app.s(listElm, LIST_NAV_CURRENT).value = listObj._count ? Math.ceil(response.skip / listObj._count) + 1 : 1;
                    app.s(listElm, LIST_NAV_TOTAL).innerHTML = listObj._count ? Math.ceil(response.total / listObj._count) : '?';
                    app.s(listElm, LIST_STATUS).innerHTML = (response.total && response.skip + 1) + '-' + Math.min(response.skip + listObj._count, response.total) + ' dari ' + response.total + ' baris';

                    listObj.loading = false;
                }, function (error) {
                    listObj.loading = false;
                    return error;
                }), app.getText('get_failed'));
            };

            //add reload control
            app.click(app.s(listElm, BTN_RELOAD_LIST), function () {
                listObj.reload();
            }, true, true);

            //add nav control
            app.click(app.s(listElm, BTN_NEXT), function () {
                listObj._skip += listObj._count;
                listObj.reload();
            }, true);
            app.click(app.s(listElm, BTN_PREV), function () {
                listObj._skip -= listObj._count;
                if (listObj._skip < 0) listObj._skip = 0;
                listObj.reload();
            }, true);

            var inputPage = app.s(listElm, LIST_NAV_CURRENT);
            inputPage.onchange = function (val) {
                listObj._skip = listObj._count * (parseInt(val || 0) - 1);
            };
            inputPage.onfocus = function (val) {
                inputPage.setSelectionRange(0, inputPage.value.length);//select all
            };
            app.onKeyEnter(inputPage, function () {
                listObj._skip = listObj._count * ((inputPage.valueAsNumber || 0) - 1);
                listObj.reload();
            });

            ///change mode
            listObj.newMode = function (modeName, modeParam) {
                if (!_.opt.initListMode) {
                    _.opt.initListMode = modeName;
                }

                if (!modeParam) modeParam = {};

                var obj = listObj.modes[modeName] = {
                    name: modeName,
                    /**
                     * Filter param for list (passed to fetch function)
                     */
                    filter: modeParam.filter || {},
                    /**
                     * Default mode on row click
                     */
                    detailMode: modeParam.detailMode || MODE_EDIT,
                    /**
                     * Default detail view
                     */
                    detailView: modeParam.detailView || _.views.detail,

                    /**
                     * When mode set to this
                     */
                    onset: modeParam.onset,
                    /**
                     * WHen mode change from this
                     */
                    onunset: modeParam.onunset,

                    /**
                     * When reload performed
                     */
                    onreloaded: modeParam.onreloaded,

                    headElm: app.s(_.elm, '[' + LIST_ATTR_MODE + '=' + modeName + ']')
                };


                //todo must remove elm instead hide because css for :first-of-type not working
                app.show(obj.headElm, (modeParam.enable === undefined) || (modeParam.enable === true) || ((typeof modeParam.enable == 'function') && modeParam.enable()));
                if (!((modeParam.enable === undefined) || (modeParam.enable === true) || ((typeof modeParam.enable == 'function') && modeParam.enable()))) obj.headElm.remove();

                return obj;
            };
            /**
             * Change list mode
             */
            listObj.setMode = function (modeName, noreload) {
                //unset current
                if (listObj.mode) {
                    if (listObj.mode.onunset) listObj.mode.onunset(listObj.elm);
                }
                var mode = listObj.mode = listObj.modes[modeName] || listObj.newMode(modeName);
                if (mode.onset) mode.onset(listObj.elm);
                listObj._filter = mode.filter;
                if (mode.headElm) _.tab.switcher.headOn(mode.headElm, true);
                if (!noreload) listObj.reload();
            };

            //------- OVERIDABLE
            /**
             * Render row from fetch result. MUST return row title
             */
            listObj.fillRow = function (elm, data) { return data.id; };

            /**
             * fetch list data
             */
            listObj.fetch = function () { return app.asPromise({ data: [] }) };

            //add filter control
            var filterType = app.s(listElm, LIST_FILTER_BY);
            if (filterType) {
                filterType = app.ui.select(filterType, { nullable: false });
                var lastFilter = '';
                var filterValue = app.ui.input(app.s(listElm, LIST_FILTER_TEXT_VALUE));

                /**
                 * Tambahkan filter
                 */
                listObj.setFilters = function (listFilters) {
                    filterType.empty();
                    for (var i = 0; i < listFilters.length; i++) {
                        var filter = listFilters[i];
                        filterType.addOption({ label: filter.label, value: filter.filter });
                        if (filter.list) app.ui.datalist(filterValue, filter.list);
                    }
                };


                function doFilter() {
                    //remove old filter
                    delete listObj._filter[lastFilter];
                    lastFilter = filterType.val();
                    var value = filterValue.val();
                    if (typeof value == 'string') value = value.trim();
                    listObj._filter[lastFilter] = value;
                    listObj.reload();
                }
                app.click(app.s(listElm, BTN_FILTER), doFilter, true);
                app.onKeyEnter(filterValue.elm, doFilter, true);
            }

            return listObj;
        };

        /**
         * Edit specific row or id
         */
        CTProto.showDetail = function (idOrRowElm, listOrMode, initParam) {
            var _ = this;
            var id, title;
            if (idOrRowElm instanceof HTMLElement) {
                id = app.attr(idOrRowElm, LIST_ROW_ID);
                title = app.attr(idOrRowElm, LIST_ROW_TITLE);
            } else {
                id = idOrRowElm;
                title = 'detail ' + id + '';
            }

            //check if already opened
            var tabId = 'crudTab' + _.id + '_' + id;
            var tab = _.tab.openTab(tabId);

            //compare mode
            var mode = listOrMode;
            if (listOrMode instanceof HTMLElement) {//it is listElmElm
                mode = _.mode(listOrMode);
            }
            //cek if mode available
            if (!_.detail.modes[mode]) app.ui.notif('Mode "' + mode + '" not available');

            if (tab) {
                //force open new tab if mode differ
                if (mode != _.mode(tab.bodyElm)) {
                    tab.close(_.list.mode.headElm);
                    tab = null;
                }
            }

            if (!tab) {
                tab = _.tab.newTab(_.opt.editView, title, tabId);
                if (!tab) {
                    app.ui.notif(app.getText('tab_full_warning'));
                    return null;
                }
            }

            addEnterHandler(tab.headElm);

            var tab = improveTab(tab);
            tab.isSaved(true);
            _.mode(tab.bodyElm, mode);

            /**
             * Reload tab content
             */
            tab.reload = function () {
                if (tab.loading) return;
                addBeforeLoadControl(_, tab, tab.bodyElm, _.detail.modes[mode]);

                var modeHandler = _.detail.modes[_.mode(tab.bodyElm)];
                var tabContentElm = tab.bodyElm;

                tab.loading = true;

                (initParam || (initParam = {})).id = id;
                app.ui.loading(tabContentElm, new Promise(function (finishLoading) {
                    var init;

                    function initFailed() {
                        app.ui.notifError(app.getText('get_failed'));
                        tab.loading = false;
                        finishLoading();
                    }

                    function defaultInitDone() {
                        function reloadDone() {
                            //add control
                            addAfterLoadControl(_, modeHandler, tab, tabContentElm, initParam, function (data) {
                                //reload data
                                if (tab.reload) tab.reload();
                            });

                            //update title
                            var title = modeHandler.title || _.detail.title;
                            if (title) {
                                tab.title(title(tabContentElm));
                            }

                            //add delete control
                            var actionRemove = (modeHandler.actions && modeHandler.actions.remove) || modeHandler.onremove;
                            if (actionRemove) {
                                var btnDelete = app.s(tabContentElm, BTN_DELETE);
                                if (btnDelete) {
                                    app.click(btnDelete, function () {
                                        var msg = function () { return app.getText('delete_item_q'); };
                                        var successMsg = function () { return app.getText('data_removed'); };
                                        var removeFunc = actionRemove;
                                        if (typeof (actionRemove) == 'object') {
                                            var rmmodeHandler = actionRemove;
                                            removeFunc = rmmodeHandler.func;
                                            if (rmmodeHandler.confirm) msg = actionRemove.confirm;
                                            if (rmmodeHandler.success) successMsg = actionRemove.success;
                                        }
                                        app.ui.confirm(msg(tabContentElm), function () {
                                            removeFunc(tabContentElm, { id: id }).then(function () {
                                                app.ui.notifSuccess(successMsg());
                                                tab.close(_.list.mode.headElm);
                                            });
                                        });
                                    }, true);
                                }
                            }

                            tab.loading = false;
                            finishLoading();
                        }

                        //init child
                        if (modeHandler.init) {
                            init = modeHandler.init(tabContentElm, initParam);
                            if (init && init.then) {//check if promisable
                                //init
                                init.then(reloadDone, initFailed);
                            } else reloadDone();
                        } else reloadDone();

                    }

                    //init default
                    if (_.detail.init) {
                        init = _.detail.init(tabContentElm, initParam);
                        if (init && init.then) {
                            init.then(defaultInitDone, initFailed);
                        } else defaultInitDone();
                    } else defaultInitDone();
                }));
            };

            //scroll to top
            _.elm.scrollTop = 0;

            //immediately reload
            tab.reload();

            return tab;
        };

        /**
         * Get or set mode for view
         */
        CTProto.mode = function (elm, mode) {
            if (mode != undefined) {
                return app.attr(elm, ATTR_MODE, mode);
            }
            return app.attr(elm, ATTR_MODE);
        };

        //----- inits
        function registerAccessKey(parentElm) {
            function selectTab(index) {
                return function () {
                    var list = app.sa(parentElm, component.TAG_NAME + '>p-head>' + HEAD_LIST_SELECTOR + '>' + LIST_HEAD_SELECTOR);
                    if (index >= list.length) {
                        //select active tabs
                        var toggle = app.sa(parentElm, component.TAG_NAME + '>p-head>' + HEAD_ACTIVE_TABS_SELECTOR + '>' + LIST_HEAD_SELECTOR);
                        var togIndex = index - list.length;
                        //ambil terakhir,jika melebihi jumlah
                        if (togIndex < toggle.length) {
                            toggle[togIndex].click();
                        } else if (toggle.length) toggle[toggle.length - 1].click();
                    } else {
                        //select list
                        list[index].click();
                    }
                };
            }
            function selectAction(index) {
                return function () {
                    var actions = app.sa(parentElm, component.TAG_NAME + '>p-body>p-content[is-active]>' + ACTION_BAR + '>p-body>*:not(.hidden)');
                    if (index < actions.length) {
                        //select active tabs
                        actions[index].click();
                    }
                };
            }

            function openCreate() {
                var btn = app.s(parentElm, component.TAG_NAME + '>p-head ' + HEAD_ACTION_SELECTOR + ' ' + BTN_CREATE);
                if (btn) btn.click();
            }

            app.accesskey.register({
                'shift+n': openCreate,
                'alt+n': openCreate,
                'ctrl+n': openCreate,
                'alt+w': function () {
                    var btn = app.s(parentElm, component.TAG_NAME + '>p-body>p-content[is-active] ' + BTN_CLOSE);
                    if (btn) btn.click();
                },
                'alt+r': function () {
                    //cari reload detail
                    var btn = app.s(parentElm, component.TAG_NAME + '>p-body>p-content[is-active] ' + BTN_RELOAD);
                    //cari reload list
                    if (!btn) btn = app.s(parentElm, component.TAG_NAME + '>p-body>p-content[is-active] ' + BTN_RELOAD_LIST);
                    if (btn) btn.click();
                },
                'alt+f': function () {
                    //focus on filter list
                    var filter = app.s(parentElm, component.TAG_NAME + '>p-body>p-content[is-active] ' + LIST_FILTER_BY);
                    if (filter) filter.click();
                },
                'shift+1': selectTab(0),
                'shift+2': selectTab(1),
                'shift+3': selectTab(2),
                'shift+4': selectTab(3),
                'shift+5': selectTab(4),
                'shift+6': selectTab(5),
                'shift+7': selectTab(6),
                'shift+8': selectTab(7),
                'shift+9': selectTab(8),
                'shift+0': selectTab(9),
                'alt+1': selectAction(0),
                'alt+2': selectAction(1),
                'alt+3': selectAction(2),
                'alt+4': selectAction(3),
                'alt+5': selectAction(4),
                'alt+6': selectAction(5),
                'alt+7': selectAction(6),
                'alt+8': selectAction(7),
                'alt+9': selectAction(8),
                'alt+0': selectAction(9),
            }, accessKeyIndex);
        };
        /**
         * Trigger me when view shown for first time
         */
        CTProto.activate = function () {
            //listen on menu change
            this.list.setMode(this.opt.initListMode || 'all', false);

            var parentElm = this.elm.parentElement;
            registerAccessKey(parentElm);
            //register when menu change
            app.on(parentElm, app.ui.switcher().EVENT_SWITCH_TO, registerAccessKey);
        };

        function improveTab(tab) {
            tab.loading = false;

            //hook
            tab.bodyElm.pcrudTab = tab;
            //hook head
            tab.bodyElm.headElm = tab.headElm;

            //tampilkan tab
            tab.show();

            /**
             * Add or remove unsave mark on tab
             */
            tab.isSaved = function (isSaved) {
                return DinamicTabBluePrint.prototype.isSaved(tab.bodyElm, isSaved);
            };

            return tab;
        }

        function addBeforeLoadControl(_, tab, tabContentElm, modeHandler) {
            //close control
            var btnClose = app.s(tabContentElm, BTN_CLOSE);
            if (btnClose) {
                app.click(btnClose, function (evb, ev) {
                    if (!tab.isSaved()) {
                        app.ui.confirm({
                            msg: app.getText('discard_changes_q'),
                            no: app.getText('cancel')
                        }, function () {
                            tab.close(_.list.mode.headElm);
                        });
                    } else tab.close(_.list.mode.headElm);
                }, true);
            }

            //reload control
            var btnReload = app.s(tabContentElm, BTN_RELOAD);
            if (btnReload) {
                app.show(btnReload, !!tab.reload);
                if (tab.reload) {
                    app.click(btnReload, function () {
                        if (!tab.isSaved()) {
                            app.ui.confirm({
                                msg: app.getText('discard_changes_q'),
                                no: app.getText('cancel')
                            }, function () {
                                tab.reload();
                            });
                        } else tab.reload();
                    }, true);
                }
            }

            //hide other
            if (modeHandler) app.hide(app.sa(tabContentElm, ACTION_BAR + ' p-body [btn]'));
        }

        function addAfterLoadControl(_, modeHandler, tab, tabContentElm, initParam, onSuccess) {
            //save controls

            var actions = modeHandler.actions || (modeHandler.actions = {});
            //add controls
            if (actions) {
                //show specified
                for (var actionName in modeHandler.actions) {
                    var btn = app.s(tabContentElm, '[btn=' + actionName + ']');
                    if (btn) {
                        if (actionName == 'save') continue;//biarkan diurus di bawah
                        //tampillkan tombol
                        app.show(btn);
                        var action = modeHandler.actions[actionName];
                        if (typeof action == 'function') {
                            btn.paction = action;
                            app.click(btn, function (btnElm) {
                                var promise = btnElm.paction.call(actions, tabContentElm, initParam);
                                if (promise && promise.then) {
                                    app.ui.loading(tabContentElm, promise);
                                }
                            }, true);
                        }
                    }
                }
            }

            var actionSave = actions.save || modeHandler.onsave;
            if (actionSave) {
                var btnSave = app.s(tabContentElm, BTN_SAVE);
                if (btnSave) {
                    app.show(btnSave);
                    app.click(btnSave, function () {
                        var savePromise = actionSave(tabContentElm, initParam).then(function (data) {
                            //close tab
                            tab.isSaved(true);
                            if (btnSave.executeOnceOnSaved) {
                                btnSave.executeOnceOnSaved();
                                btnSave.executeOnceOnSaved = null;
                            } else if (onSuccess) onSuccess(data);
                        });
                        app.ui.loading(tabContentElm, savePromise, function (e) {
                            var msg = (e.responseJSON && e.responseJSON.error) || e.responseText || e.statusText || e;
                            return app.getText('save_failed') + '.\n ' + msg;
                        }, null, app.getText('saving'));
                    }, true);
                }
            }
        }
    })(CrudTabInstance.prototype);

    //--------- tab blueprint
    function DinamicTabBluePrint(crudTab, sampleElm) {
        var _ = this;
        _.tab = crudTab;
        _.elm = sampleElm;
        _.modes = {};

        //default title
        _.title = null;
        //default init
        _.init = null;
    }
    (function (DTProto) {
        /**
         * Ambil save button
         */
        DTProto.btnSave = function (detailElm) { return app.s(detailElm, BTN_SAVE); };
        /**
         * Ambil btn close
         */
        DTProto.btnClose = function (detailElm) { return app.s(detailElm, BTN_CLOSE); };
        /**
         * Ambil btn delete
         */
        DTProto.btnDelete = function (detailElm) { return app.s(detailElm, BTN_DELETE); };
        DTProto.get = function (detailElm) {
            return detailElm.pcrudTab;
        };
        /**
         * Tutup tab
         */
        DTProto.close = function (tabContentElm) {
            tabContentElm.pcrudTab.close(this.tab.list.mode.headElm);
        };

        /**
         * Reload ulang tab
         */
        DTProto.reload = function (tabContentElm, mode) {
            if (mode) CrudTabInstance.prototype.mode(tabContentElm, mode);
            tabContentElm.pcrudTab.reload();
        };

        /**
         * Reload ulang tab
         */
        DTProto.isSaved = function (tabContentElm, isSaved) {
            if (isSaved !== undefined) {
                if (isSaved) app.remClass(tabContentElm.headElm, CLASS_TAB_UNSAVED);
                else app.addClass(tabContentElm.headElm, CLASS_TAB_UNSAVED);
            } else return !app.hasClass(tabContentElm.headElm, CLASS_TAB_UNSAVED);
        };
    })(DinamicTabBluePrint.prototype);

    app.ui.crudTab = function (elm, crudParam) {
        if (elm === undefined) return component;

        if (!crudParam) crudParam = {};

        if (!crudParam.initListMode) crudParam.initListMode = null;

        //Default view for edit
        if (crudParam.editView === undefined) crudParam.editView = 'detail';
        //Default view for create
        if (crudParam.createView === undefined) crudParam.createView = 'detail';

        //tempelkan bagian2
        var navPlaceholderElm = app.s(elm, '[crud-part=list_nav]');
        if (navPlaceholderElm) {
            app.replace(navPlaceholderElm, app.clone(listNavSample));
        }

        var obj = new CrudTabInstance(elm, crudParam);
        elm.pcrud = obj;

        var pageTab = obj.tab = app.ui.contentTab(elm, {
            findSample: false
        });

        //-- init default list
        //fetch elements
        obj.views.list = app.s(elm, '[' + CLASS_VIEW + '=list]');
        var listHeads = app.sa(elm, LIST_HEAD_SELECTOR);
        addEnterHandler(listHeads);
        obj.list = obj.newList({ elm: obj.views.list });
        for (var l = 0; l < listHeads.length; l++) {
            var headElm = listHeads[l];

            obj.tab.title(headElm, obj.tab.title(headElm));
            if (!app.hasAttr(headElm, LIST_ATTR_MODE)) continue;

            headElm.plist = obj.list;
            obj.tab.switcher.add(obj.views.list, headElm);
            app.click(headElm, function (headElm) {
                var plist = headElm.plist;
                if (plist.loading) {
                    //dont change mode if loading
                    obj.tab.switcher.headOn(plist.mode.headElm, false);
                } else {
                    plist.setMode(app.attr(headElm, LIST_ATTR_MODE));
                }
            });
        }


        //-- init default detail
        var activeHeadsContainer = app.s(elm, HEAD_ACTIVE_TABS_SELECTOR);
        var activeToggleSample = app.grabSample(activeHeadsContainer, ' p-menu');
        if (!crudParam.maxTab) crudParam.maxTab = function (sample, count) {
            var firstListHead = app.s(elm, HEAD_LIST_SELECTOR + '>' + LIST_HEAD_SELECTOR);
            return (sample.count >= 3) && // minimal bisa buka 3 tab
                (firstListHead && firstListHead.offsetWidth < LISTGROUP_MIN_WIDTH);
        };
        function addDinamicTabBluePrint(name) {
            if (obj.views[name]) {
                return obj[name];//no duplicate
            }
            var viewElm = obj.views[name] = app.grabSample(elm, '[' + CLASS_VIEW + '=' + name + ']');

            pageTab.addSample(name,
                activeToggleSample,
                viewElm,
                activeHeadsContainer,
                app.s(elm, 'p-body'),
                crudParam.maxTab
            );
            return new DinamicTabBluePrint(obj, viewElm);
        }

        if (crudParam.editView) obj.detail = addDinamicTabBluePrint(crudParam.editView);
        if (crudParam.createView) obj.create = addDinamicTabBluePrint(crudParam.createView);

        //--- controls
        var btnCreate = app.s(elm, BTN_CREATE);
        if (btnCreate) {
            addEnterHandler([btnCreate]);
            app.click(btnCreate, function () {
                obj.showCreate({});
            }, true);
        }

        return obj;
    };

    //add focus trigger enter
    function addEnterHandler(btns) {
        for (var i = 0; i < btns.length; i++) {
            var btn = btns[i];
            if (btn == null) return;
            //app.attr(btn, 'tabindex', '0');
            app.onKeyEnter(btn, function (btn) {
                btn.click();
            }, true);
        }
    }
})(app);