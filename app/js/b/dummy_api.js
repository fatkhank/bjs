function DummyAPI(seed, opt) {
    this.option = opt;

    this.db = {};
    if (seed) {
        for (var url in seed) {
            var rows = seed[url];
            url = transformUrl(url);
            var dbres = this.db[url] = new Resource();
            for (var r in rows) {
                var row = rows[r];
                dbres.list[row.id] = row;
                //update id
                if (row.id > dbres.lastId) dbres.lastId = row.id;
            }
        }
    }

    this.get = function (url) {
        url = transformUrl(url);
        //        console.log('GET:' + url);

        //coba ambil id
        var id = getId(url);
        var result = null;
        if (id) {
            url = getResourceUrl(url);
            var resource = this.db[url];
            //detail
            var item = resource.list[id];
            result = item;
        } else {
            var resource = this.db[url];
            //index
            var result = [];
            for (var id in resource.list) {
                result.push(resource.list[id]);
            }
            result = {
                data: result,
                next: url
            };
        }

        console.log('GET:' + url, result);
        return wrap(result);
    };

    this.post = function (url, data) {
        url = transformUrl(url);
        console.log('POST:' + url, data);

        var resource = this.db[url] || new Resource();
        var id = ++resource.lastId;
        //create id
        data.id = id;

        resource.list[id] = data;

        return wrap({ 'success': true });
    };

    this.put = function (url, data) {
        url = transformUrl(url);
        console.log('PUT:' + url, data);

        var id = getId(url);
        var resource = this.db[getResourceUrl(url)] || new Resource();
        if (resource) {
            var row = resource.list[id];
            console.log(id, url, row, data);
            for (var d in data) {
                row[d] = data[d];
            }
            console.log(200, row, data);
        }

        return wrap({ 'success': true });
    };

    this.delete = function (url) {
        url = transformUrl(url);
        console.log('DELETE:' + url);

        var id = getId(url);
        var resource = this.db[getResourceUrl(url)];
        if (resource) delete resource.list[id];

        return wrap({ 'success': true });
    };

    this.lazyPaging = function (list, url) {
        return {
            data: list,
            next: url + '/next',
            prev: url + '/prev'
        };
    };

    this.customGet = {};
    this.customPost = {};
    this.customPut = {};
    this.customDelete = {};

    this.handleGet = function (url, func) { customGet[url] = func };
    this.handlePost = function (url, func) { customPost[url] = func };
    this.handlePut = function (url, func) { customPut[url] = func };
    this.handleDelete = function (url, func) { customDelete[url] = func };

    function Resource() {
        this.list = {};
        this.lastId = 0;
    }

    function wrap(result) {
        return new Promise(function (done, fail) {
            if (opt.delay) {
                setTimeout(function () {
                    done(result);
                }, opt.delay);
            } else done(result);
        });
    }

    function transformUrl(url) {
        if (!url.endsWith('/')) url += '/';
        return url.toLowerCase().replace(' ', '_');
    };

    function getResourceUrl(url) {
        return url.substring(0, url.length - (/[0-9]+\/?$/).exec(url)[0].length)
    }
    this.getResourceUrl = getResourceUrl;

    function getId(url) {
        var id = (
            (/\/[0-9]+\/?\?$/).exec(url)//with query string
            || (/\/[0-9]+\/?$/).exec(url)
        );
        return id ? parseInt(id[0].replace(/[^0-9]/g, '')) : null;
    }
    this.getUrlId = getId;
}