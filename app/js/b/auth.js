/// <reference path="_base.js" />
/// <reference path="_route.js" />
/// <reference path="~/libs/jquery.oauth.js" />
/// <reference path="_lang.js" />
/// <reference path="_ajax.js" />

(function (app) {
    var auth = app.auth = {
        ///<param name="client" type="string"></param>
        client: null,
        /**
         * Login from app
         */
        login: null,
        /**
         * Logout from app
         */
        logout: null,

        /**
         * 
         */
        checkTimeout: 300,

        currentUser: null,

        /**
         * Permissions table
         */
        permissions: {},

        /**
         * Add authentication to xhr
         */
        authXhr: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + this.client.getAccessToken());
        },

        /**
         * Add authentication to url
         */
        authUrl: function (url) {
            return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'access_token=' + this.client.getAccessToken();
        },

        /**
         * Check/Ensure token is valid, then do something
         */
        check: function () {
            return app.get(app.url('oauth/check'));
        }
    };

    auth.init = function (param) {
        //default refreshTokenStorage
        var refreshTokenStorage = param.refreshTokenStorage || localStorage;
        var accessTokenStorage = param.accessTokenStorage || localStorage;

        //-- for intellisense
        param.onAskLogin;//
        param.onLoggedIn;
        param.onLoginFail;
        if(!param.onLoggedOut)param.onLoggedOut = app.noop;

        auth.client = new jqOAuth({
            store: {
                get: function (name) {
                    return JSON.parse(accessTokenStorage.getItem(name));
                },
                set: function (name, value) {
                    accessTokenStorage.setItem(name, JSON.stringify(value));
                }
            },
            events: {
                login: function () {
                    param.onLoggedIn();
                },
                logout: function () {
                    param.onLoggedOut();
                },
                tokenExpiration: function () {
                    var rt = refreshTokenStorage.getItem('auth.rt');
                    //try refresh
                    return $.post(app.url("oauth/refresh_token"), { rt: rt }).then(function (response) {
                        auth.client.setAccessToken(response.accessToken, response.accessTokenExpiration);
                        if (response.rt != rt) refreshTokenStorage.setItem('auth.rt', response.rt);
                    }, function () {
                        //fail refresh
                        auth.client.logout();
                    });
                }
            }
        });

        auth.login = function (uname, pwd) {
            return $.ajax({
                url: app.url("/login"),
                method: "POST",
                data: {
                    credentials: {
                        username: uname,
                        password: pwd
                    }
                },
                statusCode: {
                    200: function (response) {
                        if (response.accessToken === undefined) {
                            param.onLoginFail();
                        } else {
                            //save rt
                            refreshTokenStorage.setItem('auth.rt', response.rt);
                            auth.client.login(response.accessToken, response.accessTokenExpiration);
                        }
                    },
                }
            }).then(null, function () {
                param.onLoginFail();
            });
        };

        auth.logout = function () {
            refreshTokenStorage.removeItem('auth.rt');
            this.client.logout();
        };

        //force login if timeout
        setTimeout(function () {
            if (!auth.client.hasAccessToken()) {
                param.onAskLogin();
            }
        }, auth.checkTimeout);
    };

    /**
     * Check if user can do something
     */
    app.auth.can = function (permissions) {
        if (!Array.isArray(permissions)) permissions = [permissions];

        if (!app.auth.currentUser) return false;
        for (var i = 0; i < permissions.length; i++) {
            if (!app.auth.permissions[permissions[i]]) return false;
        }
        return true;
    };
})(app);