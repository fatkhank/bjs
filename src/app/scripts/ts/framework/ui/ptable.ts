//--- tables
namespace app.ui {
    var TAG_NAME = "p-table"
        , TAG_BODY = "p-body"
        , TAG_HEAD = "p-head"
        , TAG_ROW = "p-r"

        , BODY_ROW_SELECTOR = "p-body>p-r"

        , ROW_HAS_ACTION = "has-action"

        , ROW_CHECKER = ".row-checker"
        , ALL_CHECKER = ".all-checker"
        , ROW_CHECKED = "checked"

        , ATTR_WIDTH = "cwidth"
        , ATTR_ALIGN = "calign"
        , ATTR_STYLE = "cstyle"
        ;

    const CLASS_ODD_ROW = "odd";
    const CLASS_EVEN_ROW = "even";

    type TTableOpt<D, R extends HTMLElement = HTMLElement> = {
        rowSample?: HTMLElement;
        bodyElm?: HTMLElement;
        getRow?: (rowElm: R) => any;
        setRow?: (rowElm: R, data: D, index?: number, setParam?: any) => void;
        rowTrigger?: "ALL" | "ENTER" | "CLICK2";
        findSample?: false | "preserve" | (() => HTMLElement);
    };

    export class Table<D=any> {
        static TAG_NAME = TAG_NAME;
        elm: HTMLElement;
        bodyElm: HTMLElement;
        rowSample: HTMLElement;
        opt: TTableOpt<D>;
        constructor(elm: HTMLElement, option: TTableOpt<D>) {
            this.elm = elm;
            this.opt = option;
            this.rowSample = option.rowSample
            this.bodyElm = option.bodyElm || app.s(elm, TAG_BODY)
        }
        /**
         * Remove all rows
         */
        empty() {
            app.s(this.elm, TAG_BODY).innerHTML = "";
        };

        /**
         * Add new row
         * @param data
         * @param rowAction
         */
        addRow(data, rowAction?): HTMLElement {
            return addRow(this, this.opt, data, rowAction);
        };

        /**
         * Get all row
         */
        rows(specifyCheck?: boolean) {
            var selector = TAG_ROW;
            if (specifyCheck !== undefined) {
                selector += specifyCheck ? "." + ROW_CHECKED : (":not(." + ROW_CHECKED + ")");
            }
            return app.sa(this.elm, TAG_BODY + ">" + selector);
        }

        /**
         * Get all row mapped
         */
        rowsMapped<M>(map: Mapper<M>, specifyCheck?: boolean) {
            var rows = this.rows(specifyCheck);
            var mappedRows = <M[]>[];
            for (var i = 0; i < rows.length; i++) {
                mappedRows.push(map.get(rows[i]));
            }
            return mappedRows;
        }

        /**
         * Get nth row. First = 0
         * @param index
         */
        row(index = 0) {
            return app.sa(this.elm, TAG_BODY + ">" + TAG_ROW + ":nth-child(" + ++index + ")");
        }

        /**
         * Set or get value
         * @param value
         */
        val(value?: Array<D>) {
            if (value !== undefined) this.setData(value);
            else return this.getData();
        };

        /**
         * Clear and set row values
         * @param rowValues
         * @param rowAction
         * @param setParam
         */
        setData(rowValues: Array<D>, rowAction?, setParam?) {
            this.bodyElm.innerHTML = "";
            this.addData(rowValues, rowAction, setParam);
        };

        /**
         * Add row values
         */
        addData(rowValues: Array<D>, rowAction, setParam) {
            var items = rowValues;
            for (var d = 0; d < items.length; d++) {
                addRow(this, this.opt, items[d], rowAction, d, setParam);
            }
        };

        /**
         * Get all table data
         * @param specifyCheck
         */
        getData(specifyCheck = null): Array<D> {
            var filtered = [];
            if (this.opt.getRow) {
                var selector = TAG_ROW;
                if (specifyCheck !== undefined) {
                    selector += specifyCheck ? "." + ROW_CHECKED : (":not(." + ROW_CHECKED + ")");
                }
                var rowElms = app.sa(this.bodyElm, selector);
                for (var i = 0; i < rowElms.length; i++) {
                    var item = this.opt.getRow(rowElms[i]);
                    if (item) filtered.push(item);
                }
            }
            return filtered;
        };

        /**
         * Get or set row checkable or not
         * @param rowElm
         * @param isCheckable
         */
        checkable(rowElm: HTMLElement, isCheckable: boolean = null) {
            var checker = app.s(rowElm, ROW_CHECKER);
            if (checker) {
                var check = app.ui.checkbox(checker);
                if (isCheckable !== undefined) {
                    check.enable(isCheckable);
                } else return check.checked();
            }
            return false;
        };

        /**
         * 
         * @param rowElm
         * @param action
         * @param withEnter
         */
        addAction(rowElm: HTMLElement, action: (rowElm: HTMLElement) => void) {
            app.addClass(rowElm, ROW_HAS_ACTION);

            //parse row acton trigger parameter
            let rowTrigger = "ALL";
            if (this.opt.rowTrigger) {
                rowTrigger = this.opt.rowTrigger;
            }

            //check if row action triggered with double click
            if ((rowTrigger == "ALL") || (rowTrigger == "CLICK2")) {
                app.click2(rowElm, action, true);
            }

            //check if row action triggered with enter
            if ((rowTrigger == "ALL") || (rowTrigger == "ENTER")) {
                app.onKeyEnter(rowElm, action, true);
            }
        }

        /**
         * Set check all rows
         * @param checkAll
         */
        checkAll(checkAll) {
            app.ui.checkbox(app.s(this.elm, ALL_CHECKER)).checked(false);
        }

        /**
         * Filter rows to be displayed. Set false as param to clear filter.
         * @param filter the filter function; false = clear filter
         */
        filterRow(filter: false | ((rowElm: HTMLElement) => boolean)) {
            let _ = this;
            let rowElms = _.rows();
            let nextIsOdd = true;
            for (var r = 0; r < rowElms.length; r++) {
                let rowElm = rowElms[r];
                if (typeof filter == "function") {
                    //do filter
                    if (filter(rowElm)) {
                        //if pass filter
                        show(rowElm);

                        if (nextIsOdd) {
                            //is odd
                            addClass(rowElm, CLASS_ODD_ROW);
                            remClass(rowElm, CLASS_EVEN_ROW);
                        } else {
                            //is even
                            remClass(rowElm, CLASS_ODD_ROW);
                            addClass(rowElm, CLASS_EVEN_ROW);
                        }
                        //flip class
                        nextIsOdd = !nextIsOdd;

                    } else {
                        //not pass filter
                        hide(rowElm);
                    }
                } else if (filter === false) {
                    //clear filter
                    remClass(rowElm, CLASS_ODD_ROW);
                    remClass(rowElm, CLASS_EVEN_ROW);
                    show(rowElm);
                }
            }
        }
    }

    type TTableElm = HTMLElement & {
        ptable: Table;
    };

    /**
     * Create table elm
     * @param elm
     * @param param
     */
    export function table<D=any, R extends HTMLElement = HTMLElement>(elm: HTMLElement, param: TTableOpt<D, R>): Table<D> {
        if (elm === null) {
            //elm not found, maybe wrong selector
            console.error("Cannot create table from null element. Please check selector for element used as table (check stack trace).");
        }
        if ((<TTableElm>elm).ptable) return (<TTableElm>elm).ptable;//init once
        if (!param) param = <any>{};
        if (!param.setRow) param.setRow = function () { return true; };

        var obj: Table<D> = (<TTableElm>elm).ptable = new Table<D>(elm, param);

        //autofind sample
        if (!obj.rowSample && !(param.findSample === false)) {
            obj.rowSample = app.s(elm, TAG_BODY + ">" + TAG_ROW);

            //if (param.scanSample !== false) {
            //    app.scan(obj.rowSample);
            //}

            if (param.findSample != "preserve") {
                obj.rowSample.remove();
            }
        }

        //----init
        var allChecker = app.s(elm, ALL_CHECKER);
        if (allChecker) {
            app.ui.checkbox(allChecker).onchange = function (checkerInput) {
                var checked = checkerInput.checked();
                app.each(app.sa(obj.bodyElm, ROW_CHECKER), function (rowCheckerElm) {
                    UICheckbox.check(rowCheckerElm, checked);
                });
            };
        }

        //add arrow nav
        app.onArrowUp(obj.bodyElm, function (body, ev) {
            if (app.isInput(ev.target)) return;
            var rowElm = app.s(body, TAG_ROW + ":focus");
            (<HTMLElement>(rowElm && rowElm.previousElementSibling) || app.s(body, TAG_ROW + ":last-child")).focus();
        }, true);
        app.onArrowDown(obj.bodyElm, function (body, ev) {
            if (app.isInput(ev.target)) return;
            var rowElm = app.s(body, TAG_ROW + ":focus");
            (<HTMLElement>(rowElm && rowElm.nextElementSibling) || app.s(body, TAG_ROW + ":first-child")).focus();
        }, true);

        return obj;
    };

    function addRow<D>(obj: Table<D>, param, data, rowAction?, index?, setParam?): HTMLElement {
        var rowClone = app.clone(obj.rowSample);
        //append
        if (!param.setRow || (param.setRow(rowClone, data, index, setParam) !== false)) {
            var body = obj.bodyElm;
            if (!body) {
                var children = obj.elm.children;
                for (var i = 0; i < children.length; i++) {
                    if (children[i].tagName == TAG_BODY) {
                        body = <HTMLElement>children[i];
                        break;
                    }
                }
            }
            body.appendChild(rowClone);
        }

        if (rowAction) obj.addAction(rowClone, rowAction);

        //add checker
        var checker = app.s(rowClone, ROW_CHECKER);
        if (checker) {
            app.ui.checkbox(checker).onchange = function (checker) {
                app.setClass(app.sup(checker.elm, TAG_ROW), ROW_CHECKED, checker.checked());
            };
        }

        //allow nav
        app.attr(rowClone, "tabindex", 0);

        return rowClone;
    }

    function addConstraint(row, prefix) {
        //for sub
        if (app.hasClass(row, "sub")) {
            addConstraint(row, ">pr>" + prefix);
        } else {
            var cells = app.sa(row, "p-c");
            for (var c = 0; c < cells.length; c++) {
                var cell = cells[c];

                var width = app.attr(cell, ATTR_WIDTH);
                var align = app.attr(cell, ATTR_ALIGN);
                var cstyle = app.attr(cell, ATTR_STYLE);

                if (align || width || cstyle) {
                    var css = "";
                    if (width) {
                        //                        css += "width:" + width + ";flex-grow:0;";
                        cell.style.width = width;
                        cell.style.flexGrow = "0";
                    }
                    if (align) {
                        css += "text-align:" + (align == "mid" ? "center" : align == "right" ? "right" : "left") + ";";
                    }
                    if (cstyle) {
                        css += cstyle;
                    }
                    var rule = prefix + ">p-r>p-c:nth-child(" + (c + 1) + ")" + "{" + css + "}";
                    app.addCSS(rule);
                }
            }
        }
    }
}