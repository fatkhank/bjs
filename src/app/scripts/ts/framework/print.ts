namespace app {
    var w: any = window;

    var printArea = <HTMLIFrameElement>(document.getElementById("appPrintArea"));
    //let objectElm = <HTMLObjectElement>s(printArea, "object");
    var appBody = app.bodyElm;
    var timezoneOffset = (new Date).getTimezoneOffset();

    type TDownloadOpt = any;
    // {
    //     format?: "pdf" | "excel" | "html",
    //     out?: "download" | "inline",
    //     timezone_offset:
    // };

    export function fprint(url: string, param?: TDownloadOpt) {
        //-- menggunakan iframe
        if (!param) param = {};
        param.format = "pdf";
        param.out = "inline";
        //kirimkan offset timezone, agar tanggal sesuai dengan lokal browser
        param.timezone_offset = timezoneOffset;
        let finalUrl = url + (url.indexOf("?") >= 0 ? "&" : "?") + w.$.param(param);

        app.ui.loading(appBody, app.promise(function (done) {
            var timeout = setTimeout(function () {
                if (app.s(<any>printArea.contentDocument, "body") != null) {
//                    app.ui.notif("Harap matikan download manager");
                    done();
                }
            }, 5000);

            printArea.onload = null;
            
            //make request
            printArea.src = finalUrl;

            //on finish
            printArea.onload = function () {
                //check if auth fail
                if (auth.handler.isError(printArea.contentDocument.body.innerText)) {
                    //refresh auth cookie
                    auth.handler.resetCookie().then(function () {
                        //retry
                        printArea.src = finalUrl;
                        //on finish
                        printArea.onload = function () {
                            //check if auth fail
                            if (printArea.contentDocument.body.innerText.match(/error/)) {
                                ui.notifError("Terdapat kesalahan")
                            } else {
                                //no error
                                printArea.contentWindow.print();
                            }
                            clearTimeout(timeout);
                            done();
                        };
                    });
                } else {
                    //no error
                    clearTimeout(timeout);
                    printArea.contentWindow.print();
                    done();
                }
            };
        }),
            {
                loadingText: app.getText("printing")
            }
        );
    };

    export function fdownload(url: string, param?: TDownloadOpt) {
        //-- menggunakan iframe
        if (!param) param = {};
        if (!param.format) param.format = "pdf";
        param.out = "download";

        var pdfUrl = url + (url.indexOf("?") >= 0 ? "&" : "?") + w.$.param(param);
        window.open(pdfUrl, "_blank");
    };
}