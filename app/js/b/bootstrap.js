/// <reference path="_routes.js" />
/// <reference path="_base.js" />
/// <reference path="../ui/_components.js" />
/// <reference path="_lang.js" />
/// <reference path="moment.js" />
/// <reference path="_auth.js" />
/// <reference path="../registration/parts.js" />
/// <reference path="../registration/menus.js" />

(function (app) {
    var startlist = [];
    /**
     * Add func to run on started (all func registered)
     */
    app.onStarting = function (func) {
        startlist.push(func);
    };

    //another load functions fo\rom components, etc
    var loadPromises = [];
    /**
     * Use part
     */
    app.usePart = function (part) {
        //load once
        if (!part.loadPromise) {
            var holderElm = document.createElement('div');
            appParts.appendChild(holderElm);
            part.holderElm = holderElm;

            //load requirement
            for (var r = 0; r < part.uses.length; r++) {
                app.usePart(part.uses[r]);
            }

            //prepare part url
            var url = part.url;
            if (!url.startsWith('http')) {
                url = app.viewUrl('/parts/' + url);
                if (!url.endsWith('.html')) url += (APP_DEBUG ? '' : '.min') + '.html';
            }
            holderElm.id = 'holder_' + url.replace(' ', '_');

            //jika belum diload
            loadPromises.push(part.loadPromise = new Promise(function (done, fail) {
                $(holderElm).load(url, function (response, status) {
                    if (status == 'error') {
                        //                    if (fail) fail(response);
                    } else if (done) {
                        //trigger load func on part
                        part.onload(part.holderElm);
                        done(holderElm, part);
                    }
                });
            }));
        }

        return part;
    };

    /**
     * Start the application
     */
    app.start = function (startParam) {
        if (!startParam) startParam = {};
        if (!startParam.init) startParam.init = function () { };


        //----- check login
        var loaderCover = appLoaderCover
            , loginForm = appLoginForm
            , loading = app.ui.loading(loaderCover)
            , logging = false
        ;

        //--- login form
        var loginUsernameElm = app.s(appLoginUsername)
            , loginPasswordElm = appLoginPassword
            , btnLogin = app.s(loaderCover, '#appBtnLogin')
        ;

        if(startParam.loginAccounts){
            var usernameSelect = app.ui.select(loginUsernameElm, {
                options: startParam.loginAccounts
            });
            usernameSelect.onchange = function (select, val) {
                loginUsernameElm.value = val;
            };

            if (startParam.loginUsername) usernameSelect.val(startParam.loginUsername);
        }
        

        //add default
        if (startParam.loginUsername) loginUsernameElm.value = startParam.loginUsername;
        if (startParam.loginPassword) loginPasswordElm.value = startParam.loginPassword;

        function attempLogin() {
            if (logging) return false;

            logging = true;
            var username = loginUsernameElm.value;
            if (!username) return loginUsernameElm.focus();
            var password = loginPasswordElm.value;
            if (!password) return loginPasswordElm.focus();

            showLoadCover();
            app.auth.login(username, password);
        }
        app.click(btnLogin, attempLogin);
        app.onKeyEnter(loginUsernameElm, attempLogin, true);
        app.onKeyEnter(loginPasswordElm, attempLogin, true);

        function showLoadCover() {
            loading = app.ui.loading(loaderCover)
            app.show(loaderCover);
        }
        function hideLoadCover() {
            if (loading) loading.hide();
            app.hide(loaderCover);
        }
        function showLoginForm() {
            app.show(loaderCover);
            app.show(loginForm);
            if (loading) loading.hide();
        }

        //--- init functions
        function init() {
            /**
             * List of generate view
             */
            var viewRequests = [];

            var requestView = function (viewContainerElm, appPart, viewParam) {
                viewRequests.push({
                    targetElm: viewContainerElm,
                    part: appPart,
                    param: viewParam
                });

                return app.usePart(appPart).loadPromise;
            };

            //--- init
            //get current user permissions
            app.get(app.apiUrl('users/me')).then(function (data) {
                app.auth.currentUser = data;

                //do additional init
                startParam.init(function (p) { loadPromises.push(p); });

                //change permissions array to map
                var permissionsMap = {};
                for (var i = 0; i < data.permissions.length; i++) permissionsMap[data.permissions[i]] = 1;
                app.auth.permissions = permissionsMap;

                //fetch menu
                initMenu(requestView, permissionsMap);

                //----- check all loaded
                Promise.all(loadPromises).then(function (loadValues) {
                    var eventName = app.ui.switcher().EVENT_SWITCH_TO;

                    //all part loaded; ready to generate view
                    for (var i = 0; i < viewRequests.length; i++) {
                        var request = viewRequests[i];
                        //generate view

                        var view = new AppView();
                        view.elm = request.part.getViewElm(request.param);

                        //hook
                        request.targetElm.appView = view;
                        request.targetElm.appendChild(view.elm);

                        //init view
                        if (request.part.initView) {
                            app.scan(view.elm);
                            request.part.initView(view, request.param);
                            //scan twice, if load return new elm
                            app.scan(view.elm);
                        }

                        //listen menu trigger
                        app.on(request.targetElm, eventName, function (targetElm) {
                            if (targetElm.appView) targetElm.appView.show();
                        });
                    }

                    //show what must be shown
                    app.userConfig.get('menu').then(function (activeMenu) {
                        if (activeMenu && activeMenu.length) {
                            var menu = app.menus[activeMenu[0]];
                            if (menu) {
                                menu.toggle.click();
                                //cari submenu
                                menu = menu.children && menu.children[activeMenu[1]];
                                if (menu) {
                                    menu.toggle.click();
                                }
                                return;
                            }
                        }

                        for (var m = 0; m < app.menus.length; m++) {
                            if (app.menus[m] && (activeMenu = app.menus[m]).active) {
                                break;
                            }
                        }
                        if (activeMenu) activeMenu.toggle.click();
                    });

                    //turn off scrolling on arrow
                    app.arrowScrolling(document, false);

                    hideLoadCover();
                });
            });
        }


        //------ parse menu
        var APP_MENU_IDENTIFIER = 'p-menu';
        var mainMenuContainer = appMainMenus
            , mainMenuSample = app.grabSample(mainMenuContainer, APP_MENU_IDENTIFIER)
            , mainMenuSwitcher = app.ui.switcher('appContent')

            , contentContainer = appBody
            , contentWSubmenuSample = app.grabSample(appSamples, 'p-app-content.vertical-menu')
            , contentDefaultSample = app.grabSample(appSamples, 'p-app-content')

            , submenuSample = app.grabSample(contentWSubmenuSample, 'p-menu')
            , subcontentSample = app.grabSample(contentWSubmenuSample, 'p-content')
        ;
        function initMenu(requestView, permissions) {
            for (var m = 0; m < app.menus.length; m++) {
                var menu = app.menus[m];
                menu.order = m;

                if (!menu.ignore) { //menu is not ignored
                    //create container
                    var contentClone, displayMenu = false;
                    if (menu.children) {
                        displayMenu = !menu.children.length;
                        //with vertical menu
                        var submenuSwitcher = app.ui.switcher(menu.name);

                        //--- with submenus
                        contentClone = app.clone(contentWSubmenuSample);
                        var submenuContainer = app.s(contentClone, '.menus');
                        var subcontentContainer = app.s(contentClone, '.contents');

                        for (var c = 0; c < menu.children.length; c++) {
                            var submenu = menu.children[c];

                            if (!submenu.ignore && (!submenu.part || submenu.part.allowFor(permissions))) {//check permissions
                                displayMenu = true;
                            } else {
                                //delete for fun
                                delete menu.children[c];
                                continue;
                            }

                            //add toggle
                            var submenuClone = app.clone(submenuSample);
                            app.s(submenuClone, 'a').innerHTML = submenu.title;
                            if (submenu.icon) app.class(app.s(submenuClone, 'i'), submenu.icon);
                            else app.s(submenuClone, 'i').remove();
                            submenuContainer.appendChild(submenuClone);
                            submenuClone.submenu = submenu;
                            submenu.toggle = submenuClone;
                            submenu.menu = menu;
                            submenu.order = c;

                            app.onKeyEnter(submenuClone, function (btn) { btn.click(); }, true);
                            app.click(submenu.toggle, function (submenuElm) {
                                var submenu = submenuElm.submenu;
                                submenu.menu.submenu = submenuElm.submenu;
                                app.userConfig.add('menu', [submenu.menu.order, submenu.order]).saveLocal();

                                //change context
                                app.context.submenuElm = submenuElm;
                                app.context.submenu = submenu;
                            });

                            //add content
                            var subcontentClone = app.clone(subcontentSample);
                            subcontentContainer.appendChild(subcontentClone);

                            if (submenu.part) {
                                requestView(subcontentClone, submenu.part, submenu.initParam);
                            }

                            submenuSwitcher.add(subcontentClone, submenuClone);
                        }
                    } else {
                        //--- single content
                        contentClone = app.clone(contentDefaultSample);
                        if (menu.part) {
                            displayMenu = menu.part.allowFor(permissions);
                            requestView(contentClone, menu.part, menu.initParam);
                        }
                    }

                    //render menu if has submenu
                    if (displayMenu) {
                        var menuClone = app.clone(mainMenuSample);
                        app.s(menuClone, 'a').innerHTML = menu.title;
                        if (menu.icon) {
                            menu.icon = menu.icon.split(' ');
                            for (var c = 0; c < menu.icon.length; c++) {
                                app.class(app.s(menuClone, 'i'), menu.icon[c]);
                            }
                        }
                        else app.s(menuClone, 'i').remove();
                        mainMenuContainer.appendChild(menuClone);
                        menu.toggle = menuClone;
                        menuClone.menu = menu;

                        //set toggle
                        mainMenuSwitcher.add(contentClone, menuClone);
                        contentContainer.appendChild(contentClone);

                        app.onKeyEnter(menuClone, function (btn) { btn.click(); }, true);//add nav horizontal
                        app.click(menuClone, function (btn) {
                            //submenu sudah ada
                            if (btn.menu.submenu) {
                                activeSubmenu = btn.menu.submenu;

                                //set context
                                app.context.menu = btn.menu;
                                app.context.menuElm = btn;

                                //trigger submenu
                                if (activeSubmenu) {
                                    activeSubmenu.toggle.click();
                                }
                                return;
                            }

                            //cari submenu, jika belum pernah dibuka
                            var submenus = btn.menu.children;
                            var activeSubmenu = null, sm = submenus.length - 1;
                            for (; sm >= 0; sm--) if (submenus[sm] && (activeSubmenu = submenus[sm]).active) break;
                            //choose first if no active
                            if (!activeSubmenu) {
                                while (sm < submenus.length && !activeSubmenu) {
                                    activeSubmenu = submenus[sm++];
                                }
                            }

                            if (activeSubmenu) {
                                activeSubmenu.toggle.click();
                            }
                            btn.menu.submenu = activeSubmenu;
                        });
                    } else {
                        delete app.menus[m];
                    }
                }
            }

            app.onArrowRight(appHeader, function (header) {
                var menu = app.s(header, '[is-active]');
                (menu.nextElementSibling || menu).click();
            }, true);
            app.onArrowLeft(appHeader, function (header) {
                var menu = app.s(header, '[is-active]');
                (menu.previousElementSibling || menu).click();
            }, true);
        }

        //------- THIS IS THE TRIGGER ------------
        app.auth.init({
            //automatically logout on close
            refreshTokenStorage: sessionStorage,
            accessTokenStorage: sessionStorage,
            onAskLogin: showLoginForm,
            onLoginFail: function () {
                logging = false;
                showLoginForm();
                app.ui.notifError(app.getText('login_failed', 'Login Gagal'));
            },
            onLoggedIn: function () {
                console.log('logged in');
                init();
            },
            onLoggedOut: function () {
                logging = false;
                window.location.reload();
            }
        });

        //init started
        for (var i = 0; i < startlist.length; i++) {
            startlist[i]();
        }
    }
})(window.app);