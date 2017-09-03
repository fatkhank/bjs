namespace app.ui {
    //----- confirm dialog
    var confirmDialogSample = app.grabSample('.confirm-dialog');
    let confirmDialog: app.ui.DialogDef;
    app.onStarting(function () {
        app.lang.scan(confirmDialogSample);
        confirmDialog = app.ui.dialog(confirmDialogSample, 'confirm_dialog');
        confirmDialog.oncreate = function (instance) {
            var btnNo = app.s(instance.contentElm, '[btn=no]');
            var btnYes = app.s(instance.contentElm, '[btn=yes]');

            instance.contentElm.onkeydown = function (e) {
                switch (e.which) {
                    case app.KEYS.LEFT.which:
                    case app.KEYS.UP.which:
                    case 89://y
                        btnYes.focus();
                        return false;

                    case app.KEYS.RIGHT.which:
                    case app.KEYS.DOWN.which:
                    case 78://n
                        btnNo.focus();
                        return false;
                }
            };
        };
    });

    type TConfirmOpt = {
        /**
         * Judul dialog
         */
        title?: string,
        /**
         * Pesan sebelum input text
         * 
         * @type {string}
         */
        msg?: string,
        /**
         * Isi default catatan
         * 
         * @type {string}
         */
        value?: string,
        /**
         * Jika false==tombol no tidak tampil, jika string maka akan digunakan sebagai text tombol no
         * 
         * @type {(boolean|string)}
         */
        no?: boolean | string,
        /**
         * Jika false==tombol ok tidak tampil, jika string maka akan digunakan sebagai text tombol ok
         * 
         * @type {(boolean|string)}
         */
        ok?: boolean | string,
        /**
         * Jika true, input text wajib diisi. Default false
         * 
         * @type {boolean}
         */
        required?: boolean,
        /**
         * Jika true, setelah ok atau no akan otomatis ditutup. Default true.
         * 
         * @type {boolean}
         */
        autoclose?: boolean
    };

    export function confirm(msgOrOption: TConfirmOpt | string): Promise<any>;
    export function confirm(msgOrOption: TConfirmOpt | string, ok?: () => void, no?: () => void): void;

    /**
     * Show confirmation dialog
     * @param msgOrOption
     * @param ok
     * @param no    
     */
    export function confirm(msgOrOption: TConfirmOpt | string, ok?: () => void, no?: () => void): (void | Promise<any>) {
        var dialog = confirmDialog.open();

        var btnNo = app.s(dialog.contentElm, '[btn=no]');
        var btnYes = app.s(dialog.contentElm, '[btn=yes]');

        var showNo = true, showYes = true;

        var msg = msgOrOption;
        if (typeof msgOrOption == 'object') {
            msg = msgOrOption.msg;
            if (msgOrOption.no === false) {
                showNo = false;
            } else if (typeof msgOrOption.no == 'string') {
                btnNo.innerHTML = msgOrOption.no;
            }

            if (msgOrOption.ok == false) showYes = false;
            else if (typeof msgOrOption.ok == 'string') {
                btnYes.innerHTML = msgOrOption.ok;
            }
        }

        app.show(btnNo, showNo);
        app.show(btnYes, showYes);

        app.s(dialog.contentElm, '.confirm-msg').innerHTML = <string>msg;

        function execute(onYes, onNo) {
            app.click(app.s(dialog.contentElm, '[btn=yes]'), function (e) {
                dialog.close();
                if (onYes) onYes();
            }, true);
            app.click(btnNo, function (e) {
                dialog.close(true);
            }, true);
            dialog.onclosing = function (fromUser, close) {
                if (fromUser && onNo) onNo();
                close();
            };
        }

        btnNo.focus();
        if (ok) {//if function style
            execute(ok, no);
        } else {//promise style
            return app.promise(function (done, not) {
                execute(done, not);
            });
        }
    };

    //---- PROMPT dialog
    var promptDialogSample = app.grabSample('.prompt-dialog');
    let promptDialog: app.ui.DialogDef;
    app.onStarting(function () {
        app.lang.scan(promptDialogSample);
        promptDialog = app.ui.dialog(promptDialogSample, 'prompt_dialog');
        promptDialog.oncreate = function (instance: TPromptDialog) {
            var btnNo = app.s(instance.contentElm, '[btn=no]');
            var btnYes = app.s(instance.contentElm, '[btn=yes]');

            instance.promptInput = app.ui.inputText(app.s(instance.contentElm, '.v-val'));
            instance.msgElm = app.s(instance.contentElm, '.v-msg');

            instance.contentElm.onkeydown = function (e) {
                switch (e.which) {
                    case app.KEYS.LEFT.which:
                    case app.KEYS.UP.which:
                    case 89://y
                        btnYes.focus();
                        return false;

                    case app.KEYS.RIGHT.which:
                    case app.KEYS.DOWN.which:
                    case 78://n
                        btnNo.focus();
                        return false;
                }
            };
        };
    });

    type TPromptDialog = Dialog & {
        promptInput: Input;
        msgElm: HTMLElement;
    };

    type TPromptOpt = {
        /**
         * Judul dialog
         */
        title?: string,
        /**
         * Pesan sebelum input text
         * 
         * @type {string}
         */
        msg?: string,
        /**
         * Isi default catatan
         * 
         * @type {string}
         */
        value?: string,
        /**
         * Jika false==tombol no tidak tampil, jika string maka akan digunakan sebagai text tombol no
         * 
         * @type {(boolean|string)}
         */
        no?: boolean | string,
        /**
         * Jika false==tombol ok tidak tampil, jika string maka akan digunakan sebagai text tombol ok
         * 
         * @type {(boolean|string)}
         */
        ok?: boolean | string,
        /**
         * Jika true, input text wajib diisi. Default false
         * 
         * @type {boolean}
         */
        required?: boolean,
        /**
         * Jika true, setelah ok atau no akan otomatis ditutup. Default true.
         * 
         * @type {boolean}
         */
        autoclose?: boolean
    };

    /**
     * Prompt for input
     * @param msgOrOption
     * @param ok
     * @param no
     */
    export function prompt(titleOrOption: TPromptOpt | string, ok?: (msg?: string, dialog?: Dialog) => void, no?: (msg?: string, dialog?: Dialog) => void): (void | Promise<any>) {
        var dialog = <TPromptDialog>promptDialog.open();

        var btnNo = app.s(dialog.contentElm, '[btn=cancel]');
        var btnYes = app.s(dialog.contentElm, '[btn=save]');

        var showNo = true,
            showYes = true,
            showMsg = false,
            required = false,
            autoclose = true;

        var title = titleOrOption;
        if (typeof titleOrOption == 'object') {
            title = titleOrOption.title;
            if (titleOrOption.msg) {
                dialog.msgElm.innerHTML = titleOrOption.msg;
                showMsg = true;
            }

            if (titleOrOption.value !== undefined) {
                dialog.promptInput.val(titleOrOption.value);
            }

            if (titleOrOption.no === false) {
                showNo = false;
            } else if (typeof titleOrOption.no == 'string') {
                btnNo.innerHTML = titleOrOption.no;
            }

            if (titleOrOption.ok == false) showYes = false;
            else if (typeof titleOrOption.ok == 'string') {
                btnYes.innerHTML = titleOrOption.ok;
            }

            required = !!titleOrOption.required;
            if (titleOrOption.autoclose !== undefined) {
                autoclose = titleOrOption.autoclose;
            }

        }

        app.show(btnNo, showNo);
        app.show(btnYes, showYes);
        app.show(dialog.msgElm, showMsg);
        dialog.title(title);
        dialog.promptInput.required(required);
        dialog.promptInput.focus();

        function execute(onYes, onNo) {
            app.click(btnYes, function (e) {
                var val = dialog.promptInput.val();
                if (required && !val) {
                    app.ui.notif('Catatan wajib diisi');
                    dialog.promptInput.focus();
                } else {
                    if (autoclose) dialog.close();
                    onYes(val, dialog);
                }
            }, true);
            app.click(btnNo, function (e) {
                dialog.close(true);
            }, true);
            dialog.onclosing = function (fromUser, close) {
                if (fromUser && onNo) onNo(dialog.promptInput.val(), dialog);
                close();
            };
        }

        if (ok) {//if function style
            execute(ok, no);
        } else {//promise style
            return app.promise(function (done, not) {
                execute(done, not);
            });
        }
    };
}