namespace app {
    let parameterize = <any>window.$.param;

    /**
     * Current app state
     */
    export namespace state {
        var _menu: Menu;
        var _submenu: Submenu;
        var _view: View;

        /**
         * Get or set current menu
         * @param menu
         */
        export function menu(menu?: Menu): Menu {
            if (menu !== undefined) {
                _menu = menu;
                _submenu = null;
                _view = null;
            }
            return _menu;
        }

        /**
         * Get or set submenu
         * @param submenu 
         */
        export function submenu(submenu?: Submenu): Submenu {
            if (submenu !== undefined) {
                _menu = submenu.menu;
                _submenu = submenu;
                _view = null;
            }
            return _submenu;
        }

        /**
         * Get or set view
         * @param view
         */
        export function view(view?: View): View {
            if (view !== undefined) {
                _view = view;
            }
            return _view;
        }

        function getRoute() {
            let route = "#";
            if (_menu) {
                route += _menu.name;
            }
            if (_submenu) {
                route += "/" + _submenu.name;
            }
            if (_view) {
                route += "/" + _view.getRoute();
            }
            return route;
        }

        /**
         * Push current state to history
         */
        export function push() {
            //replace title
            var title = getTitle();
            document.title = title;

            history.pushState(null, title, getRoute());
        }

        /**
         * Get title of current route
         */
        export function getTitle() {
            if (_submenu) {
                return appName + " - " + _submenu.title;
            }

            if (_menu) {
                return appName + " - " + _menu.title;
            }

            return appName;
        }

        /**
         * Replace current state history
         */
        export function replace() {
            //replace title
            var title = getTitle();
            document.title = title;

            history.replaceState(null, title, getRoute());
        }
    };

    let baseUrl: any = ENV.base_url;
    let baseApiUrl: any = ENV.base_api_url;

    //normalize
    if (!baseUrl.endsWith("/")) baseUrl += "/";
    if (!baseApiUrl.endsWith("/")) baseApiUrl += "/";

    export var current_url = baseUrl + location.pathname.substr(1);
    /**
     * Wrap relative url to absolute url
     * @param url 
     */
    export function url(url: string, param?): string {
        if ((<any>url).startsWith("/")) {
            url = url.substr(1);
        }
        if (url.indexOf("?") == -1) {
            url += "?";
        }

        return baseUrl + url + (param ? ((url.indexOf("?") >= 0 ? "&" : "?") + parameterize(param)) : "");
    };
    /**
     * Wrap relative url to absolute url
     * @param url 
     */
    export function apiUrl(url: string, param?) {
        if ((<any>url).startsWith("/")) {
            url = url.substr(1);
        }

        return baseApiUrl + url + (param ? ((url.indexOf("?") >= 0 ? "&" : "?") + parameterize(param)) : "");
    };

    let VIEW_URL = <any>(document.location.origin + document.location.pathname);
    //remove index if exists
    if (VIEW_URL.endsWith(".html")) {
        VIEW_URL = VIEW_URL.substr(0, VIEW_URL.lastIndexOf("/"));
    }

    //set trailing slash
    if (!VIEW_URL.endsWith("/")) {
        VIEW_URL = VIEW_URL + "/";
    }

    /**
     * Wrap relative view url to absolute url
     * @param url 
     */
    export function viewUrl(url) {
        //remove duplicate leading slash
        if (VIEW_URL.endsWith("/") && url.startsWith("/")) {
            url = url.substr(1);
        }
        return VIEW_URL + url;
    };

    /**
     * Goto route
     */
    export function goto(route: string, pushToHistory = true) {
        //hide rightbar and menu drawer
        ui.menus.show(false);


        let selectedMenu: Menu = null;//match menu
        let selectedMenuRoute = null;

        //fake it if none
        if (!route || (typeof route != "string")) {
            route = "";
        }

        //clean hash, leading slash
        let clean = route.match(/[^#\/]+[^#]+\/?$/);
        if (clean) {
            let cleanRoute = clean[0];
            let firstRoute = "";

            //find main menu name
            let first = /^[^/]+/g.exec(cleanRoute);
            if (first) {
                firstRoute = first[0];
            }

            //--- if commands
            if (firstRoute == "logout") {
                history.replaceState(null, null, "#");
                auth.handler.logout();
                return;
            }

            //push
            if (pushToHistory) {
                history.pushState(null, null, "#" + route);
            }

            //find in main menu that match
            for (let i = 0; i < app.menus.length; i++) {
                let menu = app.menus[i];
                if ((menu.name == firstRoute) && !menu.ignored) {
                    selectedMenuRoute = cleanRoute.substr(firstRoute.length);
                    selectedMenu = menu;
                    break;
                }
            }
        }

        //not found yet, find any not ignored menu
        if (!selectedMenu) {
            for (let i = 0; i < app.menus.length; i++) {
                let menu = app.menus[i];
                if (!menu.ignored) {
                    selectedMenu = menu;
                    break;
                }
            }
        }

        //if there is menu, show it
        if (selectedMenu) {
            ui.menus.switcher.headOn(selectedMenu.btn, true);
            return selectedMenu.show(selectedMenuRoute).then(function (res) {
                //replace history if any
                state.replace();
                return res;
            });
        }

        //this user realy has no menu
        return PROMISE_NULL;
    }
}