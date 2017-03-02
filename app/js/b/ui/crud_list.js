//---- CRUD tab
/// <reference path="../app/_base.js" />
/// <reference path="_components.js" />

(function (app) {
    var LIST_ROW = '.list-row'
        , LIST_ROW_CONTAINER = '.list-rows'
        , BTN_REMOVE = '[btn=list-remove]'
        , counter = 0
    ;

    app.ui.crudList = function (elm, param) {
        var obj = new AppInput(null, elm);

        /**
         * Row elements
         */
        obj._rows = [];

        if (!param) param = {};

        /**
         * On add row
         */
        if (!param.add) param.add = function (rowElm, insert) { insert(); };

        /**
         * remove row
         */
        if (!param.remove) param.remove = function (rowElm, isNewEntry) { };

        /**
         * Render row
         */
        if (!param.setRow) param.setRow = function (rowElm, item) { };

        /**
         * Filter row item on get val()
         */
        if (!param.getRow) param.getRow = function () { };

        //for intellisense
        param.rowSample;
        param.softRemove;

        obj.param = param;

        if (!param.nocard) obj.card = app.ui.card(elm);

        var rowContainer = app.s(elm, LIST_ROW_CONTAINER) || elm;
        var rowSample = param.rowSample || app.grabSample(rowContainer, LIST_ROW);

        obj.id = ++counter;

        obj.val = function (value) {
            if (value instanceof Array) {
                obj.clear();

                obj._rows = [];
                var items = value;
                var beforeSetRow = param.setRow, afterSetRow = null;
                if (typeof param.setRow != 'function') {
                    afterSetRow = beforeSetRow.after;
                    beforeSetRow = param.setRow.before;
                }

                //untuk tiap item
                for (var d = 0; d < items.length; d++) {
                    var item = items[d];
                    var rowClone = app.clone(rowSample);

                    if (param.setRow && (!beforeSetRow || beforeSetRow(rowClone, item, d) !== false)) {
                        obj._rows.push(rowClone);
                        rowContainer.appendChild(rowClone);
                        addDeleteControl(rowClone, function (rowElm) {
                            if (!obj.param.softRemove) {
                                obj._rows.shift(obj._rows.indexOf(rowElm));
                            }
                            app.hide(rowElm);
                            param.remove(rowElm, false);
                        });
                        if (afterSetRow) afterSetRow(rowClone, item, d);
                    }
                }

                //cek mode editable atau tidak
                app.show(app.sa(rowContainer, BTN_REMOVE), obj._enable);
            }
            else return obj.getVal();
        };

        obj.getVal = function (option) {
            var filtered = [];
            if (param.getRow) {
                for (var i = 0; i < obj._rows.length; i++) {
                    var item = param.getRow(obj._rows[i], option);
                    if (item) filtered.push(item);
                }
            }
            return filtered;
        };

        /**
         * Add new item
         */
        obj.add = function (datum) {
            var rowClone = app.clone(rowSample);
            var btn = app.s(rowClone, BTN_REMOVE);
            if (btn) app.show(btn, obj._enable);
            return param.add(rowClone, function (item, rowId) {
                obj._rows.push(rowClone);

                if(rowId)obj.setId(rowClone, rowId);

                rowContainer.appendChild(rowClone);
                addDeleteControl(rowClone, function (rowElm) {
                    obj._rows.splice(obj._rows.indexOf(rowElm), 1);
                    if (param.remove(rowElm, true) !== false)
                        rowElm.remove();
                });
            }, datum);
        }

        /**
         * Add array item
         */
        obj.addArray = function (data) {
            var result = [];
            for (var i = 0; i < data.length; i++) {
                result.push(obj.add(data[i]));
            }
        }

        /**
         * Set rowid
         */
        obj.setId = function (rowElm, rowId) {
            app.attr(rowElm, 'lcid', obj.id + '_' + rowId);
        };

        obj._enable = true;
        obj.enable = function (isEnable) {
            if (isEnable !== undefined) {
                if (obj.btnAdd) app.show(obj.btnAdd, isEnable);
                app.show(app.sa(elm, BTN_REMOVE), isEnable);
                obj._enable = isEnable;
            }
            return obj._enable;
        };

        /**
         * Bersihkan semua baris
         */
        obj.clear = function (withRecord) {
            app.empty(rowContainer, function (rowElm) {
                return app.hasClass(rowElm, 'persist');
            });

            if (withRecord) {
                obj._rows = [];
            }
        };

        /**
         * Check if row exist
         */
        obj.has = function (rowId, withRemoved) {
            return !!obj.find(rowId, withRemoved);
        };

        /**
         * Find row by rowId
         */
        obj.find = function (rowId, withRemoved) {
            var searchID = obj.id + '_' + rowId;
            var result = app.s(rowContainer, '[lcid="' + searchID + '"]');
            if (!result && (withRemoved === true)) {
                var children = rowContainer.children;
                for (var i = 0; i < children.length; i++) {
                    var child = children[i];
                    if (!app.attr(child, 'lcid') == searchID) {
                        return child;
                    }
                }
            }

            return result;
        };

        /**
         * Get all rows, including removed (updated)
         */
        obj.allRows = function () {
            return obj._rows;
        };

        /**
         * Unremoved rows
         */
        obj.rows = function () {
            var rows = [];
            for (var i = 0; i < obj._rows.length; i++) {
                var rowElm = obj._rows[i];
                if (!app.hasClass(rowElm, 'hidden')) {
                    rows.push(rowElm);
                }
            }
            return rows;
        };

        /**
         * Has 1 or more rows alive
         */
        obj.hasRow = function () {
            for (var i = 0; i < obj._rows.length; i++) {
                if (!app.hasClass(obj._rows[i], 'hidden')) return true;
            }
            return false;
        };

        function addDeleteControl(rowElm, f) {
            //on delete
            var btnDelete = app.s(rowElm, BTN_REMOVE);
            if (btnDelete) {
                btnDelete.prowElm = rowElm;
                app.click(btnDelete, function (e) {
                    f(e.prowElm);
                }, true);
            }
        }

        //-- add control
        obj.btnAdd = app.s(elm, '[btn=list-add]') || param.btnAdd;
        app.click(obj.btnAdd, obj.add, true, true);

        //read enable param
        if (param.enable !== undefined) obj.enable(param.enable);

        return obj;
    }
})(app);