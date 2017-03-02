/// <reference path="../app/_base.js" />

//--- tables
(function (app) {
    var TAG_NAME = 'p-table'
        , TAG_BODY = 'p-body'
        , TAG_HEAD = 'p-head'
        , TAG_ROW = 'p-r'

        , BODY_ROW_SELECTOR = 'p-body>p-r'

        , ROW_HAS_ACTION = 'has-action'

        , ROW_CHECKER = '.row-checker'
        , ALL_CHECKER = '.all-checker'
        , ROW_CHECKED = 'checked'

        , ATTR_WIDTH = 'cwidth'
        , ATTR_ALIGN = 'calign'
        , ATTR_STYLE = 'cstyle'
    ;

    var component = {
        TAG_NAME: TAG_NAME
    };

    app.ui.table = function (elm, param) {
        if (elm === 0) return component;
        if (elm.ptable) return elm.ptable;//init once

        if (!param) param = {};

        var obj = elm.ptable = {
            elm: elm,
            className: null,

            /**
             * Default row sample
             */
            rowSample: param.rowSample,

            bodyElm: param.bodyElm || app.s(elm, TAG_BODY)
        };

        //intellisense
        param.getRow;
        if (!param.setRow) param.setRow = function () { return true; };

        //autofind sample
        if (!obj.rowSample && !(param.findSample === false)) {
            obj.rowSample = app.s(elm, TAG_BODY + '>' + TAG_ROW);

            //if (param.scanSample !== false) {
            //    app.scan(obj.rowSample);
            //}

            if (param.findSample != 'preserve') {
                obj.rowSample.remove();
            }
        }

        /**
         * Remove all rows
         */
        obj.empty = function () {
            app.s(obj.elm, TAG_BODY).innerHTML = '';
        };

        obj.addRow = function (data, rowAction) {
            return addRow(obj, param, data, rowAction);
        };

        /**
         * Get all row
         */
        obj.rows = function (specifyCheck) {
            var selector = TAG_ROW;
            if (specifyCheck !== undefined) {
                selector += specifyCheck ? '.' + ROW_CHECKED : (':not(.' + ROW_CHECKED + ')');
            }
            return app.sa(obj.elm, TAG_BODY + '>' + selector);
        };

        /**
         * Get nth row. First = 0
         */
        obj.row = function (index) {
            return app.sa(obj.elm, TAG_BODY + '>' + TAG_ROW + ':nth-child(' + ++index + ')');
        };

        obj.val = function (value) {
            if (value !== undefined) obj.setData(value);
            else return obj.getData();
        };

        /**
         * Clear and set row values
         */
        obj.setData = function (rowValues, rowAction, setParam) {
            obj.bodyElm.innerHTML = '';
            obj.addData(rowValues, rowAction, setParam);
        };

        /**
         * Add row values
         */
        obj.addData = function (rowValues, rowAction, setParam) {
            var items = rowValues;
            for (var d = 0; d < items.length; d++) {
                addRow(obj, param, items[d], rowAction, d, setParam);
            }
        };

        obj.getData = function (specifyCheck) {
            var filtered = [];
            if (param.getRow) {
                var selector = TAG_ROW;
                if (specifyCheck !== undefined) {
                    selector += specifyCheck ? '.' + ROW_CHECKED : (':not(.' + ROW_CHECKED + ')');
                }
                var rowElms = app.sa(obj.bodyElm, selector);
                for (var i = 0; i < rowElms.length; i++) {
                    var item = param.getRow(rowElms[i]);
                    if (item) filtered.push(item);
                }
            }
            return filtered;
        };

        /**
         * Get or set row checkable or not
         */
        obj.checkable = function (rowElm, isCheckable) {
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
         * Add action to row
         */
        obj.addAction = function (rowElm, action, withEnter) {
            app.addClass(rowElm, ROW_HAS_ACTION);
            app.click2(rowElm, action, true);
            if (withEnter !== false) app.onKeyEnter(rowElm, action, true);
        }

        /**
         * Set check all rows
         */
        obj.checkAll = function (checkAll) {
            app.ui.checkbox(app.s(elm, ALL_CHECKER)).checked(false);
        };

        //----init
        var allChecker = app.s(elm, ALL_CHECKER);
        if (allChecker) {
            app.ui.checkbox(allChecker).onchange = function (checkerInput) {
                var checked = checkerInput.checked();
                app.each(app.sa(obj.bodyElm, ROW_CHECKER), function (rowCheckerElm) {
                    app.ui.checkbox(0).check(rowCheckerElm, checked);
                });
            };
        }

        //add arrow nav
        app.onArrowUp(obj.bodyElm, function (body, ev) {
            if (app.isInput(ev.target)) return;
            var rowElm = app.s(body, TAG_ROW + ':focus');
            ((rowElm && rowElm.previousElementSibling) || app.s(body, TAG_ROW + ':last-child')).focus();
        }, true);
        app.onArrowDown(obj.bodyElm, function (body, ev) {
            if (app.isInput(ev.target)) return;
            var rowElm = app.s(body, TAG_ROW + ':focus');
            ((rowElm && rowElm.nextElementSibling) || app.s(body, TAG_ROW + ':first-child')).focus();
        }, true);

        return obj;
    };

    function addRow(obj, param, data, rowAction, index, setParam) {
        var rowClone = app.clone(obj.rowSample);
        //append
        if (!param.setRow || (param.setRow(rowClone, data, index, setParam) !== false)) {
            var body = obj.bodyElm;
            if (!body) {
                var children = obj.elm.children;
                for (var i = 0; i < children.length; i++) {
                    if (children[i].tagName == TAG_BODY) {
                        body = children[i];
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
                app.class(app.sup(checker.elm, TAG_ROW), ROW_CHECKED, checker.checked());
            };
        }

        //allow nav
        app.attr(rowClone, 'tabindex', 0);

        return rowClone;
    }

    function addConstraint(row, prefix) {
        //for sub
        if (app.hasClass(row, 'sub')) {
            addConstraint(row, '>pr>' + prefix);
        } else {
            var cells = app.sa(row, 'p-c');
            for (var c = 0; c < cells.length; c++) {
                var cell = cells[c];

                var width = app.attr(cell, ATTR_WIDTH);
                var align = app.attr(cell, ATTR_ALIGN);
                var cstyle = app.attr(cell, ATTR_STYLE);

                if (align || width || cstyle) {
                    var css = '';
                    if (width) {
                        //                        css += 'width:' + width + ';flex-grow:0;';
                        cell.style.width = width;
                        cell.style.flexGrow = '0';
                    }
                    if (align) {
                        css += 'text-align:' + (align == 'mid' ? 'center' : align == 'right' ? 'right' : 'left') + ';';
                    }
                    if (cstyle) {
                        css += cstyle;
                    }
                    var rule = prefix + '>p-r>p-c:nth-child(' + (c + 1) + ')' + '{' + css + '}';
                    app.addCSS(rule);
                }
            }
        }
    }
})(app);