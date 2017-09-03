namespace app{
    export var cache:any = {};

    function lazyFromPromise(promise) {
        return promise.then(function (data) {
            return data.data;
        });
    }
    
    app.cache.supplier = new app.Cache("supplier", {
        fetch: function (id, param) {
            if (!param.props) param.props = ["value", "code"];
            if (!param.sortby) param.sortby = ["code_asc", "name_asc"];
            return xget(app.apiUrl("suppliers/" + id), param);
        },
        fetchAll: function (param, skip, count) {
            if (!param.props) param.props = ["code", "name"];
            if (!param.sortby) param.sortby = ["code_asc", "name_asc"];
            return xget(app.apiUrl("suppliers"), param);
        }
    }).readLocal();

    //-----
    app.cache.currency = new app.Cache("currency", {
        key: "code",
        fetch: function (code, param) {
            if (!param) param = {};
            if (!param.props) param.props = ["code", "symbol", "description"];
            if (!param.sortby) param.sortby = ["code_asc", "description_asc"];
            return xget(app.apiUrl("currency/" + code), param);
        },
        fetchAll: function (param, skip, count) {
            if (!param.props) param.props = ["code", "symbol", "description"];
            if (!param.sortby) param.sortby = ["code_asc", "description_asc"];
            return xget(app.apiUrl("currency"), param);
        },
        //autosave local
        autosave: true,
    }).readLocal();

    //------
    app.cache.stock_item = new app.Cache("stock_item", {
        fetch: function (id, param) {
            return xget(app.apiUrl("stock_items/" + id), param);
        },
        fetchAll: function (param, skip, take) {
            if (param) {
                if (param.skip !== undefined) param.skip = skip;
                if (!param.count) param.count = take;
                param.props = ["tree", "parent_id", "item_sku", "item_name"];
            }
            if (!param.sortby) param.sortby = ["item_sku_asc"];

            function flatten(src, dest, level) {
                for (var i = 0; i < src.length; i++) {
                    var item = src[i];
                    item.level = level;
                    dest.push(item);

                    if (item.children) {
                        if (item.children.length) flatten(item.children, dest, level + 1);
                        delete item.children;
                    }
                }
            }

            var result = xget(app.apiUrl("stock_items"), param).then(function (response) {
                //flatten tree
                var flat = [];
                flatten(response.data, flat, 0);
                response.data = flat;

                return response;
            });

            return lazyFromPromise(result);
        },
        autosave: false,
    });//dont save to local

    //-------------------------
    app.cache.refdata = new app.Cache("ref_data", {
        fetch: function (id, param) {
            if (!param) param = {};
            if (!param.props) param.props = ["code", "value"];
            if (!param.sortby) param.sortby = ["code_asc", "value_asc"];
            return xget(app.apiUrl("ref_data/" + id), param);
        },
        autosave: true,//autosave local
    }).readLocal();

    app.cache.mdCounty = new app.Cache("md_county", {
        fetch: function (parent_id, param) {
            param.parent_id = parent_id;
            if (!param.props) param.props = ["code", "value"];
            if (!param.sortby) param.sortby = ["code_asc", "value_asc"];
            return xget(app.apiUrl("ref_data/COUNTY"), param);
        },
        fetchAll: function (param, skip, take) {
            if (!param) param = {};
            if (param.skip !== undefined) param.skip = skip || 0;
            if (!param.count) param.count = take;
            if (!param.props) param.props = ["code", "value"];
            if (!param.sortby) param.sortby = ["code_asc", "value_asc"];
            return lazyFromPromise(xget(app.apiUrl("ref_data/COUNTY"), param));
        },
        autosave: true,
    }).readLocal();
    app.cache.mdCity = new app.Cache("md_city", {
        fetch: function (parent_id, param) {
            param.parent_id = parent_id;
            if (!param.props) param.props = ["code", "value"];
            if (!param.sortby) param.sortby = ["code_asc", "value_asc"];
            return xget(app.apiUrl("ref_data/CITY"), param);
        },
        fetchAll: function (param, skip, take) {
            if (!param) param = {};
            if (param.skip !== undefined) param.skip = skip || 0;
            if (!param.count) param.count = take;
            if (!param.props) param.props = ["code", "value"];
            if (!param.sortby) param.sortby = ["code_asc", "value_asc"];
            return lazyFromPromise(xget(app.apiUrl("ref_data/CITY"), param));
        },
        autosave: true,
    }).readLocal();

   
    //----
    app.cache.employees = new app.Cache("kuku_employee", {
        fetch: function (id, param) {
            if (!param.sortby) param.sortby = ["name_asc"];
            return xget(app.apiUrl("users"), { can: id, props:"all"});
        },
        autosave: true,//autosave local
    }).readLocal();

    //----
}
