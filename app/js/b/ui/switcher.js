//------ content switcher
(function () {
    var ATTR_SHOW = 'sw-show'
        , ATTR_VIEW = 'sw-view'
        , ACTIVE_ATTR = 'is-active'
    ;

    var component = {
        ATTR_SHOW: ATTR_SHOW,
        ATTR_VIEW: ATTR_VIEW,
        CONTENT_REF_ATTR: 'href',
        EVENT_SWITCHING_TO: 'switching.to',
        EVENT_SWITCH_TO: 'switch.to',
        EVENT_SWITCHING_FROM: 'switching.from',
        EVENT_SWITCH_FROM: 'switch.from',
        _counter: 0
    };

    var contexts = {};
    component.list = contexts;

    function SwContext(name) {
        var _ = this;
        _.name = name;

        /**
         * Current content
         */
        _.bodyElm = null;

        /**
         * Current head
         */
        _.headElm = null;

        /**
         * Add head and content pair. Return null if fail
         */
        _.add = function (bodyElm, headElm) {
            return registerPair(headElm, bodyElm, _);
        };

        _.onchange = function (fromHead, toHead) {
            return true;
        };
    }

    /**
     * Get or set head
     */
    SwContext.prototype.headOn = function (headElm, withContent) {
        var _ = this;
        if (!_.onchange || !(_.onchange(_.headElm, headElm) === false))
            showHead(headElm, withContent);
    };

    app.ui.switcher = function (name) {
        if (name === undefined) return component;
        return component.get(name);
    };

    /**
     * Create new context
     */
    component.create = function () {
        var name = 'switcher' + component._counter++;
        return component.get(name);
    };

    /**
     * Get switcher
     */
    component.get = function (name) {
        return contexts[name] || (contexts[name] = new SwContext(name));
    };

    component.scan = function (elm) {
        //cari normal show attr
        app.each(app.sa(elm, '[' + ATTR_SHOW + ']'), function (head) {
            var name = app.attr(head, ATTR_SHOW);
            var context = component.get(name);
            var pair = registerPair(head, null, context);

            if (!pair) return;//failed to register
            var bodyElm = pair.bodyElm;

            //set as default head
            if (app.hasAttr(head, ACTIVE_ATTR)) {
                context.headElm = head;

                //tandai content yg ditunjuk jika ditemukan
                if (bodyElm) {
                    context.bodyElm = bodyElm;
                    showContent(bodyElm);
                }
            }
        });
    };
    app.addScanner(component.scan);

    function showHead(headElm, withContent) {
        var pair = headElm.switcher;
        var context = pair.context;

        //ganti head
        if (context.headElm) app.remAttr(context.headElm, ACTIVE_ATTR);
        app.attr((context.headElm = headElm), ACTIVE_ATTR, 'true');

        if (withContent) {
            //ganti content
            if (context.bodyElm) hideContent(context.bodyElm);
            showContent(pair.bodyElm);
            context.bodyElm = pair.bodyElm;
        }
    }

    function getHeadContent(head) {
        return head.switcher.bodyElm;
    }

    function registerPair(headElm, bodyElm, context) {
        //add ref to content
        if (!bodyElm) {
            var contentRef = app.attr(headElm, 'href');

            if (!contentRef) return null;
            bodyElm = app.s(contentRef);
        }

        var pairObj = headElm.switcher = { bodyElm: bodyElm, context: context };
        //            if (!app.hasAttr(head, ATTR_SHOW)) app.attr(head, ATTR_SHOW, context.name);

        //----- switch sub content
        app.click(headElm, function (btn) {
            showHead(btn, true);
            return false;
        });

        return pairObj;
    }

    function hideContent(elm) {
        elm.dispatchEvent(new Event(component.EVENT_SWITCHING_FROM));

        app.remAttr(elm, ACTIVE_ATTR);

        elm.dispatchEvent(new Event(component.EVENT_SWITCH_FROM));
    }
    function showContent(elm) {
        elm.dispatchEvent(new Event(component.EVENT_SWITCHING_TO));

        app.attr(elm, ACTIVE_ATTR, true);

        elm.dispatchEvent(new Event(component.EVENT_SWITCH_TO));
    }
})(app);