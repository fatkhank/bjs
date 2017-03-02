/// <reference path="../app/_base.js" />

(function (app) {
    var dialogSample = app.grabSample('.upload-excel-dialog')
        , previewSample = app.grabSample(dialogSample, '.dz-preview')
        , previewTemplate = previewSample.innerHTML
    ;

    var dialogDef;
    app.onStarting(function () {
        dialogDef = app.ui.dialog().define(dialogSample, 'excel_chooser');
        dialogDef.oncreate = function (instance) {
            instance = dialogDef.ins(instance);
        };
    });

    var component = {
        globalPayload: app.noop
    };

    var mapper = app.mapper(function (dialogElm) {
        var obj = {
            url: null,
            dzElm: app.s(dialogElm, ".dropzone"),
            btnTemplate: app.s(dialogElm, '[btn=template]'),
        };

        obj.dropzone = new Dropzone(obj.dzElm, {
            url: function () {
                return typeof obj.url == 'string' ? obj.url : obj.url();
            },
            previewTemplate: previewTemplate,
            previewsContainer: '.dropzone-previews',
            acceptedFiles: "application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv",
            sending: function (file, xhr, formData) {
                app.auth.authXhr(xhr);
                component.globalPayload(formData);
                file.previewElement.loadCover = app.ui.loading(file.previewElement);
            },
            success: function (file, response) {
                var previewElm = file.previewElement;
                previewElm.href = response.file_url;
                previewElm.onclick = null;
                var statusElm = app.s(previewElm, '.upex-status');

                //todo translate
                if (response.error == 0) {
                    statusElm.innerHTML = response.total + " total operasi.";
                    app.ui.notifSuccess(response.total + ' operasi berhasil diproses');
                    app.remClass(previewElm, 'upex-error');
                    app.class(previewElm, 'upex-success');
                } else {
                    statusElm.innerHTML = response.total + " total operasi, " + response.error + ' error.';
                    app.ui.notifError(response.error + ' dari ' + response.total + ' operasi mengandung kesalahan');
                    app.class(previewElm, 'upex-error');
                }
            },
            error: function (file, errorMessage, xhr) {
                var previewElm = file.previewElement;
                app.s(previewElm, '.upex-status').innerHTML = "Terdapat kesalahan. Klik untuk unggah ulang";
                app.class(previewElm, 'upex-error');
                previewElm.loadCover.hide();

                previewElm.onclick = function () {
                    previewElm.onclick = null;
                    obj.dropzone.processFile(file);
                    return false;
                };
            },
            complete: function (file) {
                var previewElm = file.previewElement;
                previewElm.loadCover.hide();
            }
        });
        app.click(app.s(dialogElm, '[btn=empty]'), function () {
            app.s(dialogElm, '.dropzone-previews').innerHTML = '';
        }, true);

        return obj;
    });

    app.ui.uploadExcel = function (options) {
        if (!options) return component;
        var dialog = dialogDef.open();
        var form = mapper.get(dialog.contentElm);
        form.url = options.url;

        app.show(form.btnTemplate, !!options.template);//tampilkan tombol hanya jika ada template
        form.btnTemplate.href = app.url('excel/template/' + options.template);
        
        app.click(app.s(dialog.contentElm, '[btn=cancel]'), function () {
            dialog.close();
        }, true);

    };
})(app);