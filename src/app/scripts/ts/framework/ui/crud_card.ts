//---- CRUD card
namespace app.ui {
    var dialogElmSample = app.grabSample(document.getElementById('appDialogs'), '.crudc-dialog')
        , CRUD_ROW = '.crud-row'
        , EDIT_MODE_CLASS = 'editMode'
        ;

    app.onStarting(function () {
        app.lang.scan(dialogElmSample);
    });

    function createDialog(formElm) {
        var dialogElm = app.clone(dialogElmSample);
        var formDialog = app.s(dialogElm, '.md-form');

        formDialog.appendChild(formElm);

        var dialog = app.ui.dialog(dialogElm, 'md_' + formElm.id);

        dialog.oncreate = function (instance) {
            app.click(app.s(instance.contentElm, '[btn=cancel]'), function () {
                instance.close(false);
            }, true);
        };

        return dialog;
    }

    /**
     * Create crud card
     * @param elm
     * @param param
     */
    export function crudCard(elm, param) {
        var obj: any = {
            loading: false,
            _skip: 0,
            filter: {}
        };

        var defaultParam = {
            /**
             * Fetch data
             */
            fetchAll: null,

            /**
             * Add/edit form, (if use form dialog)
             */
            form: null,

            /**
             * Save new
             */
            add: null,

            /**
             * Save edit
             */
            edit: null,

            /**
             * Render row
             */
            fillRow: function (rowElm, item) { },

            paging: 10,

            rowSample: null,
        };
        for (var i in param) defaultParam[i] = param[i];
        param = defaultParam;
        obj.opt = param;

        obj.card = app.ui.card(elm);

        var rowContainer = app.s(elm, '[crud-role=rows]');
        var rowSample = param.rowSample || app.s(rowContainer, CRUD_ROW);
        if (app.hasClass(rowSample, 'sample')) app.remClass(rowSample, 'sample');

        //buat dialog jika ada form isian
        if (param.form) {
            //scan form first
            app.scan(param.form);
            obj.dialog = createDialog(param.form);
        }

        function showDetail(rowElm) {
            var dialog = obj.dialog.open(param.edit || {});
            var title = obj.card.title();
            dialog.title(app.getText('edit_x', 'edit', title));

            var rowId = app.attr(rowElm, 'crud-id');

            var contentElm = dialog.contentElm;
            app.addClass(contentElm, EDIT_MODE_CLASS);

            if (param.edit.init) {
                function setupEdit() {
                    onSave(dialog, param.edit.save, rowId);
                }
                if (param.edit.init) app.ui.loading(contentElm, param.edit.init(rowId, app.s(contentElm, 'form'), rowElm, contentElm).then(setupEdit), null);
                else setupEdit();
            }

            //show or hide remove
            //on delete
            var btnDelete = app.s(contentElm, '[btn=delete]');
            if (btnDelete) {
                if (param.remove) {
                    app.show(btnDelete);
                    app.click(btnDelete, function () {
                        app.ui.confirm(app.getText('delete_item_q'), function () {
                            app.ui.loading(contentElm, param.remove(rowId).then(function () {
                                obj.reload();
                                dialog.close();
                            }));
                        });
                    }, true);
                } else app.hide(btnDelete);
            }
        }

        obj.table = app.ui.table(param.tableElm || app.s(elm, 'p-table'), {
            setRow: function (rowElm, rowData, index) {
                app.attr(rowElm, 'crud-id', rowData.id || null);
                for (var p in rowData) {
                    var prop = rowData[p];

                    var cell = app.s(rowElm, '.v-' + p);
                    if (cell) cell.innerHTML = prop;
                }

                //additional fill
                if (param.fillRow) param.fillRow(rowElm, rowData);
            }
        });

        obj.reload = function () {
            if (obj.loading) return;

            var paging = param.paging ? { skip: obj._skip, count: param.paging } : {};
            if (obj.filter) for (var i in obj.filter) paging[i] = obj.filter[i];//add param

            obj.loading = true;
            app.ui.loading(elm, param.fetchAll(paging).then(function (response) {
                rowContainer.innerHTML = '';
                obj._skip = response.skip;

                var data = response.data ? response.data : response;

                obj.table.empty();
                for (var d = 0; d < data.length; d++) {
                    var item = data[d];
                    obj.table.addRow(item, showDetail);
                }

                if (obj._btnNext) {
                    obj._btnNext.enable(response.total > response.skip + data.length);
                }

                if (obj._btnPrev) {
                    obj._btnPrev.enable(response.skip > 0);
                }

                //display paging
                app.s(elm, '.v-paging').innerHTML = (response.data.length ? (response.skip + 1) : 0) + ' - ' + (response.skip + response.data.length) + ' ' + app.getText('from').toLowerCase() + ' ' + response.total;

                obj.loading = false;
            }, function (e) {
                obj.loading = false;
                return e;
            }), null);
        };

        obj.add = function () {
            if (param.form) {
                //use form dialog
                var createDialog = obj.dialog.open();
                var formElm = <HTMLFormElement>app.s(createDialog.contentElm, 'form');

                var title = obj.card.title();
                createDialog.title(app.getText('add_x', 'add', title));

                //clear all input
                var elms = formElm.elements;
                for (var e = 0; e < elms.length; e++) {
                    let elm: any = elms[e];
                    if (elm.val) elm.val('');
                }

                app.remClass(createDialog.contentElm, EDIT_MODE_CLASS);

                var saveFunc = param.add;
                if (typeof param.add == 'object') {
                    saveFunc = param.add.save;
                    if (param.add.init) param.add.init(formElm);
                }
                onSave(createDialog, saveFunc);
            } else {
                //add simple row

            }
        }

        function onSave(dialog, saveFunc, id?) {
            var contentElm = dialog.contentElm;
            var formElm = app.s(contentElm, 'form');

            app.click(app.s(contentElm, '[btn=save]'), function () {
                app.ui.loading(contentElm, saveFunc(formElm, id).then(function () {
                    dialog.close();
                    obj.reload();
                }, function (error) {
                    var msg = (error.responseJSON && error.responseJSON.error) || error.responseText || error.statusText;
                    app.ui.notifError(app.getText('save_failed') + '. ' + msg);
                }), {
                        successMsg: app.getText('data_saved'),
                        loadingText: app.getText('saving')
                    });
            }, true);
        }

        obj.next = function () {
            obj._skip += param.paging;
            obj.reload();
        };
        obj.prev = function () {
            obj._skip -= param.paging;
            if (obj._skip < 0) obj._skip = 0;
            obj.reload();
        };

        //-- add control
        var btnAdd = app.s(elm, '[btn=add]') || param.btnAdd;
        app.click(btnAdd, obj.add, true, true);

        //-- reload
        var btnReload = app.s(elm, '[btn=reload]') || param.btnReload;
        app.click(btnReload, function () {
            obj.reload(true); 
        }, true, true);

        //-- add delete
        var btnDelete = app.s(elm, '[btn=remove]') || param.btnDelete;
        app.click(btnDelete, function (btnDelete) {
            if (param.remove) {
                var selectedRows = obj.table.rows(true);
                if (!selectedRows.length) return;
                app.ui.confirm(app.getText('delete_item_q'), function () {
                    var promises = [];
                    for (var i = 0; i < selectedRows.length; i++) {
                        var rowElm = selectedRows[i];
                        promises.push(param.remove(app.attr(rowElm, 'crud-id')));
                    }
                    app.ui.loading(elm, app.promiseAll(promises).then(function () {
                        obj.reload();
                    }), null);
                });
            } else app.hide(btnDelete);
        }, true, true);

        //-- nav
        obj._btnNext = app.s(elm, '[btn=next]');
        if (obj._btnNext) app.click(obj._btnNext, obj.next, true);
        obj._btnPrev = app.s(elm, '[btn=prev]');
        if (obj._btnPrev) app.click(obj._btnPrev, obj.prev, true);

        //overidable

        return obj;
    }
}