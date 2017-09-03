namespace app {
    export type TPermissions = string[] | ((can: (p: string) => boolean) => boolean);
    export type TMenuDef<P> = {
        name: string,
        title?: string,
        part?: Part<P>,
        initParam?: P,
        active?: boolean,
        permissions?: TPermissions,
        icon?: string,
        children?: Submenu<any>[]
    };

    export type TSubmenuDef<P> = TMenuDef<P> & {

    };

    export type TMenuElm = HTMLElement & {
        menu: Menu
    };
    export type TSubmenuElm = HTMLButtonElement & {
        submenu: Submenu
    };

    /**
     * Application Menu
     */
    export class Menu<P = any>{
        name: string;
        title: string;
        permissions: TPermissions;
        icon: string = null;
        ignored = false;
        part: Part<P> = null;

        /**
         * Sub menu switcher
         */
        switcher: ui.Switcher;
        submenus: Submenu[] = [];
        /**
         * Current submenu
         */
        submenu: Submenu;

        initParam: P;
        active: boolean = true;
        /**
         * The headElm of menu
         */
        btn: HTMLButtonElement;
        viewWrapperElm: HTMLElement;
        view: View;

        //todo remove this
        order: number = null;

        constructor(def: TMenuDef<P>) {
            let _ = this;
            _.name = def.name;
            _.icon = def.icon;
            _.title = app.getText(def.title, def.title);
            _.part = def.part;
            _.active = def.active;
            _.initParam = def.initParam;
            _.permissions = def.permissions;
            _.submenus = def.children;
        }

        protected loadPromise: Promise<any>;
        show(path?: string) {
            state.menu(this);
            return this.doShow(path);
        }

        protected doShow(path?: string): Promise<any> {
            var _ = this;
            //if has part, load part
            if (_.part) {
                //if not loaded, load view
                if (!_.loadPromise) {
                    _.loadPromise = app.ui.loading(_.viewWrapperElm, _.part.load().then(function () {
                        //generate view
                        let view: View;
                        if (_.part.getView) {
                            view = _.part.getView(_.initParam);
                        } else {
                            view = new View(_.part.getViewElm(_.initParam));
                        }
                        _.view = view;
                        _.viewWrapperElm.appendChild(view.elm);

                        app.scan(view.elm);
                        //init view from part
                        if (_.part.initView) {
                            _.part.initView(view, _.initParam);
                            //scan twice, if load return new elm
                            app.scan(view.elm);
                        }

                        //init view it self
                        view.init(path);
                    }), { loadingText: app.getText('loading') });
                }

                //after load, let view handle path
                return _.loadPromise.then(function () {
                    if (_.view) {
                        _.view.show(path);
                    }
                    return PROMISE_NULL;
                });
            } else {
                //delegate to submenu
                var submenus = _.submenus;
                var activeSubmenu: Submenu = null;
                let submenuRoute: string;

                if (path) {
                    //if has path, decide by path
                    //remove slash
                    let result = /[^/]+/g.exec(path);
                    if (result) {
                        let submenuName = result[0];
                        submenuRoute = path.substr(result.index + submenuName.length + 1);
                        for (let i = 0; i < submenus.length; i++) {
                            let submenu = submenus[i];
                            if (submenu.name == submenuName) {
                                activeSubmenu = submenu;
                                break;
                            }
                        }
                    }
                }

                //cannot resolve from path, find submenu from last time
                if (!activeSubmenu) {
                    if (_.submenu) {
                        activeSubmenu = _.submenu;
                    }
                }

                //no recent submenu, find with active attribute
                if (!activeSubmenu) {
                    var sm = submenus.length - 1;
                    for (; sm >= 0; sm--) {
                        if (submenus[sm] && (activeSubmenu = submenus[sm]).active) break;
                    }
                }

                //choose first not ignored submenu
                if (!activeSubmenu) {
                    while (sm < submenus.length && !activeSubmenu) {
                        let submenu = submenus[sm++];
                        if (submenu.ignored) {
                            activeSubmenu = submenu;
                        }
                    }
                }

                //if there is active submenu, trigger it
                if (activeSubmenu) {
                    _.submenu = activeSubmenu;

                    //trigger submenu
                    _.switcher.headOn(activeSubmenu.btn);
                    return activeSubmenu.show(submenuRoute);
                }
            }

            return PROMISE_NULL;
        }
    }

    /**
     * Application Menu
     */
    export class Submenu<P = any> extends Menu {
        //todo remove this
        order: number = null;

        /**
         * Parent menu
         */
        menu: Menu;

        constructor(def: TSubmenuDef<P>) {
            super(def);
            let _ = this;
        }

        show(path?: string): Promise<any> {
            var _ = this;
            state.submenu(_);
            //set main menu toggler title
            s(ui.menus.btn, "b").innerHTML = _.title;
            //do the show
            return _.doShow(path);
        }
    }
}