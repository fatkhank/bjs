namespace app.ui {
    'use strict';

    //----- loading animation
    var LOADING_CLASSNAME = 'show-loading'
        , sample = app.grabSample('.loading-status')
        ;

    type TLoadingOpt = {
        loadingText?: (string),
        successMsg?: (string),
        errorMsg?: (string | ((any) => string)),
        stickyError?: boolean
    };
    type TLoading = {
        hide: () => void
    };

    export function loading<T = any>(elm: HTMLElement, promise: Promise<T>, option?: TLoadingOpt): Promise<T>;
    export function loading(elm: HTMLElement, option?: TLoadingOpt): TLoading;

    /**
     * Tampilkan anim loading
     */
    export function loading(elm: HTMLElement, promise?: Promise<any>, option?: {
        loadingText?: (string),
        successMsg?: (string),
        errorMsg?: (string | ((any) => string)),
        stickyError?: boolean
    }) {
        //todo disable multiple loading
        app.addClass(elm, LOADING_CLASSNAME);
        var loading = app.clone(sample)
            , label = app.s(loading, '.text')
            ;

        if (!option) option = {};

        label.innerHTML = option.loadingText || '';// || app.getText('loading');
        elm.appendChild(loading);

        if (app.isPromise(promise)) {
            return promise.then(function (data) {
                app.remClass(elm, LOADING_CLASSNAME);
                if (option.successMsg) {
                    app.ui.notifSuccess(option.successMsg);
                }
                loading.remove();
                return data;
            }, function (error) {
                app.remClass(elm, LOADING_CLASSNAME);
                loading.remove();
                console.error('Load error\n', (error && (error.stack || error.statusText)) || 'unknown');
                if (!error) return;//maybe overwritten

                let errorMsg = option.errorMsg;
                if (errorMsg === undefined) {
                    errorMsg = (error.responseJSON && error.responseJSON.error) || error.responseText || error.statusText;
                } else if (typeof errorMsg == 'function') {
                    errorMsg = errorMsg(error);
                }

                app.ui.notifError(errorMsg || 'Error', option.stickyError || false);

                return error;
            });
        } else {
            return {
                hide: function () { loading.remove(); app.remClass(elm, LOADING_CLASSNAME); }
            }
        }
    };
}