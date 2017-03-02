/// <reference path="../app/_base.js" />
/// <reference path="../app/_components.js" />

//----- content tab
(function () {
    var TAG_NAME = "crud-tab"
        , TAB_CLOSE_BTN = '.btn-close-tab'
        , ATTR_BODIES = '[tab=contents]'
        , ATTR_BODY = '[tab=content]'
        , ATTR_HEADS = '[tab=heads]'
        , ATTR_HEAD = '[tab=head]'
        , HEAD_APPROX_WIDTH = 120//untuk menghitung max tab
    ;

    var component = {};

    function TabObj(obj, headClone, contentClone, tabId, sample) {
        var _ = this;

        /**
         * The head
         */
        _.headElm = headClone;
        /**
         * The content elm
         */
        _.bodyElm = contentClone;
        /**
         * The obj
         */
        _.obj = obj;

        /**
         * tampilkan tab
         */
        _.show = function () {
            _.headElm.click();

            return _;
        };

        /**
         * Sembunyikan tab (dan remove)
         */
        _.close = function (fallbackHead) {
            var prev = ((fallbackHead !== false) && (_.headElm.nextElementSibling || _.headElm.previousElementSibling || fallbackHead));

            _.headElm.remove();
            _.bodyElm.remove();

            if (prev) prev.click();

            delete obj.opened[tabId];
            sample.count--;

            return prev;
        };

        _.title = function (title) {
            return _.obj.title(_.headElm, title);
        };

        /**
         * 
         */
        _.persist = function (isPersist) {
            if (isPersist !== undefined) {
                app.class(_.headElm, 'persist', isPersist);
            } else return app.hasClass(_.headElm, 'persist');
        };

        _.onset = null;
        _.onunset = null;
    }

    function ContentTab(elm, param) {
        var _ = this;
        _.elm = elm;
        _.switcher = app.ui.switcher().create();
        _.samples = {};
        _.tabCounter = 0;

        /*
         * Opened tabs
         */
        _.opened = {};

        _.onset = null;
        _.onunset = null;
    }


    (function (CTPrototype) {
        /**
         * Menambahkan sample tab baru
         */
        CTPrototype.addSample = function (name, head, content, heads, contents, maxCount) {
            this.samples[name] = {
                head: head,
                content: content,
                heads: heads,
                contents: contents,
                max: (maxCount || 30),
                count: 0
            };
        };

        /**
         * Close all tab
         */
        CTPrototype.closeAll = function (withPersist) {
            for (var i in this.opened) {
                var tab = this.opened[i];
                if (withPersist || !app.hasClass(tab.headElm, 'persist'))
                    tab.close(false);
            }
        };

        /**
         * Get nth tab
         */
        CTPrototype.get = function (indexOrElm) {
            /// <returns type="TabObj" mayBeNull="true"></returns>
            var target = indexOrElm;
            if (typeof indexOrElm == 'number') target = app.s(this.elm, ATTR_HEADS + '>:nth-child(' + (index + 1) + ')');
            if (!target) return null;
            return target.ptab;
        };

        /**
         * Get tab count
         */
        CTPrototype.count = function () {
            return app.sa(this.elm, ATTR_HEADS + '>' + ATTR_HEAD + ':not(.hidden)').length;
        };

        /**
         * Get last tab
         */
        CTPrototype.lastTab = function () {
            /// <returns type="TabObj" mayBeNull="true"></returns>
            var target = app.s(this.elm, ATTR_HEADS + '>:last-child');
            if (!target) return null;
            return target.ptab;
        };

        /**
         * Get or set head title
         */
        CTPrototype.title = function (headElm, title) {
            //find label or use the head
            var titleLabel = app.s(headElm, 'b');
            if (!titleLabel) titleLabel = headElm;

            if (title != undefined) {
                titleLabel.innerHTML = title;
                app.ui.tooltip(headElm, title);
            }
            return titleLabel.innerHTML;
        };

        /**
         * Try open existing tab
         */
        CTPrototype.openTab = function (tabId) {
            /// <returns type="TabObj" mayBeNull="true"></returns>
            var tab = this.opened[tabId];
            if (tab) tab.show();
            return tab;
        };

        /**
         * Buka tab baru
         */
        CTPrototype.newTab = function (name, title, tabId) {
            ///<returns type="TabObj"></returns>
            var _ = this;

            if (!name) name = 'default';
            if (!tabId) tabId = _.switcher.name + '_' + name + (++_.tabCounter);

            var sample = _.samples[name];

            //batasi jumlah tab
            if ((typeof sample.max == 'function' && sample.max(sample, sample.count)) ||
                ((sample.max == 'auto') &&
                (sample.count >= 3) && // minimal harus 3
                ((sample.heads.children.length + 1) * (sample.head.offsetWidth || HEAD_APPROX_WIDTH) > sample.heads.offsetWidth)
                )
                || (sample.count > sample.max))
                return null;
            sample.count++;

            //atur head
            var headClone = app.clone(sample.head);
            _.title(headClone, title);

            sample.heads.appendChild(headClone);

            //atur content
            var contentClone = app.clone(sample.content);
            app.attr(contentClone, 'id', tabId);//id
            sample.contents.appendChild(contentClone);

            //add tab
            _.switcher.add(contentClone, headClone);

            var tabObj = new TabObj(_, headClone, contentClone, tabId, sample);
            _.opened[tabId] = tabObj;
            //add hook
            headClone.ptab = tabObj;

            //cari tombol close
            app.each(app.sa(contentClone, TAB_CLOSE_BTN), function (btn) {
                app.click(btn, function () { tab_.close(); });
            });

            //scan content
            app.scan(contentClone);

            return tabObj;
        };
    })(ContentTab.prototype);

    app.ui.contentTab = function (elm, param) {
        if (elm && elm.ptabs) return;
        var obj = (elm.ptabs = new ContentTab(elm, param));
        if (!param) param = {};

        obj.switcher.onchange = function (fromHeadElm, toHeadElm) {
            var fromTab = obj.get(fromHeadElm);
            var toTab = obj.get(toHeadElm);
            return (!fromTab || !fromTab.onunset || (fromTab.onunset() !== false)) && (!toTab || !toTab.onset || (toTab.onset() !== false));
        };

        //find default element
        if (!(param.findSample === false)) {
            var headElm = param.headElm || app.s(elm, ATTR_HEAD);
            var bodyElm = param.content || app.s(elm, ATTR_BODY);
            var headsElm = param.headsElm || app.s(elm, ATTR_HEADS);
            var bodiesElm = param.contents || app.s(elm, ATTR_BODIES);

            if (param.findSample != 'preserve') {
                headElm.remove();
                bodyElm.remove();
            }

            //find default
            obj.addSample('default', headElm, bodyElm, headsElm, bodiesElm, param.maxCount);
        }

        return obj;
    };
})(app);