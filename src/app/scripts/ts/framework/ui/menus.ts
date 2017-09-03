namespace app.ui.menus {
    const appBody = app.bodyElm;
    const appHeader = app.headElm;

    const APP_MENU_IDENTIFIER = "p-menu";
    const mainMenuContainer = document.getElementById("appMainMenus");
    const mainMenuSample = app.grabSample(mainMenuContainer, APP_MENU_IDENTIFIER);;

    const contentContainer = app.bodyElm;
    const contentWSubmenuSample = app.grabSample("p-app-content.vertical-menu");
    const contentDefaultSample = app.grabSample("p-app-content");

    const submenuSample = app.grabSample(contentWSubmenuSample, "p-menu");
    const subcontentSample = app.grabSample(contentWSubmenuSample, "p-content");

    export var switcher = ui.switcher("appContent");

    /**
     * Menu toggler
     */
    export var btn: HTMLButtonElement = s<HTMLButtonElement>(mainMenuContainer, ".toggler")

    /**
     * Check if menu drawer is shown
     */
    export function isShown() {
        return app.hasClass(app.bodyElm, "showmenu");
    }

    /**
     * Toggle menu drawer
     */
    export function toggle() {
        show(!isShown());
    }

    /**
     * Set visibility of menu drawer
     * @param isVisible
     */
    export function show(isVisible: boolean) {
        app.setClass(appBody, "showmenu", isVisible);
        app.setClass(appHeader, "showmenu", isVisible);
        app.setClass(btn, "active", isVisible);
    }

    /**
     * Display the menu
     * @param appMenus 
     */
    export function init(appMenus: Array<app.Menu>) {
        for (var m = 0; m < appMenus.length; m++) {
            var menu = appMenus[m];
            menu.order = m;

            //render menu
            let menuClone: any = app.clone(mainMenuSample);
            s(menuClone, "a").innerHTML = menu.title;
            //tampilkan ikon
            if (menu.icon) {
                let icons = menu.icon.split(" ");
                for (var c = 0; c < icons.length; c++) {
                    app.setClass(s(menuClone, "i"), icons[c]);
                }
            } else s(menuClone, "i").remove();
            mainMenuContainer.appendChild(menuClone);
            menu.btn = menuClone;
            menuClone.menu = menu;

            //create container
            let contentClone: HTMLElement;
            if (menu.submenus) {
                //with submenus
                var submenuSwitcher = ui.switcher("submenus_" + menu.name);
                menu.switcher = submenuSwitcher;

                //setup  elms
                contentClone = app.clone(contentWSubmenuSample);
                var submenuContainer = s(contentClone, ".menus");
                var subcontentContainer = s(contentClone, ".contents");

                //tampilkan judul
                s(submenuContainer, ".title").innerHTML = menu.title;

                for (var c = 0; c < menu.submenus.length; c++) {
                    var submenu = menu.submenus[c];

                    //add toggle
                    var submenuClone: any = app.clone(submenuSample);

                    s(submenuClone, "a").innerHTML = submenu.title;
                    if (submenu.icon) app.setClass(s(submenuClone, "i"), <string>submenu.icon);
                    else s(submenuClone, "i").remove();
                    submenuContainer.appendChild(submenuClone);
                    submenuClone.submenu = submenu;
                    submenu.btn = submenuClone;
                    submenu.menu = menu;
                    submenu.order = c;

                    //add submenu control
                    app.onKeyEnter(submenuClone, function (btn) { btn.click(); }, true);
                    app.click(submenu.btn, function (submenuElm) {
                        var submenu: Submenu = (<TSubmenuElm>submenuElm).submenu;

                        //push state only when submenu changed
                        let pushState = submenu != state.submenu();

                        submenu.menu.submenu = submenu;

                        //mark as last route
                        app.userConfig.add("menu", submenu.menu.name + "/" + submenu.name).saveLocal();

                        submenu.show();

                        if (app.hasClass(appBody, "showmenu")) {
                            //hide menus
                            menus.show(false);

                            //select menu content
                            switcher.headOn(submenu.menu.btn, true);
                        }

                        //push to history
                        if (pushState) {
                            state.push();
                        }
                    });

                    //add content
                    var subcontentClone = app.clone(subcontentSample);
                    subcontentContainer.appendChild(subcontentClone);
                    submenu.viewWrapperElm = subcontentClone;

                    submenuSwitcher.add(subcontentClone, submenuClone, c);
                }
            } else {
                //--- single content
                contentClone = app.clone(contentDefaultSample);
                menu.viewWrapperElm = contentClone;
            }

            app.onKeyEnter(menuClone, function (btn) { btn.click(); }, true);//add nav horizontal
            app.click(menuClone, function (btn) {
                let menu = (<TMenuElm>btn).menu;
                //push state only when menu changed
                let pushState = menu != state.menu();

                //mark as last route
                app.userConfig.add("menu", menu.name).saveLocal();

                //show menu
                menu.show();
                //if push, push
                if (pushState) {
                    state.push();
                }
            });

            //set toggle
            switcher.add(contentClone, menuClone, m);
            contentContainer.appendChild(contentClone);
        }

        //add menu nav controls and toggler
        app.onArrowRight(appHeader, function (header) {
            var menu = s(header, APP_MENU_IDENTIFIER + ":focus");
            (<any>menu.nextElementSibling || menu).focus();
        }, true);
        app.onArrowLeft(appHeader, function (header) {
            var menu = s(header, APP_MENU_IDENTIFIER + ":focus");
            (<any>menu.previousElementSibling || menu).focus();
        }, true);

        //add small screen menu toggler
        app.click(btn, toggle, true);

        //add submenu toggler
        var submenuTogglers = sa(appBody, ".vertical-menu>.menus>button.toggler");
        function toggleSubmenu() {
            var next = !app.hasClass(appBody, "hide-submenu");
            app.setClass(appBody, "hide-submenu", next);
            app.userConfig.add("submenu_hidden", next).saveLocal();
        }

        for (var t = 0; t < submenuTogglers.length; t++) {
            app.click(submenuTogglers[t], toggleSubmenu, true);
        }
        //set to previous
        app.userConfig.get("submenu_hidden").then(function (hidden) {
            app.setClass(appBody, "hide-submenu", hidden === true);
        });
    }
}