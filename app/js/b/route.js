(function (app) {
    //normalize
    if (!BASE_URL.endsWith('/')) BASE_URL += '/';
    if (!BASE_API_URL.endsWith('/')) BASE_API_URL += '/';

    app.current_url = BASE_URL + location.pathname.substr(1);
    app.url = function (url) {
        if (url.startsWith('/')) url = url.substr(1);
        return BASE_URL + url;
    };
    app.apiUrl = function (url) {
        if (url.startsWith('/')) url = url.substr(1);
        return BASE_API_URL + url;
    };
    app.viewUrl = function (url) {
        if (VIEW_URL.endsWith('/') && url.startsWith('/')) url = url.substr(1); return VIEW_URL + url;
    };

    app.goto = function (url, opt) {
        var route = app.route[url];
        if (typeof (route) == 'function') route = route(opt);

        window.location = route;
    };

    app.history = {};
    app.history.push = function (url) {

    };
})(app);