namespace app {
    var $ = window.$;
    var dummyApi = (<any>app).dummyApi;

    /**
     * Do get request
     * @param url
     * @param data
     */
    export function xget(url: string, data?: any): Promise<any> {
        if (dummyApi) return dummyApi.get(url, data);

        if (data) {
            //custom property
            if (typeof (data) == 'string') {
                data = { props: [data] };
            } else if (data instanceof Array) {
                data = { props: data };
            }
        } else data = {};

        app.ajax.payload('get', url, data);

        return $.get(finalUrl(url), data);
    };

    /**
     * Do postrequest
     * @param url
     * @param data
     */
    export function xpost(url: string, data?): Promise<any> {
        if (dummyApi) return dummyApi.post(url, data);

        if (!data) data = {};

        app.ajax.payload('post', url, data);

        return $.post(finalUrl(url), data);
    };

    /**
     * Do ajax put request
     * @param url
     * @param data
     * @param option
     */
    export function xput(url: string, data: any, option?: any): Promise<any> {
        if (dummyApi) return dummyApi.put(url, data);

        if (!data) data = {};

        var ajaxOption = {
            url: finalUrl(url),
            method: 'PUT',
            data: data
        };

        //LUMEN HACK
        data._method = 'PUT';
        ajaxOption.method = 'POST';

        if (option) for (var o in option) ajaxOption[o] = option[o];

        app.ajax.payload('put', url, data);

        return $.ajax(ajaxOption);
    };

    /**
     * Do delete ajax request
     * @param url
     * @param option
     */
    export function xdelete(url: string, option?: any): Promise<any> {
        if (dummyApi) return dummyApi.delete(url);
        var payload = {
            url: finalUrl(url),
            method: 'DELETE'
        };

        if (option) for (var o in option) payload[o] = option[o];

        app.ajax.payload('delete', null);

        return $.ajax(payload);
    };

    function finalUrl(url) {
        return (ENV.auth == 'param') ? app.auth.authUrl(url) : url;
    }

    /**
     * Ajax settings
     */
    export var ajax = {
        /**
         * Global method called to modify payload of ajax request
         */
        payload: function (method: string, url: string, data?) { },
    };
}