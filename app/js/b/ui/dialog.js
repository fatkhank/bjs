/// <reference path="../app/_base.js" />

(function (app) {
    //----- dialog

    var TAG_NAME = 'p-dialog'
        , TAG_CONTENT = 'p-content'
        , TAG_HEAD = 'p-head'
        , TITLE = 'h4'
        , ATTR_ACTIVE = 'is-active'
        , FULL_WIDTH = 'full'
        , PINNED_TOP = 'top'
    ;

    var component = {
        list: {},
        /// <field type="Array" elementType="DialogInstance"></field>
        stack: [],

        _counter: 1
    };

    function DialogInstance(definition, elm) {
        var _ = this;

        _.dialogElm = elm;
        _.contentElm = app.s(elm, TAG_CONTENT);
        _.isVisible = false;

        /**
         * Not recreate
         */
        _.reuse = false;

        /**
         * When dialog closes
         */
        _.onclose = function (fromUser) { };

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

    (function (InstanceProto) {
        /**
         * Get or set title
         */
        InstanceProto.title = function (title) {
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

        InstanceProto.close = function (fromUser) {
            var _ = this;
            app.remAttr(_.dialogElm, ATTR_ACTIVE);
            _.isVisible = false;

            component.stack.splice(component.stack.indexOf(_));

            _.onclose(fromUser);
        };

        InstanceProto.onBtn = function (btnName, action) {
            var _ = this;
            var btnElm = app.s(_.contentElm, '[btn=' + btnName + ']');
            if (btnElm) app.click(btnElm, action, true);
        };

        /**
         * Set full width
         */
        InstanceProto.full = function (btnName, action) {
            app.addClass(this.dialogElm, FULL_WIDTH);
            return this;
        };
        /**
         * Set normal dialog
         */
        InstanceProto.normal = function (btnName, action) {
            app.remClass(this.dialogElm, FULL_WIDTH);
            return this;
        };

        /**
         * Pin to top
         */
        InstanceProto.top = function (btnName, action) {
            app.addClass(this.dialogElm, PINNED_TOP);
            return this;
        };

    })(DialogInstance.prototype);

    function DialogDefinition(name, sampleElm) {
        var _ = this;
        _.name = name;
        _.sample = sampleElm;
        _.created = [];
        /**
         * Override me. Executed when new dialog instance created
         */
        _.oncreate = function (instance, param) { };
        _.onopen = app.noop;
        _.onclose = app.noop;

        /**
         * Button handler
         */
        _.buttons = {};
    }

    /**
     * Intellisense for instance
     */
    DialogDefinition.prototype.ins = function (instance) {
        /// <returns type="DialogInstance">For intellisense only</returns>
        return instance;
    }

    /**
     * Open new document
     */
    DialogDefinition.prototype.open = function (param) {
        var instance, definition = this;

        //cari yang sudah dibuat
        for (var i = 0; i < definition.created.length; i++) {
            var d = definition.created[i];
            if (!d.isVisible) instance = d;
        }

        //jika tidak ada, buat baru
        if (!instance) {
            var clone = app.clone(definition.sample);
            instance = new DialogInstance(definition, clone);

            definition.oncreate(instance, param);
            definition.created.push(instance);

            //cari control tombol
            for (var btnName in definition.buttons) {
                var btnElm = app.s(instance.contentElm, '[btn=' + btnName + ']');
                if (btnElm) app.click(btnElm, definition.buttons[btnName], true);
            }

            appDialogs.appendChild(instance.dialogElm);
            instance.reuse = false;
        }

        //tampilkan instance
        app.attr(instance.dialogElm, ATTR_ACTIVE, 1);
        instance.isVisible = true;
        instance.reuse = true;

        //add to front
        instance.dialogElm.remove();
        appDialogs.appendChild(instance.dialogElm);

        component.stack.push(instance);

        return instance;
    };

    /**
     * Create definition. Sample dialog automatically scanned!!
     */
    component.define = function (sampleElm, nameOrParam) {
        if (!nameOrParam) nameOrParam = {};
        var name = typeof nameOrParam == 'string' ? nameOrParam : nameOrParam.name;
        if (!name) name = 'dialog' + component._counter++;

        if (nameOrParam.noscan !== false) app.scan(sampleElm);

        var def = component.list[name];
        if (!def) {
            def = new DialogDefinition(name, sampleElm);
            if (nameOrParam.oncreate) def.oncreate = nameOrParam.oncreate;
        }

        return def;
    }

    app.ui.dialog = function (name) {
        if (name === undefined) return component;
        return component.list[name] || component.define(name);
    };

    //add close dialog by exc
    app.onKeyEsc(document.body, function () {
        if (component.stack.length > 0) {
            //peek and close
            component.stack[component.stack.length - 1].close();
        }
    });
})(app);