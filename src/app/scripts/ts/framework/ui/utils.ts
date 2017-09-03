namespace app.ui {
    'use strict';
    /**
     * App sample container
     */
    var appSamples = app.samples;

    //----- ui mockuper
    (function () {
        var TAG_NAME = 'p-ui'
            , OPT_ATTR = 'opt-'
            ;

        app.addScanner(function (elm) {
            app.each(app.sa(elm, TAG_NAME), function (uiElm) {
                var name = app.attr(uiElm, 'name');
                var appUI = app.ui[name];
                if (appUI) {
                    //ambil option
                    var opt = {};
                    for (var i = 0; i < uiElm.attributes.length; i++) {
                        var attr = uiElm.attributes[i];
                        if ((<any>attr.name).startsWith(OPT_ATTR)) {
                            var optName = attr.name.substring(OPT_ATTR.length);
                            opt[optName] = attr.value;
                        }
                    }

                    uiElm.innerHTML = "";
                    //jalankan ui
                    appUI(uiElm, opt);
                }
            });
        }, 99999);
    })();

    //--- form formatter
    (function () {
        var ATTR_NAME = 'form-label';
        var stylesheet = app.getStylesheet();
        var formCounter = 1;

        app.addScanner(function (elm) {
            app.each(app.sa(elm, '[' + ATTR_NAME + ']'), function (form: any) {
                var pform = form.pform;
                if (pform) {
                    app.remAttr(form, pform.css);
                } else {
                    pform = form.pform = {};
                }
                pform.css = 'pform' + formCounter++;
            });
        });
    })();

    //--- copy me 
    (function () {
        var ATTR_NAME = 'copy-me';
        app.addScanner(function (elm) {
            app.each(app.sa(elm, '[' + ATTR_NAME + ']'), function (targetElm) {
                var count = app.attr(targetElm, ATTR_NAME);
                app.remAttr(targetElm, 'copy-me');
                while (count-- > 0) {
                    var clone = app.clone(targetElm);
                    targetElm.parentElement.appendChild(clone);
                }
            });
        });
    })();
}