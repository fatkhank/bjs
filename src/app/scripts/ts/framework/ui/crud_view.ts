namespace app.ui {
    const HEAD_LIST_SELECTOR = "[crud-role=heads_list]";
    const HEAD_ACTIVE_TABS_SELECTOR = "[crud-role=heads_detail]";
    const HEAD_ACTION_SELECTOR = "[crud-role=heads_action]";
    const CLASS_VIEW = "crud-view";
    const CLASS_VIEW_LIST = "[" + CLASS_VIEW + "=list]";
    const ATTR_MODE = "crud-mode";

    const CLASS_ACTION_BAR = ".action-bar";

    const BTN_RELOAD_LIST = "[btn=reload]";
    const BTN_SAVE = "[btn=save]";
    const BTN_DELETE = "[btn=remove]";
    const BTN_CREATE = "[btn=create]";
    const BTN_CLOSE = "[btn=tab_close]";
    const BTN_RELOAD = "[btn=tab_reload]";

    const BTN_FILTER = "[btn=filter]";
    const BTN_NEXT = "[btn=next]";
    const BTN_PREV = "[btn=prev]";

    const LIST_FILTER_BY = "[crud-role=filter_by]";
    const LIST_FILTER_TEXT_VALUE = "[crud-role=filter_text]";
    const LIST_FILTER_LIST_VALUE = "[crud-role=filter_list]";

    const CLASS_TAB_UNSAVED = "unsaved";

    const LIST_ROW_CLASS = ".crud-row";
    const LIST_ROW_ID = "crud-id";
    const LIST_ROW_TITLE = "crud-title";
    const LIST_ATTR_MODE = "crud-list";
    const LIST_HEAD_SELECTOR = "p-menu";
    const LISTGROUP_MIN_WIDTH = 150;//px

    const LIST_NAV_CURRENT = ".list_nav-current";
    const LIST_NAV_TOTAL = ".list_nav-total";
    const LIST_STATUS = "[crud-role=list_status]";

    const MODE_EDIT = "edit";
    const MODE_CREATE = "create";

    const SCREEN_MAXWIDTH_MOBILE = 800;//px

    const ROUTE_CREATE = "";

    /**
     * Action name for save entry
     */
    const ACTION_SAVE = "save";
    /**
     * Action name for delete entry
     */
    const ACTION_REMOVE = "remove";


    var accessKeyIndex = app.accesskey.register({});
    var listNavSample = app.grabSample(app.samples, ".crudtab-list_nav");
    var listBadgeSample = grabSample(".crudtab-list_navbadge");
    remClass(listBadgeSample, ".crudtab-list_navbadge");
    addClass(listBadgeSample, "badge")
    var crudTabCounter = 1;

    type TCVTabInitParam = {
        id?: number | string;
        isSaved?: boolean
    };
    type TTabAction<T, P, A, R  = any> = ((tabElm: HTMLElement, tab?: CVTab<T, P>, initParam?: P & TCVTabInitParam, runParam?: R) => (A | Promise<A> | void));
    type TTabActionStep<T, P, A, R = any> = {
        before?: (tab: CVTab<T, P>, run: (runParam?: R) => void, cancel: () => void) => void,
        run: TTabAction<T, P, A, R>,
        done?: (ctab: CVTab<T, P>, runResult: A) => void,
        fail?: (ctab: CVTab<T, P>, error?) => void,
    };
    type TCVTabMode<T, P> = {
        name?: string,
        tabInit?: "ignore",
        init?: (tabElm: HTMLElement, tab?: CVTab<T, P>, param?: P & TCVTabInitParam, optInitResult?: T) => (Promise<T> | Promise<void> | void);
        title?: string | ((tabElm: HTMLElement, initParam: P) => string);
        actions?: {
            [id: string]: true | TTabAction<T, P, any> | TTabActionStep<T, P, any>
        };
    };
    type TCVTabOpt<T> = {
        /**
         * Default mode
         */
        mode?: string;
        init?: (tabElm: HTMLElement, param?: TCVTabInitParam, tab?: CVTab) => Promise<T>;
        title?: string | ((tabElm: HTMLElement) => string);
        chooseMode?: (tabElm: HTMLElement) => string;
    };

    type TCVTabElm = HTMLElement & {
        pcvtab: CVTab
    };

    export class CVTab<T = any, P = any> extends ui.Tab {
        crudView: CrudView<any, T, P>;
        private initParam: P & TCVTabInitParam;
        private mode: TCVTabMode<T, P>;
        private loadPromise: Promise<any>;
        constructor(crudView: CrudView<any, T, P>, tab: ui.Tab, mode: TCVTabMode<T, P>, initParam: P & TCVTabInitParam) {
            super(tab.obj, tab.headElm, tab.bodyElm, tab.id, tab.sample);
            var _ = this;
            _.crudView = crudView;
            _.mode = mode;
            _.initParam = initParam;

            //add hook
            (<TCVTabElm>tab.bodyElm).pcvtab = this;
            (<TCVTabElm>tab.headElm).pcvtab = this;

            addEnterHandler(tab.headElm);

            //add close control
            var btnClose = app.s(_.bodyElm, BTN_CLOSE);
            if (btnClose) {
                app.click(btnClose, function (evb, ev) {
                    if (!_.isSaved()) {
                        app.ui.confirm({
                            msg: app.getText("discard_changes_q"),
                            no: app.getText("cancel")
                        }, function () {
                            _.close();
                        });
                    } else _.close();
                }, true);
            }

            //reload control
            var btnReload = app.s(_.bodyElm, BTN_RELOAD);
            if (btnReload) {
                app.show(btnReload);
                app.click(btnReload, function () {
                    if (!_.isSaved()) {
                        app.ui.confirm({
                            msg: app.getText("discard_changes_q"),
                            no: app.getText("cancel")
                        }, function () {
                            _.reload();
                        });
                    } else _.reload();
                }, true);
            }

            _.hideActions();

            //mark clean
            if (initParam.isSaved === undefined) {
                initParam.isSaved = true;
            }
            _.isSaved(initParam.isSaved);
        }

        /**
         * Get or set save status of tab
         */
        isSaved(isSaved?: boolean) {
            let _ = this;
            if (isSaved !== undefined) {
                if (isSaved) app.remClass(_.headElm, CLASS_TAB_UNSAVED);
                else app.addClass(_.headElm, CLASS_TAB_UNSAVED);
            } else return !app.hasClass(_.headElm, CLASS_TAB_UNSAVED);
        }

        close() {
            let _ = this;
            //find fallback head
            let fallbackList = _.crudView._list;//current list
            if (!fallbackList) {
                //if no recent list, find any enabled
                for (var n in _.crudView.allList) {
                    let list = _.crudView.allList[n];
                    if (list.enabled) {
                        fallbackList = list;
                        break;
                    }
                }
            }

            super.close(fallbackList && fallbackList.headElm);
        }

        /**
         * Reload tab
         * @param modeName
         */
        reload(modeName?: string): Promise<any> {
            let _ = this;
            //if loading
            if (_.loadPromise) return _.loadPromise;

            let crudView = _.crudView;

            let mode = _.mode;
            //if mode specified, try
            if (modeName) {
                mode = crudView.modes[modeName];
                //warn if mode unavailable
                if (!mode) {
                    app.ui.notifError("Mode '" + modeName + "' not available");
                    return null;
                }
                //set current mode;
                _.mode = mode;
            }

            let tabContentElm = _.bodyElm;
            let initParam = _.initParam;

            //hide actions
            _.hideActions();

            return _.loadPromise = ui.loading(tabContentElm, promise(function (success, fail) {
                //init default
                let tabInit = PROMISE_NULL;
                if ((mode.tabInit != "ignore")//checkif ignored
                    && crudView.edit.init) {
                    tabInit = crudView.edit.init(tabContentElm, initParam, _);
                    if (!isPromise(tabInit)) {
                        //if not promise, fake it
                        tabInit = PROMISE_NULL;
                    }
                }

                //init mode
                tabInit.then(function (tabInitResult) {
                    let modeInit = PROMISE_NULL;
                    if (mode.init) {
                        let newinit = mode.init(tabContentElm, _, initParam, tabInitResult);
                        if (isPromise(newinit)) {
                            //if init is promise, use it
                            modeInit = <any>newinit;
                        }
                    }

                    //if init done
                    return modeInit.then(function (data) {
                        //update title
                        var getTitle = mode.title;
                        if (!getTitle) {
                            //fallback to global setting
                            if (mode.name == MODE_CREATE) {
                                getTitle = crudView.create.title;
                            } else {
                                getTitle = crudView.edit.title;
                            }
                        }

                        if (getTitle) {
                            if (typeof getTitle == "string") {
                                _.title(getTitle);
                            } else {
                                _.title(getTitle(tabContentElm, initParam));
                            }
                        }

                        //show actions
                        _.showActions();

                        //load done
                        success(data);
                    }, function (error) {
                        fail(error);
                    });
                }, function (error) {
                    fail(error);
                });
            }).then(function (d) {//success
                _.loadPromise = null;

                //focus to close button
                var btnClose = app.s(_.bodyElm, BTN_CLOSE);
                if (btnClose) btnClose.focus();

                return d;
            }, function (e) {//there is error
                _.loadPromise = null;
                app.ui.notifError(app.getText("get_failed"));
                return e;
            }));
        }

        private hideActions() {
            //hide other action button
            app.hide(app.sa(this.bodyElm, CLASS_ACTION_BAR + " p-body [btn]"));
        }

        private showActions() {
            //save controls
            let _ = this;
            let actions = _.mode.actions;

            //add controls
            if (!actions) return;

            //show specified
            for (var actionName in actions) {
                var btn: any = app.s(_.bodyElm, "[btn=" + actionName + "]");
                if (btn) {
                    //tampillkan tombol
                    app.show(btn);

                    btn.paction = actionName;
                    app.click(btn, function (btn) {
                        _.doAction(btn.paction);
                    }, true);
                }
            }
        }

        /**
         * Skip action from tab
         */
        skipAction(actionName: string) {
            var btn = app.s(this.bodyElm, "[btn=" + actionName + "]");
            if (btn) btn.style.display = "none";
        }

        /**
         * Do some tab action
         */
        doAction(actionName: string) {
            let _ = this;
            let actions = _.mode.actions;

            //find action by name
            let actionParam = actions[actionName];
            if (!actionParam) {
                ui.notifError("Action '" + actionName + "' not exists");
                return null;
            }

            //parse param
            let before: (tab: CVTab<T, P>, run: () => void, cancel: () => void) => void;
            let afterDone: (tab: CVTab<T, P>, runResult) => void;
            let afterFail: (tab: CVTab<T, P>, error) => void;
            var runAction: TTabAction<T, P, any>;
            if (typeof actionParam == "function") {
                runAction = actionParam;
            } else if (typeof actionParam == "object") {
                runAction = actionParam.run;
                before = actionParam.before;
                afterDone = actionParam.done;
                afterFail = actionParam.fail;
            } else {
                //its actions group, do nothing
                return null;
            }

            //execute before
            let promiseBefore = PROMISE_NULL;
            if (before) {
                promiseBefore = app.promise(function (done, fail) {
                    before(_, done, fail);
                });
            }

            //if before finish
            return promiseBefore.then(function (runParam) {
                //make action promise
                let promiseRun = <Promise<T>>runAction(_.bodyElm, _, _.initParam, runParam);
                if (!app.isPromise(promiseRun)) {
                    //if not promise, fake it
                    promiseRun = PROMISE_NULL;
                }

                //loading
                return ui.loading(_.bodyElm, promiseRun).then(function (data) {
                    //execute after success
                    if (afterDone) {
                        afterDone(_, data);
                    }
                    return data;
                }, function (error) {
                    //execute after error
                    if (afterFail) {
                        afterFail(_, error);
                    }
                    return error;
                });
            });
        }
    }

    type TCVListRowElm = HTMLElement;
    type TCVListFetchParam = {
        count?: number;
        skip?: number;
        sortby?: string;
        props?: string[] | "all";
    };
    type TCVListFetchResult<T> = {
        total: number;
        skip: number;
        data: T[];
    };
    type TCVListSort = {
        value: string;
        label: string;
    };
    type TListReloadMode = "data" | "count" | "auto";
    type TFillRowResult = string | {
        id: string | number;
        title?: string;
    };
    type TListTabOpt<T extends { id: string | number }> = {
        /**
         * Fetch function for list
         */
        fetch?: <V extends TCVListFetchParam> (param: V) => Promise<TCVListFetchResult<T>>;
        /**
         * Filling function for list row
         */
        fillRow?: (rowElm: HTMLElement, data: T, list?: ListTab<T>) => TFillRowResult;
        /**
         * Override list action on dbl click. If null, default behaviour is show detail
         */
        action?: (rowElm: TCVListRowElm) => void;
        /**
         * Default detail mode
         */
        detailMode?: string | ((rowElm: TCVListRowElm) => string);

        /**
         * Default fetch param
         */
        fetchParam?;

        /**
         * When list set to this
         */
        onset?: (list: ListTab<T>) => void,
        /**
         * When list changed from this
         */
        onunset?: (list: ListTab<T>) => void,
        /**
         * Available sort entries
         * 
         * @type {TCTVListSort[]}
         */
        sorts?: TCVListSort[];
        sortby?: string;
        enable?: boolean | (() => boolean);
    };

    class ListTab<L extends { id: string | number }> extends ui.Tab {
        name: string;
        private group: ListGroup<L>;
        private ctview: CrudView<L, any, any>;
        private opt: TListTabOpt<L>;
        private fetchPromise: Promise<L>;
        enabled = true;
        private badgeElm: HTMLElement;

        //paging
        private skip = 0;
        private count = 20;
        filter = {};

        private nextable = false;
        private prevable = false;

        /**
         * Last row id selected
         */
        private lastID: number;

        constructor(ctview: CrudView<L, any, any>, name: string, headElm: HTMLElement, bodyElm: HTMLElement, group: ListGroup<L>, option: TListTabOpt<L>) {
            super(ctview.tab, headElm, bodyElm);
            var _ = this;
            _.ctview = ctview;
            _.name = name;
            if (!option) option = <any>{};
            _.opt = option;

            //set fetchparam
            if (!option.fetchParam) option.fetchParam = {};
            _.group = group;

            //show head or not
            let enabled = true;
            if (option.enable !== undefined) {
                if (typeof option.enable == "function") {
                    enabled = option.enable();
                } else {
                    enabled = option.enable;
                }
            }
            _.enabled = enabled;
            app.show(_.headElm, enabled);
            //todo must remove elm instead hide because css for :first-of-type not working
            //            if (!showHead) obj.headElm.remove();

            //find badge
            _.badgeElm = s(headElm, ".badge");

            //set head control
            ctview.tab.switcher.add(group.elm, _.headElm, 0);
            addEnterHandler(_.headElm);
            app.show(_.headElm);
            app.click(_.headElm, function (headElm) {
                let list = _.group.setTab(_.name);

                //if current view is this crudview, replace route
                if (state.view() == _.ctview) {
                    state.replace();
                }

                if (list) {
                    _.ctview._route = list.name;
                    list.reload("data");
                }
            });
        }

        /**
         * Reload list
         * @param mode
         */
        reload(mode: TListReloadMode = "auto") {
            let _ = this;
            let listElm = _.group.elm;

            //if fetching on progress
            if (_.fetchPromise) return _.fetchPromise;

            //check filter
            var payload = { skip: _.skip, count: _.count };
            //write default fetch param
            for (var i in _.opt.fetchParam) { payload[i] = _.opt.fetchParam[i]; }

            //write filter
            let filterParam = _.group.filterData();
            if (filterParam) {
                for (var i in filterParam) { payload[i] = filterParam[i]; }
            }

            //add sorting if any
            if (_.opt.sortby) {
                payload["sortby"] = _.opt.sortby;
            }

            //switch mode
            if (mode == "auto") {
                if (_.ctview.tab.switcher.headElm == _.headElm) {
                    //if this current tab, reload the data
                    mode = "data";
                } else {
                    //its not displayed, only reload count
                    mode = "count";
                }
            }
            if (mode == "count") {
                //only get the total, skip data
                payload.count = 0;
            }

            //find fetch func
            let fetchFunc = _.opt.fetch || _.group.fetch;
            let fetchPromise = fetchFunc(payload).then(function (response) {
                var data = response.data;

                //set count
                _.badgeElm.innerHTML = response.total > 99 ? "99+" : String(response.total);

                if (mode == "data") {
                    _.render(data);

                    var btnNext: any = app.s(listElm, BTN_NEXT);
                    if (btnNext) {
                        _.nextable = response.total > response.skip + data.length;
                        btnNext.enable(_.nextable);
                    }

                    var btnPrev = app.s(listElm, BTN_PREV);
                    if (btnPrev) {
                        _.prevable = (response.skip > 0);
                        app.attr(btnPrev, "disabled", "true", !_.prevable);
                    }

                    //update page info
                    (<HTMLInputElement>app.s(listElm, LIST_NAV_CURRENT)).value = (_.count ? Math.ceil(response.skip / _.count) + 1 : 1).toString();
                    app.s(listElm, LIST_NAV_TOTAL).innerHTML = <string>(_.count ? Math.ceil(response.total / _.count) : "?");
                    app.s(listElm, LIST_STATUS).innerHTML = String(response.total && response.skip + 1) + "-" + Math.min(response.skip + _.count, response.total) + " dari " + response.total + " baris";
                }
                _.fetchPromise = null;
            }, function (error) {
                _.fetchPromise = null;
                return error;
            });

            //do fetch
            if (mode == "data") {
                //show loading
                _.fetchPromise = ui.loading(listElm, fetchPromise, app.getText("get_failed"));
            }

            return _.fetchPromise;
        }

        /**
         * Render data in list
         */
        render(data) {
            let _ = this;
            let table = _.group.table;
            table.empty();
            for (var i in data) {
                var datum = data[i];
                var rowElm = table.addRow(datum, function (rowElm) {
                    //tandai row terakhir yang diseleksi
                    _.lastID = app.attr(rowElm, LIST_ROW_ID);

                    //jika ada override aksi default
                    if (_.opt.action) {
                        _.opt.action(rowElm);
                    } else {
                        //get id
                        let rowData = _.group.getData(rowElm);

                        if (!rowData.id) {
                            //if has no id, do nothing
                            return;
                        }

                        //choose detail mode
                        var chooseDetailMode = _.opt.detailMode || MODE_EDIT;
                        var detailMode = (typeof chooseDetailMode == "function") ? chooseDetailMode(rowElm) : chooseDetailMode;

                        _.ctview.showDetail(rowData.id, detailMode, rowData);
                    }
                });

                //focus row if id match last selected id
                if (datum.id == _.lastID) {
                    (function (focusedElm) {
                        setTimeout(function () {
                            focusedElm.focus();
                        });
                    })(rowElm);
                }

            }
        }

        hide() {
            if (this.opt.onunset) {
                this.opt.onunset(this);
            }
        }

        show() {
            let _ = this;
            if (_.opt.onset) {
                _.opt.onset(_);
            }
            _.group.list = _;
            super.show();

            return this;
        }

        next() {
            let _ = this;
            if (_.nextable) {
                _.skip += _.count;
                return _.reload();
            }
            return PROMISE_NULL;
        }

        prev() {
            let _ = this;
            if (_.prevable) {
                _.skip -= _.count;
                if (_.skip < 0) _.skip = 0;
                return _.reload();
            }
            return PROMISE_NULL;
        }

        setPage(page: number) {
            this.skip = Math.max(this.count * ((page || 1) - 1), 0);
        }
    }

    type TFilter<F> = {
        mapper?: Mapper<F>;
        moreData?: (form: F, formData?: any) => any,
        transform?: (oldData: any, form?: F) => any
    };

    class ListGroup<L extends { id: string | number }> {
        elm: HTMLElement;
        table: ui.Table<L>;
        fetch: <V extends TCVListFetchParam> (param: V) => Promise<TCVListFetchResult<L>>;
        /**
         * Filling function for list row
         */
        fillRow?: (rowElm: HTMLElement, data: L, list?: ListTab<L>) => TFillRowResult;

        /**
         * Current list tab
         * 
         * @type {ListTab<T>}
         * @memberof ListGroup
         */
        list: ListTab<L>;

        private filter: TFilter<any>;

        private ctview: CrudView<L, any, any>;
        constructor(ctview: CrudView<L, any, any>) {
            let _ = this;
            _.ctview = ctview;
            _.elm = s(ctview.elm, "[" + CLASS_VIEW + "=list]");

            // setup table
            _.table = app.ui.table<L>(app.s(_.elm, app.ui.Table.TAG_NAME), {
                rowTrigger: "ALL",
                setRow: function (rowElm, data) {
                    var opt = _.fillRow(rowElm, data, _.list);

                    if (opt !== null) {
                        //if has result 
                        var title = opt, id = data.id;
                        if (typeof opt == "object") {
                            title = opt.title;
                            id = opt.id || data.id;
                        }
                        app.attr(rowElm, LIST_ROW_ID, id);
                        app.attr(rowElm, LIST_ROW_TITLE, title);
                    }
                }
            });
            app.remClass(_.table.rowSample, "sample");

            let listElm = _.elm;

            //setup navigation
            var navPlaceholderElm = app.s(listElm, "[crud-part=list_nav]");
            if (navPlaceholderElm) {
                app.replace(navPlaceholderElm, app.clone(listNavSample));
            }

            //add reload control
            app.click(app.s(listElm, BTN_RELOAD_LIST), function () {
                _.list.reload().then(function () {
                    //focus to first row
                    s(_.table.bodyElm, LIST_ROW_CLASS).focus();
                });
            }, true, true);

            //add nav control
            app.click(app.s(listElm, BTN_NEXT), function () {
                _.next();
            }, true);
            app.click(app.s(listElm, BTN_PREV), function () {
                _.prev();
            }, true);
            app.onArrowRight(_.table.bodyElm, function () {
                _.next().then(function () {
                    //select first row
                    s(_.table.bodyElm, LIST_ROW_CLASS).focus();
                });
            });
            app.onArrowLeft(_.table.bodyElm, function () {
                _.prev().then(function () {
                    //select first row
                    s(_.table.bodyElm, LIST_ROW_CLASS).focus();
                });
            });

            //add gotopage control
            var inputPage: any = app.s(listElm, LIST_NAV_CURRENT);
            inputPage.onchange = function () {
                var page = inputPage.valueAsNumber;
                _.setPage(parseInt(page || 1));
            };
            inputPage.onfocus = function (val) {
                //inputPage.setSelectionRange(0, inputPage.value.length);//select all
            };
            app.onKeyEnter(inputPage, function () {
                var page = inputPage.valueAsNumber;
                _.setPage(parseInt(page || 1));
                _.reload();
            });
        }

        /**
         * Setup filter
         */
        setFilter<F>(opt: TFilter<F>) {
            let _ = this;
            this.filter = opt;

            //trigger filter on btn filter clicked
            app.click(app.s(_.elm, BTN_FILTER), function () {
                _.reload();
            }, true);

            //trigger filter on filter input changed
            if (opt.mapper) {
                //automatically reload if filter param changed
                opt.mapper.traverseInput(_.elm, function (input) {
                    //do filter on chage
                    input.onchange = function () {
                        setTimeout(function () {
                            _.reload();
                        });
                    };
                });
            }

        }

        filterData() {
            let _ = this;
            //if has no filter, empty filter
            if (!_.filter) { return {}; }

            let filter = _.filter;
            let data = {};

            //add from mapper
            if (filter.mapper) {
                let mapperData = filter.mapper.getData(_.elm);
                for (var d in mapperData) data[d] = mapperData[d];
            }

            //get additional data
            if (filter.moreData) {
                let moreData = filter.moreData(filter.mapper.get(_.elm), data);
                for (var d in moreData) data[d] = moreData[d];
            }

            //add final transformation
            if (filter.transform) {
                data = filter.transform(data, filter.mapper.get(_.elm));
            }

            return data;
        }

        //--------------------------- list -----------------
        addTab(name: string, option: TListTabOpt<L>) {
            let _ = this;

            //find head elm
            let headElm = s(_.ctview.elm, "[" + LIST_ATTR_MODE + "=" + name + "]");
            if (!headElm) {
                console.error("List head '" + name + "' elm not found");
                return;
            }
            //add tabindex
            attr(headElm, "tabindex", "0");

            //add title
            let titleElm = s(headElm, "b");
            if (!titleElm) titleElm = headElm;
            attr(headElm, "title", titleElm.innerText);

            //add badge if not exists
            let badgeElm = s(headElm, ".badge");
            if (!badgeElm) {
                badgeElm = clone(listBadgeSample);
                headElm.appendChild(badgeElm);
            }

            let tab = new ListTab(this.ctview, name, headElm, _.elm, this, option);
            this.ctview.allList[name] = tab;
            return tab;
        }

        setTab(name: string) {
            return this.ctview.setList(name);
        }

        reload() {
            if (this.list) return this.list.reload();
            return PROMISE_NULL;
        }

        next() {
            if (this.list) return this.list.next();
            return PROMISE_NULL;
        }

        prev() {
            if (this.list) return this.list.prev();
            return PROMISE_NULL;
        }

        setPage(page: number) {
            if (this.list) this.list.setPage(page);
        }

        /**
         * Get data bound to row
         */
        getData(rowElm: HTMLElement) {
            return {
                id: app.attr(rowElm, LIST_ROW_ID),
                title: app.attr(rowElm, LIST_ROW_TITLE)
            };
        }
    }

    type TCrudTabViewOpt<P> = {
        firstList?: string;
        /**
         * Maximum tab
         * @type {number}
         */
        maxTab?: number | ((sample: ui.TTabSample, count: number) => boolean),

        /**
         * Optional tab init param
         */
        tabOpt?: P;

        show?: (route: string, subroute?: string) => boolean
    };

    class CrudView<L extends { id: string | number }=any, T=   any, P = any> extends View {
        static ATTR_ROW_ID = LIST_ROW_ID;
        static ATTR_ROW_TITLE = LIST_ROW_TITLE;
        static TAG_NAME = "crud-tab";

        private id: number;

        opt: TCrudTabViewOpt<P>;
        tab: TabGroup;

        //----
        allList: { [name: string]: ListTab<any> } = {};//todo internal

        /**
         * Current list
         * 
         * @private
         * @type {CrudList<any>}
         * @memberof CrudTabView
         */
        _list: ListTab<L>;//todo internal

        private editSample: ui.TTabSample;
        private editSampleName = "detail";
        edit = <TCVTabOpt<any>>{};

        private createSample: ui.TTabSample;
        private createSampleName = "create";
        create = <TCVTabOpt<any>>{};

        modes = <{ [name: string]: TCVTabMode<any, P> }>{};//todo internal

        btnCreate: HTMLButtonElement;

        constructor(elm: HTMLElement, option: TCrudTabViewOpt<P>) {
            super(elm);
            var _ = this;
            _.id = crudTabCounter++;

            if (!option) option = <any>{};
            _.opt = option;

            _.tab = ui.contentTab(elm, {
                findSample: false
            });

            //setup detail
            if (!option.maxTab) {
                option.maxTab = function (sample, count) {
                    var firstListHead = app.s(elm, HEAD_LIST_SELECTOR + ">" + LIST_HEAD_SELECTOR);
                    return (sample.count >= 3) && // minimal bisa buka 3 tab
                        (firstListHead && firstListHead.offsetWidth < LISTGROUP_MIN_WIDTH);
                }
            };

            //----- setup detail & create
            var activeHeadsContainer = app.s(_.elm, HEAD_ACTIVE_TABS_SELECTOR);
            var activeToggleSample = app.grabSample(activeHeadsContainer, " p-menu");

            //find edit view elm
            let name = _.editSampleName;
            var viewElm = app.s(_.elm, "[" + CLASS_VIEW + "=" + _.editSampleName + "]");
            if (viewElm) {
                //create sample
                _.editSample = _.tab.addSample(name,
                    activeToggleSample,
                    viewElm,
                    activeHeadsContainer,
                    app.s(_.elm, "p-body"),
                    _.opt.maxTab
                );
                //remove sample
                app.remClass(viewElm, "sample");
                viewElm.remove();
            }

            //find create
            name = _.createSampleName;
            viewElm = app.s(_.elm, "[" + CLASS_VIEW + "=" + name + "]");
            if (viewElm) {
                //if has custom create view
                _.createSample = _.tab.addSample(name,
                    activeToggleSample,
                    viewElm,
                    activeHeadsContainer,
                    app.s(_.elm, "p-body"),
                    _.opt.maxTab
                );
                //remove sample
                app.remClass(viewElm, "sample");
                viewElm.remove();
            } else {
                //if has no create, assume create = edit
                _.createSample = _.editSample;
                _.createSampleName = _.editSampleName;
            }

            //--- controls
            let btnCreate = <HTMLButtonElement>app.s(elm, BTN_CREATE);
            _.btnCreate = btnCreate;
            if (btnCreate) {
                addEnterHandler([btnCreate]);
                app.click(btnCreate, function () {
                    _.showCreate();
                }, true);
            }
        }

        /**
         * Create list group
         * 
         * @readonly
         * @memberof CrudTabView
         */
        initList(): ListGroup<L> {
            return new ListGroup<L>(this);
        }

        /**
         * Reload list.
         * 
         * @param {string} [name]. If null, will reload current list
         * @memberof CrudTabView
         */
        reloadList(name?: string, mode?: TListReloadMode) {
            //todo
            let list = this.allList[name];
            if (list) return list.reload(mode);
            return app.asPromise(null);
        }

        /**
         * Change current list
         * 
         * @param {string} name 
         * @memberof CrudTabView
         */
        setList(name: string): ListTab<L> {
            let _ = this;
            let nextList = _.allList[name];
            if (!nextList) return null;

            //unset current
            let prevList = _._list;
            if (prevList) {
                prevList.hide();
            }

            //set next
            _._list = nextList;
            nextList.show();

            return nextList;
        }

        //---------------------------- detail&create ------------------
        /**
         * Edit specific row or id
         */
        showDetail(id: number | string, modeName?: string, param?: P & TCVTabInitParam) {
            var _ = this;
            let title = "Detail-" + id;

            //check if already opened
            var tabId = "crudTab" + _.id + "_" + id;
            var tab = _.tab.openTab(tabId);

            //if mode not specified, find default
            if (!modeName) {
                modeName = _.edit.mode || MODE_EDIT;
                if (_.edit.chooseMode) {
                    modeName = _.edit.chooseMode(tab.bodyElm);
                }
            }

            //check if mode available
            if (!modeName || !_.modes[modeName]) {
                app.ui.notifError("Mode '" + modeName + "' not available");
            }

            //force open new tab if mode differ
            if (tab) {
                if (modeName != _.mode(tab.bodyElm)) {
                    tab.close();
                    tab = null;
                }
            }

            //create new tab
            if (!tab) {
                tab = _.tab.newTab(_.editSampleName, title, tabId);
                if (!tab) {
                    //notify if full
                    app.ui.notif(app.getText("tab_full_warning"));
                    return null;
                }
            }

            //inject id to param
            if (!param) param = _.opt.tabOpt || <any>{};
            param.id = id;

            //set route
            _._route = (_._route && (<any>_._route).endsWith("/") ? "" : "/") + String(id);

            let ctab = new CVTab(_, tab, _.modes[modeName], param);
            _.mode(ctab.bodyElm, modeName);
            ctab.show();
            //scroll to top
            _.elm.scrollTop = 0;
            //immediately reload
            return ctab.reload();
        }

        addMode<T>(name: string, option?: TCVTabMode<T, P>) {
            let _ = this;
            if (!option) {
                option = <any>{};
            }

            if (!option.actions) {
                option.actions = {};
            }

            _.modes[name] = option;
            option.name = name;
            return name;
        }

        //--- create

        /**
         * Show create tab
         */
        showCreate(param?: P & TCVTabInitParam) {
            var _ = this;
            let modeName = MODE_CREATE;
            var modeHandler = _.modes[modeName];

            //check if mode available
            if (!_.modes[modeName]) {
                app.ui.notifError("Mode '" + modeName + "' not available");
            }

            //create new tab
            var tab = _.tab.newTab(_.createSampleName, app.getText("new"));
            if (!tab) {
                app.ui.notif(app.getText("tab_full_warning"));
                return null;
            }

            //inject id to param
            if (!param) param = _.opt.tabOpt || <any>{};
            //default create tab is note saved
            if (param.isSaved === undefined) param.isSaved = false;

            let ctab = new CVTab(_, tab, _.modes[modeName], param);
            _.mode(tab.bodyElm, MODE_CREATE);
            ctab.show();

            //scroll to top
            _.elm.scrollTop = 0;

            //hide reload button
            var btnReload = app.s(tab.bodyElm, BTN_RELOAD);
            if (btnReload) {
                hide(btnReload);
            }

            //update state
            _._route = ROUTE_CREATE;
            state.push();

            //immediately reload
            ctab.reload();
            return tab;
        }

        /**
         * Get or set mode
         * 
         * @param {any} elm 
         * @param {string} [mode] 
         * @returns 
         * 
         * @memberof CrudTabView
         */
        mode(elm, mode?: string): string {
            if (mode != undefined) {
                return app.attr(elm, ATTR_MODE, mode);
            }
            return app.attr(elm, ATTR_MODE);
        }

        getTab(elm: HTMLElement): CVTab<T, P> {
            return (<TCVTabElm>elm).pcvtab;
        }

        init(path: string) {
            let _ = this;

            //if has path, let show() handle it
            if (path) return;

            //find first list
            let firstList = _.setList(_.opt.firstList);
            if (!firstList) {
                //if not found, set any list
                let firstName: string;
                for (var n in _.allList) {
                    let list = _.allList[n];
                    if (list.enabled) {
                        firstName = list.name;
                        break;
                    }
                }

                firstList = _.setList(firstName);
            }

            //setup layout
            if (_.elm.offsetWidth <= SCREEN_MAXWIDTH_MOBILE) {
                if (firstList) {
                    //autocollapse filter on list if screen is small
                    ui.card(s(_.elm, CLASS_VIEW_LIST + " .actions")).collapse(true);
                }
            }

            var parentElm = _.elm.parentElement;
            registerAccessKey(parentElm);
            //register when menu change
            app.on(parentElm, app.ui.Switcher.EVENT_SWITCH_TO, registerAccessKey);

            //reload list count
            for (let n in _.allList) {
                _.allList[n].reload("count");
            }
        }

        show(route?: string) {
            let _ = this;

            state.view(_);

            //remove slash
            let result = /[^/]+/g.exec(route);
            if (route && result) {
                //try find in list
                let sub = result[0];
                let list = _.setList(result[0]);

                //reload list count
                for (let n in _.allList) {
                    _.allList[n].reload("count");
                }

                if (!list) {
                    //if not in list, maybe show create
                    if (sub == MODE_CREATE) {
                        _.showCreate();
                    } else {
                        //check custom view
                        if (_.opt.show) {
                            if (_.opt.show(route, sub)) {
                                //route found
                                return;
                            }
                        }


                        //get first part
                        let idString = sub;
                        let mode = null;
                        let first = /^[^/]+/g.exec(sub);
                        if (first) {
                            idString = first[0];

                            //in debug mode, can show any mode
                            if (ENV.app_debug) {
                                mode = sub.substr(idString.length).replace("/", "");
                            }
                        }

                        //try parse id
                        let idNumber = parseInt(sub);
                        //show detail if its id
                        if (idNumber) {
                            _.showDetail(idNumber, mode);
                        }
                    }
                }
            }
        }

        _route = "";//todo internal
        getRoute(): string {
            return this._route;
        }
    }

    export function crudView<L extends { id: string | number } = any, T = any, P = any>(elm: HTMLElement, option?: TCrudTabViewOpt<P>) {
        return new CrudView<L, T, P>(elm, option);
    }


    //--------------------------------- UTILS ----------------------------------------
    /**
     * Add shortcut
     * 
     * @param {any} parentElm 
     */
    function registerAccessKey(parentElm) {
        function selectTab(index) {
            return function () {
                var list = app.sa(parentElm, CrudView.TAG_NAME + ">p-head>" + HEAD_LIST_SELECTOR + ">" + LIST_HEAD_SELECTOR);
                if (index >= list.length) {
                    //select active tabs
                    var toggle = app.sa(parentElm, CrudView.TAG_NAME + ">p-head>" + HEAD_ACTIVE_TABS_SELECTOR + ">" + LIST_HEAD_SELECTOR);
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
                var actions = app.sa(parentElm, CrudView.TAG_NAME + ">p-body>p-content[is-active]>" + CLASS_ACTION_BAR + ">p-body>*:not(.hidden)");
                if (index < actions.length) {
                    //select active tabs
                    actions[index].click();
                }
            };
        }

        function openCreate() {
            var btn = app.s(parentElm, CrudView.TAG_NAME + ">p-head " + HEAD_ACTION_SELECTOR + " " + BTN_CREATE);
            if (btn) btn.click();
        }

        app.accesskey.register({
            "shift+n": openCreate,
            "alt+n": openCreate,
            "ctrl+n": openCreate,
            "alt+w": function () {
                var btn = app.s(parentElm, CrudView.TAG_NAME + ">p-body>p-content[is-active] " + BTN_CLOSE);
                if (btn) btn.click();
            },
            "alt+r": function () {
                //cari reload detail
                var btn = app.s(parentElm, CrudView.TAG_NAME + ">p-body>p-content[is-active] " + BTN_RELOAD);
                //cari reload list
                if (!btn) btn = app.s(parentElm, CrudView.TAG_NAME + ">p-body>p-content[is-active] " + BTN_RELOAD_LIST);
                if (btn) btn.click();
            },
            "alt+f": function () {
                //focus on filter list
                var filter = app.s(parentElm, CrudView.TAG_NAME + ">p-body>p-content[is-active] " + LIST_FILTER_BY);
                if (filter) filter.click();
            },
            "shift+1": selectTab(0),
            "shift+2": selectTab(1),
            "shift+3": selectTab(2),
            "shift+4": selectTab(3),
            "shift+5": selectTab(4),
            "shift+6": selectTab(5),
            "shift+7": selectTab(6),
            "shift+8": selectTab(7),
            "shift+9": selectTab(8),
            "shift+0": selectTab(9),
            "alt+1": selectAction(0),
            "alt+2": selectAction(1),
            "alt+3": selectAction(2),
            "alt+4": selectAction(3),
            "alt+5": selectAction(4),
            "alt+6": selectAction(5),
            "alt+7": selectAction(6),
            "alt+8": selectAction(7),
            "alt+9": selectAction(8),
            "alt+0": selectAction(9),
        }, accessKeyIndex);
    }

    /**
     * Click button on press enter
     * 
     * @param {any} btns 
     * @returns 
     */
    function addEnterHandler(btns) {
        for (var i = 0; i < btns.length; i++) {
            var btn = btns[i];
            if (btn == null) return;
            //app.attr(btn, "tabindex", "0");
            app.onKeyEnter(btn, function (btn) {
                btn.click();
            }, true);
        }
    }
}