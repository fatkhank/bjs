namespace app.ui {
    //----- dialog
    var TAG_NAME = 'p-dialog'
        , TAG_CONTENT = 'p-content'
        , TAG_HEAD = 'p-head'
        , TITLE = 'h4'
        , ATTR_ACTIVE = 'is-active'
        , FULL_WIDTH = 'full'
        , PINNED_TOP = 'top'
        ;

    var appDialogs = document.getElementById('appDialogs');

    export class Dialog {
        static stack: Array<Dialog> = [];
        constructor(definition, elm) {
            this.dialogElm = elm;
            this.contentElm = app.s(elm, TAG_CONTENT);
            var _ = this;

            //close if cover clicked
            app.click2(elm, function (targetElm, ev) {
                if (targetElm == ev.target) _.close(true);
            });

            //intercept event to body
            app.click(app.s(elm, TAG_CONTENT), function (elm, ev) {
                ev.stopPropagation();
                return false;
            });
        }

        dialogElm: HTMLElement;
        contentElm: HTMLElement;
        isVisible = false;
        isReserved = false;
        private _closable = true;

        /**
         * Recreate
         */
        isNew = true;

        /**
         * When dialog closing
         */
        onclosing(fromUser: boolean, close: () => void) {
            close();
        };

        private _titleElm: HTMLElement;
        /**
         * Get or set title
         */
        title(title) {
            var _ = this;
            if (!_._titleElm) {
                //find title elm
                if (!(_._titleElm = app.s(_.contentElm, TITLE))) return;
            }
            if (title != undefined) {
                return _._titleElm.innerHTML = title;
            }
            return _._titleElm.innerHTML;
        };

        /**
         * Tampilkan dialog
         */
        show() {
            //tampilkan this
            app.attr(this.dialogElm, ATTR_ACTIVE, 1);
            this.isVisible = true;

            //add to front
            this.dialogElm.remove();
            appDialogs.appendChild(this.dialogElm);

            Dialog.stack.push(this);
        }

        /**
         * Tutup dialog
         * @param fromUser
         */
        close(fromUser: boolean = false) {
            var _ = this;
            if (!_._closable) {
                return;
            }

            _.onclosing(fromUser, function () {
                app.remAttr(_.dialogElm, ATTR_ACTIVE);
                _.isVisible = false;
                Dialog.stack.splice(Dialog.stack.indexOf(_));
            });
        };

        /**
         * Set or get closable property
         */
        closable(isClosable?: boolean) {
            if (isClosable !== undefined) {
                this._closable = isClosable;
            } else return this._closable;
        }

        /**
         * Execute function on btn click
         * @param btnName
         * @param action 
         */
        onBtn(btn: string | HTMLButtonElement, action: (btn?: HTMLButtonElement, ev?: MouseEvent) => (void | Promise<any>)) {
            var _ = this;
            var btnElm: HTMLButtonElement;
            if (typeof btn == 'string') {
                btnElm = <HTMLButtonElement>app.s(_.contentElm, '[btn=' + btn + ']');
            } else {
                btnElm = btn;
            }
            if (btnElm) app.click(btnElm, function (btnElm, e) {
                let actionResult = action(<HTMLButtonElement>btnElm, e);
                if (actionResult && actionResult.then) {
                    _.closable(false);
                    ui.loading(_.contentElm, actionResult).then(function (d) {
                        //if success, just close dialog
                        _.closable(true);
                        _.close();
                        return d;
                    }, function (e) {
                        _.closable(true);
                        return e;
                    });
                }
            }, true);
        };

        /**
         * Set full width
         */
        full() {
            app.addClass(this.dialogElm, FULL_WIDTH);
            return this;
        };

        /**
         * Set normal dialog
         */
        normal() {
            app.remClass(this.dialogElm, FULL_WIDTH);
            return this;
        };
        /**
         * Pin to top
         */
        top() {
            app.addClass(this.dialogElm, PINNED_TOP);
            return this;
        };
    }

    export class DialogDef {
        static list = {};
        static counter = 1;
        name: string;
        sample: HTMLElement;
        created: Array<Dialog> = [];
        /**
         * Button handler
         */
        buttons = {};
        /**
         * Override me. Executed when new dialog instance created
         */
        oncreate = function (instance: Dialog, param) { };
        onopen = function (instance: Dialog, param) { };
        onclose = function (instance: Dialog) { };
        constructor(name, sampleElm) {
            var _ = this;
            _.name = name;
            _.sample = sampleElm;
        }
        /**
         * Open new dialog
         * @param param
         */
        open(param?: any): Dialog {
            let instance: Dialog, _ = this;

            //cari yang sudah dibuat
            for (var i = 0; i < _.created.length; i++) {
                var d = _.created[i];
                if (!d.isReserved && !d.isVisible) instance = d;
            }

            //jika tidak ada, buat baru
            if (!instance) {
                instance = this.create(param, false);
            } else {
                //true=created; false=reuse
                instance.isNew = false;
            }

            instance.show();

            return instance;
        }
        /**
         * Reserve dialog instance without open
         * @param param
         */
        create(param: any = null, isReserved = false): Dialog {
            var _ = this;

            var clone = app.clone(_.sample);
            var instance = new Dialog(_, clone);
            instance.isReserved = isReserved;
            instance.isNew = true;

            _.oncreate(instance, param);
            _.created.push(instance);

            //cari control tombol
            for (var btnName in _.buttons) {
                var btnElm = app.s(instance.contentElm, '[btn=' + btnName + ']');
                if (btnElm) app.click(btnElm, _.buttons[btnName], true);
            }

            appDialogs.appendChild(instance.dialogElm);

            return instance;
        }
    }

    /**
     * Create definition. Sample dialog automatically scanned!!
     * @param sampleElm
     * @param nameOrParam
     */
    export function dialog(sampleElm: HTMLElement, nameOrParam: any = {}): DialogDef {
        if(!sampleElm){
            console.error("Dialog template is not found");
            return;
        }

        var name = typeof nameOrParam == 'string' ? nameOrParam : nameOrParam.name;
        if (!name) name = 'dialog' + DialogDef.counter++;

        if (nameOrParam.noscan !== false) app.scan(sampleElm);

        var def = DialogDef.list[name];
        if (!def) {
            def = new DialogDef(name, sampleElm);
            if (nameOrParam.oncreate) def.oncreate = nameOrParam.oncreate;
        }

        return def;
    }

    //add close dialog by exc
    app.onKeyEsc(document.body, function () {
        if (Dialog.stack.length > 0) {
            //peek and close
            Dialog.stack[Dialog.stack.length - 1].close();
        }
    });
}