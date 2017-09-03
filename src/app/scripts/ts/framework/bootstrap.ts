namespace app {
    var w: any = window;

    //another load functions from components, etc
    let loadPromises: Array<Promise<any>> = [];

    //todo move
    export var userConfig = new app.Cache("user_config", {
        fetch: function (id, param) {
            return app.asPromise({});
        },
        fetchAll: function (param, skip, count) {
            return app.asPromise([]);
        },
        autosave: true,
        expire_time: 999999999
    }).readLocal();

    /**
     * List contains functions executed when application starting up.
     */
    var startupList = [];

    /**
     * Add function to run on application startup. All framework and app functions have been registered.
     * Function will be executed after app.start is called.
     */
    export function onStarting(func) {
        startupList.push(func);
    }


    /**
     * Start the application
     */
    export function start(startParam: {
        getMenu: () => Promise<Array<app.Menu>>,
        onLoggedIn?: (f: (p) => void) => void,
        login?: {
            /**
             * List of suggested accounts
             */
            accounts?: {
                username: string,
                password?: string
            }[],

            /**
             * Preferred username
             */
            username?: string,

            /**
             * Prefered password
             */
            password?: string
        }
    }) {
        //parse parameter
        var loginParam = startParam.login || {};
        var loginAccounts = <{ username: string, password: string }[]>(loginParam.accounts || env("login.accounts"));
        var preferredLoginUsername = loginParam.username || env("login.username");
        var preferredLoginPassword = loginParam.password || env("login.password");

        //----- check login
        var loaderCover = document.getElementById("appLoaderCover")
            , loginForm: HTMLElement = null
            , loading = ui.loading(loaderCover)
            , loggingIn = false
            ;

        /**
         * Display main app loading cover
         */
        function showLoadCover() {
            loading = ui.loading(loaderCover, {
                loadingText: getText("app_loading_txt")
            })
            app.show(loaderCover);
        }

        /**
         * Hide main app loading cover
         */
        function hideLoadCover() {
            if (loading) (<any>loading).hide();
            app.hide(loaderCover);
        }

        /**
         * Setup login form control, etc
         */
        function setupLoginForm() {
            loginForm = document.getElementById("appLoginForm");
            //--- login form
            var loginUsernameElm = <HTMLInputElement>document.getElementById("appLoginUsername")
                , loginPasswordElm = <HTMLInputElement>document.getElementById("appLoginPassword")
                , btnLogin = s(loaderCover, "#appBtnLogin")
                ;

            if (loginAccounts) {
                //get usernames
                var usernames = [];
                var passwordMap = [];
                for (var i = 0; i < loginAccounts.length; i++) {
                    var account = loginAccounts[i];
                    passwordMap[i] = account.password;
                    usernames.push({
                        label: account.username,
                        value: i
                    });
                }

                var usernameSelect = ui.select(loginUsernameElm, {
                    options: usernames,
                });
                usernameSelect.onchange = function (select, val) {
                    loginUsernameElm.value = val;

                    //fill password
                    loginPasswordElm.innerHTML = passwordMap[val] || loginParam.password || null;
                };

                if (preferredLoginUsername) usernameSelect.val(preferredLoginUsername);
            }

            //add default
            if (preferredLoginUsername) loginUsernameElm.value = preferredLoginUsername;
            if (preferredLoginPassword) loginPasswordElm.value = preferredLoginPassword;

            function attempLogin() {
                //no double login
                if (loggingIn) return false;

                loggingIn = true;
                var username = loginUsernameElm.value;
                if (!username) {
                    loggingIn = false;
                    return loginUsernameElm.focus();
                }
                var password = loginPasswordElm.value;
                if (!password) {
                    loggingIn = false;
                    return loginPasswordElm.focus();
                }
                showLoadCover();
                auth.handler.login(username, password);
            }
            app.click(btnLogin, attempLogin);
            app.onKeyEnter(loginUsernameElm, attempLogin, true);
            app.onKeyEnter(loginPasswordElm, attempLogin, true);
        }

        /**
         * Hide main loading bar, then display the login form
         */
        function showLoginForm() {
            app.show(loaderCover);
            //setup form
            if (!loginForm) setupLoginForm();
            app.show(loginForm);
            if (loading) (<any>loading).hide();
        }

        /**
         * Authentication finished. Render menu
         */
        function onLoggedIn() {
            //--- fetch menu
            loadPromises.push(startParam.getMenu().then(function (menus) {
                //display menu to screen (still covered by app main loader)
                ui.menus.init(menus);

                //--- do additional init
                if (startParam.onLoggedIn) {
                    startParam.onLoggedIn(function (p) {
                        loadPromises.push(p);
                    });
                }

                //----- check all loaded
                w.Promise.all(loadPromises).then(function (loadValues) {
                    //turn off scrolling on arrow
                    app.arrowScrolling(document, false);

                    //decide what menu/part must be shown

                    //check if there is path
                    let path = document.location.hash;
                    if (path) {
                        //if there is path, go there
                        app.goto(path, false);
                    } else {
                        //nopath, find from recent menu
                        app.userConfig.get("menu").then(function (route) {
                            app.goto(route, false);
                        });
                    }

                    //listen on history changed (i.e, when browser's back or forward button clicked)
                    window.onpopstate = function (state) {
                        app.goto(document.location.hash, false);
                    };

                    //close main app loading
                    hideLoadCover();
                });
            }));
        }

        //------- THIS IS THE TRIGGER ------------
        app.auth.init({
            onAskLogin: showLoginForm,
            onLoginFail: function () {
                loggingIn = false;
                showLoginForm();
                ui.notifError(app.getText("login_failed", "Login Gagal"));
            },
            onLoggedIn: function () {
                console.log("logged in");
                onLoggedIn();
            },
            onLoggedOut: function () {
                loggingIn = false;
                window.location.reload();
            }
        });

        //init started
        for (var i = 0; i < startupList.length; i++) {
            startupList[i]();
        }
    }
}