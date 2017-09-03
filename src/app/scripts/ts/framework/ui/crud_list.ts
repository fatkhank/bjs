//---- CRUD list
namespace app.ui {
    var LIST_ROW = '.list-row'
        , LIST_ROW_CONTAINER = '.list-rows'
        , BTN_REMOVE = '[btn=list-remove]'
        , counter = 0
        ;

    function addDeleteControl(rowElm: HTMLElement, f, btnSelector: string) {
        //on delete
        var btnDelete: any = app.s(rowElm, btnSelector);
        if (btnDelete) {
            btnDelete.prowElm = rowElm;
            app.click(btnDelete, function (e) {
                f(e.prowElm);
            }, true);
        }
    }

    type TCrudListOption = TInputOpt & {
        btnAdd?: HTMLButtonElement;
        nocard?: boolean;
        /**
         * On add row
         */
        add?: (rowElm: HTMLElement, insert: (datum?: any, rowid?: string) => void, datum?: any) => HTMLElement | void;

        /**
         * remove row
         */
        remove?: boolean | ((rowElm: HTMLElement, isNewEntry: boolean) => (void | boolean));
        softRemove?: boolean;

        /**
         * Render row
         */
        setRow?: ((rowElm: HTMLElement, item: any, index?: number) => void | boolean) | {
            before: ((rowElm: HTMLElement, item: any, index?: number) => void | boolean)
            after: ((rowElm: HTMLElement, item: any, index?: number) => void | boolean)
        };

        /**
         * Filter row item on get val()
         */
        getRow?: (rowElm: HTMLElement, option?: any) => any;

        /**
         * btn remove selector
         */
        btnRemove?: string;

        rowSample?: HTMLElement;

        /**
         * 
         */
        emptyVal?: any
    };

    export class CrudList<T> extends Input {
        id: number;
        /**
         * Row elements
         */
        private _rows = <Array<HTMLElement>>[];
        private _enable = true;
        private rowCont: HTMLElement;
        private rowSample: HTMLElement;
        btnAdd: HTMLButtonElement;
        private btnRemove: HTMLButtonElement;
        private card: any;//todo type card

        _opt: TCrudListOption;

        constructor(elm) {
            super(elm);
            var _ = this;
            _.id = ++counter;
        }

        opt(option: TCrudListOption) {
            var _ = this;
            _._opt = option;

            if (!option) {
                option = {};
            }

            if (option.btnAdd) _.btnAdd = option.btnAdd;
            if (!option.nocard) _.card = app.ui.card(this.elm);
            if (!option.btnRemove) option.btnRemove = BTN_REMOVE;

            if (option.rowSample) _.rowSample = option.rowSample;

            if (option.emptyVal === undefined) {
                option.emptyVal = [];
            }

            if (!_.btnAdd) {
                let btnAdds = app.sa(_.elm, '[btn=list-add]');
                if (btnAdds.length) {
                    //jika lebih dar 1, pakai yang terakhir (biasaya tombolya d bawah)
                    _.btnAdd = <HTMLButtonElement>btnAdds[btnAdds.length - 1];
                }
            }

            //-- add control
            app.click(_.btnAdd, function () {
                _.add();
            }, true, true);

            _.rowCont = app.s(_.elm, LIST_ROW_CONTAINER) || _.elm;
            if (!_.rowSample) _.rowSample = app.grabSample(_.rowCont, LIST_ROW);

            return super.opt(option);
        }

        val(value?) {
            var _ = this;
            if (value instanceof Array) {
                _.clear();

                _._rows = [];
                var items = value;
                var beforeSetRow = <((rowElm: HTMLElement, item: any, index: number) => void | boolean)>_._opt.setRow,
                    afterSetRow = null;
                if (typeof _._opt.setRow != 'function') {
                    //todo remove hack
                    afterSetRow = _._opt.setRow.after;
                    beforeSetRow = _._opt.setRow.before;
                }


                //untuk tiap item
                for (var d = 0; d < items.length; d++) {
                    var item = items[d];
                    var rowClone = app.clone(_.rowSample);

                    if (_._opt.setRow && (!beforeSetRow || beforeSetRow(rowClone, item, d) !== false)) {
                        _._rows.push(rowClone);
                        _.rowCont.appendChild(rowClone);
                        addDeleteControl(rowClone, function (rowElm) {
                            if (!_._opt.softRemove) {
                                _._rows.splice(_._rows.indexOf(rowElm));
                            }
                            app.hide(rowElm);
                            if (typeof _._opt.remove == 'function') {
                                _._opt.remove(rowElm, false);
                            }
                        }, _._opt.btnRemove);
                        if (afterSetRow) afterSetRow(rowClone, item, d);
                    }
                }

                //cek mode editable atau tidak
                app.show(app.sa(_.rowCont, _._opt.btnRemove), _._enable);
            }
            else return _.getVal();
        }

        getVal(option?): any[] {
            var _ = this;
            var filtered = [];
            if (_._opt.getRow) {
                for (var i = 0; i < _._rows.length; i++) {
                    var item = _._opt.getRow(_._rows[i], option);
                    if (item) filtered.push(item);
                }
            }
            return filtered.length ? filtered : _._opt.emptyVal;
        }

        /**
         * Add new item
         */
        add(datum?) {
            var _ = this;
            var rowClone = app.clone(_.rowSample);

            //tampilkan btn remove jika sedang edit
            var btnRemove = app.s(rowClone, _._opt.btnRemove);
            if (btnRemove) app.show(btnRemove, _._enable);

            return _._opt.add(rowClone, function (item, rowId) {
                _._rows.push(rowClone);
                if (rowId) _.setId(rowClone, rowId);
                _.rowCont.appendChild(rowClone);
                addDeleteControl(rowClone, function (rowElm) {
                    _._rows.splice(_._rows.indexOf(rowElm), 1);
                    //check if has remove parametern
                    if (_._opt.remove === true) {
                        rowElm.remove();
                    } else if ((typeof _._opt.remove == 'function') && (_._opt.remove(rowElm, true) !== false)) {
                        rowElm.remove();
                    }
                }, _._opt.btnRemove);
            }, datum);
        }

        /**
         * Add array item
         */
        addArray(data) {
            var result = [];
            for (var i = 0; i < data.length; i++) {
                result.push(this.add(data[i]));
            }
        }


        /**
         * Get rowid
         */
        getId(rowElm) {
            var fullid = app.attr(rowElm, 'lcid');
            return (fullid && fullid.length) ? fullid.substr((this.id + '_').length) : null;
        }

        /**
         * Set rowid
         */
        setId(rowElm, rowId) {
            app.attr(rowElm, 'lcid', this.id + '_' + rowId);
        }
        enable(isEnable, action?: 'add' | 'remove') {
            var _ = this;
            if (isEnable !== undefined) {
                if ((!action || (action == 'add')) && _.btnAdd) app.show(_.btnAdd, isEnable);
                if (!action || (action == 'remove')) {
                    app.show(app.sa(_.elm, _._opt.btnRemove), isEnable);
                }

                _._enable = isEnable;
            }
            return _._enable;
        }

        /**
         * Bersihkan semua baris
         */
        clear(withRecord = false) {
            var _ = this;
            app.empty(_.rowCont, function (rowElm) {
                return app.hasClass(rowElm, 'persist');
            });

            if (withRecord) {
                this._rows = [];
            }
        }

        /**
         * Check if row exist
         */
        has(rowId, withRemoved = false) {
            return !!this.find(rowId, withRemoved);
        }

        /**
         * Find row by rowId
         */
        find(rowId, withRemoved = false) {
            var _ = this;
            var searchID = _.id + '_' + rowId;
            var result = app.s(_.rowCont, '[lcid="' + searchID + '"]');
            if (!result && (withRemoved === true)) {
                var children = _.rowCont.children;
                for (var i = 0; i < children.length; i++) {
                    var child = <HTMLElement>children[i];
                    if (app.attr(child, 'lcid') == searchID) {
                        return child;
                    }
                }
            }

            return result;
        }

        /**
         * Get all rows, including removed (updated)
         */
        allRows() {
            return this._rows;
        }

        /**
         * Unremoved rows
         */
        rows() {
            var _ = this;
            var rows = [];
            for (var i = 0; i < _._rows.length; i++) {
                var rowElm = _._rows[i];
                if (!app.hasClass(rowElm, 'hidden')) {
                    rows.push(rowElm);
                }
            }
            return rows;
        }

        /**
         * Has 1 or more rows alive
         */
        hasRow() {
            var _ = this;
            for (var i = 0; i < _._rows.length; i++) {
                if (!app.hasClass(_._rows[i], 'hidden')) return true;
            }
            return false;
        }
    }

    /**
     * Create crud list
     * @param elm
     * @param param
     */
    export function crudList(elm, option?: TCrudListOption) {
        return new CrudList(elm).opt(option);
    }
}