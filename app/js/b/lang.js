(function (app) {
    'use strict';

    var obj = app.lang = {
        current: 'ID',
        db: {},
        add: function (lang, entries) {
            var lang = obj.db[lang] || (obj.db[lang] = {});
            for (var i in entries) {
                lang[i] = entries[i];
            }
        }
    };

    var currentDb = obj.db[obj.current];
    obj.set = function (lang) {
        obj.current = lang;
        currentDb = obj.db[obj.current];
    }

    /**
     * Get text resource/translation
     */
    app.getText = function (key, defaultTxt, param) {
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

    /**
     * Scan text
     */
    obj.scan = function (elm) {

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
    };

    app.addScanner(obj.scan);
})(app);