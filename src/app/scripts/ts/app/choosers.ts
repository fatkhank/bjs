namespace app {
    var UIChooser = ui.Chooser;

    export var choosers = {
        //-----
        supplier: new UIChooser<any>("supplier", {
            columns: [
                { title: app.getText("code"), val: "code" },
                { title: app.getText("name"), val: "name" }
            ],
            fetch: function (param, fromUser) {
                if (!param) param = { skip: 0, count: 10 };
                return app.cache.supplier.getMany(fromUser, param, param.skip, param.count);
            },
            key: "id",
            display: function (row) { return "(" + row.code + ") - " + row.name; },
            paging: 10,
            search: {
                txt: app.getText("name"),
                filterParam: function (value, param) {
                    param.code_or_name = value;
                }
            },
            focus: "search",
        }),
    };
};