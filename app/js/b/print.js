(function (app) {
    'use strict';

    ///<var type="HTMLElement"></var>
    var printArea = window.appPrintArea;
    var embed = app.s(printArea, 'embed');

    app.print = function (url, param) {
        //-- menggunakan iframe
        if (!param) param = {};
        param.format = 'pdf';
        param.out = 'inline';
        var pdfUrl = app.auth.authUrl(url + (url.indexOf('?') >= 0 ? '&' : '?') + $.param(param));

        app.ui.loading(appBody, new Promise(function (done) {
            //cek token first
            app.auth.check().then(function (data) {
                printArea.src = pdfUrl;

                printArea.onload = function () {
                    done();
                    printArea.contentWindow.print();
                };
            });
        }), null, null, 'printing');

        //tanpa iframe
        //app.get(url, {noframe:true}).then(function (page) {
        //    window.appPrintArea.innerHTML = page;
        //    window.print();
        //});
    };

    app.download = function (url, param) {
        //-- menggunakan iframe
        if (!param) param = {};
        if (!param.format) param.format = 'pdf';
        param.out = 'download';

        var pdfUrl = app.auth.authUrl(url + (url.indexOf('?') >= 0 ? '&' : '?') + $.param(param));
        window.open(pdfUrl, '_blank');

        //check if token expired, notify
        app.ui.loading(app.bodyElm, app.auth.check().then(function (data) {
            app.ui.notifError('Please repeat action!');
        }));

    };
})(app);