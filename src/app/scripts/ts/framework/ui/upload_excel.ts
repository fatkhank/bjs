namespace app.ui {
    let w: any = window;
    var dialogSample = app.grabSample('.upload-excel-dialog')
        , previewSample = app.grabSample(dialogSample, '.dz-preview')
        , previewTemplate = previewSample.innerHTML
        ;

    var dialogDef: app.ui.DialogDef;
    app.onStarting(function () {
        dialogDef = app.ui.dialog(dialogSample, 'excel_chooser');
    });


    var mapper = app.mapper(function (dialogElm) {
        var obj: any = {
            url: null,
            dzElm: app.s(dialogElm, ".dropzone"),
            btnTemplate: app.s(dialogElm, '[btn=template]'),
            onok: 0,
            onfail: 0,
        };

        obj.dropzone = new w.Dropzone(obj.dzElm, {
            url: function () {
                return typeof obj.url == 'string' ? obj.url : obj.url();
            },
            previewTemplate: previewTemplate,
            previewsContainer: '.dropzone-previews',
            acceptedFiles: "application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv",
            sending: function (file, xhr, formData) {
                app.auth.authXhr(xhr);
                UIUploadExcel.globalPayload(formData);
                file.previewElement.loadCover = app.ui.loading(file.previewElement);
            },
            success: function (file, response) {
                var previewElm = file.previewElement;
                if (response.file_url) {
                    previewElm.href = response.file_url;
                }
                previewElm.onclick = null;
                var statusElm = app.s(previewElm, '.upex-status');

                //todo translate
                if (!response.error || response.error == 0) {
                    statusElm.innerHTML = response.total + " total operasi.";
                    app.ui.notifSuccess(response.total + ' operasi berhasil diproses');
                    app.remClass(previewElm, 'upex-error');
                    app.setClass(previewElm, 'upex-success');
                } else {
                    statusElm.innerHTML = response.total + " total operasi, " + response.error + ' error.';
                    app.ui.notifError(response.error + ' dari ' + response.total + ' operasi mengandung kesalahan');
                    app.setClass(previewElm, 'upex-error');
                }

                if (obj.onok) obj.onok(response, file);
            },
            error: function (file, errorMessage, xhr) {
                var previewElm = file.previewElement;
                app.s(previewElm, '.upex-status').innerHTML = "Terdapat kesalahan. Klik untuk unggah ulang";
                app.setClass(previewElm, 'upex-error');
                previewElm.loadCover.hide();

                previewElm.onclick = function () {
                    previewElm.onclick = null;
                    obj.dropzone.processFile(file);
                    return false;
                };

                if (obj.onfail) obj.onfail(errorMessage, file);
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

    export class UIUploadExcel {
        static globalPayload(data: any) { }
    }

    type TUploadExcelOpt = {
        method?: "POST" | "GET",
        url?: string;
        onOk?: () => void;
        onFail?: () => void;
        template?: string | {
            url: string,
            label: string
        };
    };

    /**
     * Show upload excel dialog
     * @param options
     */
    export function uploadExcel(options: TUploadExcelOpt) {
        var dialog = dialogDef.open();
        var form = mapper.get(dialog.contentElm);
        form.url = options.url;
        form.onok = options.onOk;
        form.onfail = options.onFail;

        app.show(form.btnTemplate, !!options.template);//tampilkan tombol hanya jika ada template
        if (options.template) {
            var btnTemplateLabel = app.getText('download_template');
            if (typeof options.template == 'string') {
                form.btnTemplate.href = app.url('excel/template/' + options.template);
            } else {
                form.btnTemplate.href = options.template.url;
                btnTemplateLabel = options.template.label;
            }
            app.s(form.btnTemplate, 'b').innerHTML = btnTemplateLabel;
        }

        app.click(app.s(dialog.contentElm, '[btn=cancel]'), function () {
            dialog.close();
        }, true);

    };
}