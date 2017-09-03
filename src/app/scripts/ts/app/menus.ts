namespace app {
    let parts = app.parts;

    function menu<P>(def: TMenuDef<P>) {
        return new Menu<P>(def);
    };

    function sub<P>(def: TSubmenuDef<P>) {
        return new Submenu<P>(def);
    };

    //-------------------- MENUS -----------------------
    /**
     * Each title and name property of menus and submenus will be replaced with its translation.
     * The original value of title and name will be used as key to determine correct translation.
     * If translation is not found, original value of title and name will be used instead.
     */

    /**
     * List of apps menu.
     */
    export var menus: Array<Menu> = [
        menu({
            name: "home",
            title: "home",
            icon: "fa-home",
            part: parts.underConstruction
        }),
        menu({
            name: "menu2",
            title: "Second Menu",
            icon: "fa-bar-chart",
            children: [
                sub({
                    name: "sm1",
                    title: "Sample Page Menu 2 Submenu 1",
                    part: parts.underConstruction,
                    permissions: [
                        //part permissions here
                    ]
                }),
                sub({
                    name: "sm2",
                    title: "Sample Page Menu 2 Submenu 2",
                    part: parts.underConstruction,
                    permissions: [
                        //part permissions here
                    ]
                }),
                sub({
                    name: "sm3",
                    title: "Sample Page Menu 3 Submenu 2",
                    part: parts.underConstruction,
                    permissions: [
                        //part permissions here
                    ]
                }),
            ]
        }),
        menu({
            name: "about_us",
            title: "about_us",
            icon: "fa-info-circle",
            children: [
                sub({
                    name: "sm1",
                    title: "2 Submenu 1",
                    part: parts.underConstruction,
                    permissions: [
                        //part permissions here
                    ]
                }),
                sub({
                    name: "sm2",
                    title: "Submenu 2",
                    part: parts.underConstruction,
                    permissions: [
                        //part permissions here
                    ]
                }),
            ]
        }),
    ];
}