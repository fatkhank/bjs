namespace app.auth {
    type TJQOAuth2Opt = TAuthHandlerOpt & {
        accessToken: {
            url: string,
            method?: "GET" | "POST"
        },
        refreshToken: {
            url: string,
            method?: "GET" | "POST"
        },
        accessTokenStorage?: Storage,
        refreshTokenStorage?: Storage,
    };

    export class JQOAuth2 extends AuthHandler {
        ///<param name="client" type="string"></param>
        client: any;

        /**
         * 
         */
        checkTimeout: 300;

        private opt: TJQOAuth2Opt;

        constructor(opt: TJQOAuth2Opt) {
            super(opt);
            this.opt = opt;

            //setup options
            if (!opt) {
                console.error("AuthHandlerOpt cannot be null");
            }

            if (!opt.accessTokenStorage) {
                //persist long
                opt.accessTokenStorage = localStorage;
            }

            if (!opt.refreshTokenStorage) {
                //persist long
                opt.refreshTokenStorage = localStorage;
            }
        }

        /**
         * Reset auth cookie in server, this will ensure auth cookie is set to
         * correct user for current application instance.
         */
        resetCookie() {
            return xpost(app.url('oauth/cookie'));
        }

        /**
         * Check if response contain auth error
         * @param response
         */
        isError(response: string) {
            return !response.match(/(access_denied|(missing a required parameter))/);
        }

        /**
         * Add authentication to url
         */
        authUrl(url: string) {
            return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'access_token=' + (<any>this.client).getAccessToken();
        }

        authXhr(xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + this.client.getAccessToken());
        }

        init(param: TAuthHandlerInitOpt) {
            let ini = this;
            let accessTokenStorage: Storage = ini.opt.accessTokenStorage;
            let refreshTokenStorage: Storage = ini.opt.refreshTokenStorage;

            let w: any = window;
            let client = new w.jqOAuth({
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
                        setTimeout(param.onLoggedIn);
                    },
                    logout: function () {
                        param.onLoggedOut();
                    },
                    tokenExpiration: function () {
                        var rt = refreshTokenStorage.getItem('auth.rt');

                        //try refresh
                        var refreshFunc = w.$.post;
                        if (ini.opt.refreshToken.method == "GET") {
                            refreshFunc = w.$.get;
                        }

                        return refreshFunc(ini.opt.refreshToken.url, {
                            refresh_token: rt
                        }).then(function (response) {
                            client.setAccessToken(response.accessToken, response.accessTokenExpiration);
                            if (response.rt != rt) refreshTokenStorage.setItem('auth.rt', response.reresh_token);
                        }, function (error) {
                            function logout() {

                            }
                            //fail refresh
                            ui.notifError({
                                msg: "Masalah autentikasi.",
                                time: 5000,
                                actions: [{
                                    time: 10000,
                                    label: "Logout",
                                    func: (notif) => {
                                        client.logout();
                                    }
                                }]
                            });
                        });
                    }
                }
            });
            ini.client = client;

            ini.login = function (uname, pwd) {
                return w.$.ajax({
                    url: ini.opt.accessToken.url,
                    method: ini.opt.accessToken.method || "POST",
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
                                client.login(response.accessToken, response.accessTokenExpiration);
                            }
                        },
                    }
                }).then(null, function () {
                    param.onLoginFail();
                });
            }

            ini.logout = function () {
                refreshTokenStorage.removeItem('auth.rt');
                client.logout();
            }

            //force login if timeout
            setTimeout(function () {
                if (!client.hasAccessToken()) {
                    param.onAskLogin();
                }
            }, this.checkTimeout);
        };
    }
}