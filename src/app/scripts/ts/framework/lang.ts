namespace app {
    export var lang = {
        current: 'ID',
        db: {},
        add: function (langID, entries) {
            var langID = lang.db[langID] || (lang.db[langID] = {});
            for (var i in entries) {
                langID[i] = entries[i];
            }
        },
        setLang(langID) {
            lang.current = langID;
            currentDb = lang.db[lang.current];
        },

        /**
         * Scan text
         * @param elm
         */
        scan(elm) {
            //cari yang menggunakan tag
            app.each(app.sa(elm, TAG_NAME), function (targetElm) {
                var content = document.createTextNode(recursiveTranslate(targetElm));
                app.replace(targetElm, content);
            });

            //cari yang menggunakan attr
            app.each(app.sa(elm, ATTR_NAME_CLOSED), function (targetElm) {
                var key = app.attr(targetElm, ATTR_NAME);
                targetElm.innerHTML = app.getText(key);
            });
        }
    };

    var currentDb = lang.db[lang.current];

    /**
     * Get text resource/translation
     * @param key
     * @param defaultTxt
     * @param param
     */
    export function getText(key: string, defaultTxt: string = null, param?) {
        /// <returns type='string' ></returns>
        var e = currentDb[key];
        if (e) {
            if (typeof e == 'function') return e(param);
            return e;
        }
        return defaultTxt || ('?' + key);
    };

    var TAG_NAME = 'P-T'
        , ATTR_NAME = 'p-t'
        , ATTR_NAME_CLOSED = '[p-t]'
        ;

    function recursiveTranslate(targetElm) {
        if (targetElm.tagName != TAG_NAME) return '';

        var key = app.attr(targetElm, 'key') || targetElm.innerHTML;
        var def = app.hasAttr(targetElm, 'default') ? app.attr(targetElm, 'default') : null;

        var child = targetElm.firstElementChild;
        if (child) {
            return app.getText(key, def, recursiveTranslate(child));
        }
        return app.getText(key, def);
    };

    app.addScanner(lang.scan);
}