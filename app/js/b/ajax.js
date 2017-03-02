/// <reference path="_base.js" />
/// <reference path="_route.js" />
/// <reference path="_auth.js" />

(function (app) {
    app.get = function (url, data) {
        if (app.dummyApi) return app.dummyApi.get(url, data);

        if (data) {
            //custom property
            if (typeof (data) == 'string') {
                data = { props: [data] };
            } else if (data instanceof Array) {
                data = { props: data };
            }
        } else data = {};

        app.ajax.payload('get', url, data);

        return $.get(url, data);
    };

    app.post = function (url, data) {
        if (app.dummyApi) return app.dummyApi.post(url, data);

        if (!data) data = {};

        app.ajax.payload('post', url, data);

        return $.post(url, data);
    };

    app.put = function (url, data, option) {
        if (app.dummyApi) return app.dummyApi.put(url, data);

        if (!data) data = {};

        var payload = {
            url: url,
            method: 'PUT',
            data: data
        };

        //LUMEN HACK
        data._method = 'PUT';
        payload.method = 'POST';

        if (option) for (var o in option) payload[o] = option[o];

        app.ajax.payload('put', url, data);

        return $.ajax(payload);
    };

    app.delete = function (url, option) {
        if (app.dummyApi) return app.dummyApi.delete(url);
        var payload = {
            url: url,
            method: 'DELETE'
        };

        if (option) for (var o in option) payload[o] = option[o];

        app.ajax.payload('delete', null);

        return $.ajax(payload);
    };

    /**
     * Ajax settings
     */
    app.ajax = {
        /**
         * Global method called to modify payload of ajax request
         */
        payload: function (method, url, data) { },
    };
})(app);