namespace app {
    let w = <any>window;
    namespace state {
        export var currentWarehouseId: () => number;
    };

    var startupData: any = null;
    var userPermissions = {};

    function loadStartupData() {
        //--- load startup data
        return asPromise({
            user: {
                id: 0,
                name: "admin",
                email: "admin@admin.com"
            },
            permissions: []
        });
    }

    function getMenu() {
        return loadStartupData().then(function (data) {
            //change permissions array to map
            userPermissions = app.auth.permissions = data.permissions;

            var appMenus = [];
            for (var m = 0; m < app.menus.length; m++) {
                var menu = app.menus[m];

                //check permission
                if (app.auth.canView(menu)) {
                    var displayMenu = false;
                    if (menu.submenus) {
                        displayMenu = !menu.submenus.length;
                        let usedChildren: Array<Submenu> = [];
                        //with submenu
                        for (var c = 0; c < menu.submenus.length; c++) {
                            var submenu = menu.submenus[c];

                            //check permission
                            if (app.auth.canView(submenu)
                                && (!submenu.part || app.auth.canUse(submenu.part))) {
                                displayMenu = true;
                                usedChildren.push(submenu);
                            } else {
                                //user has no permission to view submenu
                                submenu.ignored = true;
                            }
                        }
                        //replace submenu
                        menu.submenus = usedChildren;
                    } else {
                        //--- single content
                        if (menu.part) {
                            displayMenu = app.auth.canUse(menu.part);
                        }
                    }

                    //render menu if has submenu
                    if (displayMenu) {
                        appMenus.push(menu);
                    } else {
                        menu.ignored = true;
                    }
                } else {
                    //user has no permission to show menu
                    menu.ignored = true;
                }
            }
            return appMenus;
        });
    };

    //--- inisiasi app
    function appInitFunction(addPromise: any) {
        //set lang
        app.lang.setLang('ID');

        //--- moment js
        w.moment.updateLocale('id', {
            relativeTime: {
                future: '%s lagi',
                past: '%s yg lalu',
                s: 'beberapa detik',
                m: 'semenit',
                mm: '%d menit',
                h: 'sejam',
                hh: '%d jam',
                d: 'sehari',
                dd: '%d hari',
                M: 'sebulan',
                MM: '%d bulan',
                y: 'setahun',
                yy: '%d tahun'
            }
        });
        w.moment.locale('en');

        //display user
        ui.rightbar.init({
            id: 0,
            name: "tester",
            email: "tester@app.cm"
        })

        //scroll to top
        window.scrollTo(0, 0);
    }

    //-- Setup Auth
    app.auth.handler = new auth.StaticAuth({
        accounts: [
            {
                username: "admin",
                password: "admin"
            }
        ]
    });

    // ------ START APP
    app.start({
        onLoggedIn: appInitFunction,
        getMenu: getMenu,
    });
}