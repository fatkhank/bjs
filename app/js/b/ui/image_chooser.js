/// <reference path="../app/_base.js" />

(function (app) {
    var dialogSample = app.grabSample('.img-chooser-dialog')
        , previewSample = app.grabSample(dialogSample, '.dz-preview')
        , previewTemplate = previewSample.innerHTML
        , PREVIEW_ELM_CLASS = 'imgc-prev'
        , PREVIEW_ELM_SELECTOR = '.' + PREVIEW_ELM_CLASS
        , PREVIEW_SELECTED_CLASS = 'selected'
    ;

    var dialogDef;
    app.onStarting(function () {
        dialogDef = app.ui.dialog().define(dialogSample, 'img_chooser');
        dialogDef.oncreate = function (instance) {
            instance = dialogDef.ins(instance);
        };
    });

    var mapper = app.mapper(function (dialogElm) {
        var obj = {
            urls: [],
            selected: null,
            add_url: app.ui.input(app.s(dialogElm, '.v-url')),
            dzElm: app.s(dialogElm, ".dropzone"),
            setPreview: function (previewElm) {
                var ini = this;
                app.click(previewElm, function (previewElm) {
                    obj.selected = previewElm.imgurl;
                    //deselect yang lain
                    app.each(app.sa(dialogElm, PREVIEW_ELM_SELECTOR + '.' + PREVIEW_SELECTED_CLASS), function (elm) {
                        app.remClass(elm, PREVIEW_SELECTED_CLASS);
                    });
                    app.class(previewElm, PREVIEW_SELECTED_CLASS);
                });

                app.click2(previewElm, function () {
                    obj.onvalue();
                });
            },
            onvalue: app.noop
        };

        obj.dropzone = new Dropzone(obj.dzElm, {
            url: function (files) {
                return app.url("files");
            },
            acceptedFiles:"image/*",
            previewTemplate: previewTemplate,
            sending: function (formData, xhr) {
                app.auth.authXhr(xhr);
            },
            success: function (file, response) {
                var previewElm = file.previewElement;
                app.class(previewElm, PREVIEW_ELM_CLASS);
                previewElm.imgurl = app.url('files/' + response.id)
                obj.urls.push(previewElm.imgurl);
                obj.setPreview(previewElm);
            }
        });

        //add url
        app.click(app.s(dialogElm, '[btn=add]'), function () {
            app.ui.loading(dialogElm, new Promise(function (done, fail) {
                var url = obj.add_url.val();
                var previewElm = app.clone(previewSample);
                var img = app.s(previewElm, 'img');
                img.src = url;
                img.onload = function () {
                    previewElm.imgurl = url;
                    app.s(previewElm, '[data-dz-name]').innerHTML = url;
                    obj.dzElm.appendChild(previewElm);
                    obj.setPreview(previewElm);
                    obj.add_url.val('');
                    done();
                }
                img.onerror = fail;
            }), 'cannot load url');
        });
        return obj;
    });

    app.ui.imageChooser = function (options) {
        var dialog = dialogDef.open();

        var form = mapper.get(dialog.contentElm);
        form.onvalue = function () {
            if (options.onvalue(form.selected, form.urls) !== false) {
                dialog.close();
            }
        };
    };
})(app);