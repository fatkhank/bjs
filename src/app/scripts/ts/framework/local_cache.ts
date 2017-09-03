namespace app {
    /**
     * url
     * opt : Option
     * - expire_time    :   waktu expire tiap entry
     * - fetch(key)     :   fungsi untuk mengambil data entry
     * - fetchAll()     :   fungsi untuk mengambil semua data
     * - notfound       :   default nilai entry jika tidak ditemukan
     * - accept(data)   : fungsi yg mengembalikan true, jika data hasil fetch dianggap valid
     */
    export class Cache {
        /**
         * Nama cache
         */
        name: string;

        /**
         * Data cache holder. Struktur masing2 entry:
         * - data  : nilai entry
         * - queue  : antrian callback
         * - exp    : tanggal expire entry
         */
        db: any;

        opt: Opt;

        /**
         * Menyimpan daftar item
         */
        list = [];
        /**
         * Tanggal semua entry expired
         */
        allExpired = new Date();
        constructor(name: string, opt) {
            var _ = this;

            if (!opt) opt = new Opt();
            if (!opt.key) opt.key = 'id';
            _.opt = opt;
            _.name = name;
            opt.expire_time;

            /**
             * Data cache holder. Struktur masing2 entry:
             * - data  : nilai entry
             * - queue  : antrian callback
             * - exp    : tanggal expire entry
             */
            _.db = {};

            /**
             * Menyimpan daftar item
             */
            _.list = [];

            _.allExpired = new Date();

            if (opt.seed) _.addAll(opt.seed);
        }
        /**
         * Baca dari penyimpanan local. return this
         */
        readLocal() {
            var _ = this;
            //baca dari local storage
            _.db = JSON.parse(localStorage.getItem('lc_' + _.name)) || {};

            //bersihkan data
            for (var u in _.db) {
                var uc = _.db[u];
                uc.exp = new Date(uc.exp);
            };

            //fill list
            _.list = [];
            for (var i in _.db) _.list.push(_.db[i]);

            return _;
        };

        /**
         * Simpan ke penyimpanan local. return this;
         */
        saveLocal() {
            var _ = this;
            localStorage.setItem('lc_' + _.name, JSON.stringify(_.db));
            return _;
        };

        /**
         * Bersihkan cache. return this.
         */
        clear() {
            var _ = this;
            _.db = {};
            _.list = [];
            _.allExpired = null;
            return _;
        };
        /**
         * Tambahkan data ke cache.
         * - key    : id
         * - data   : data
         * return this.
         */
        add(key, item) {
            var _ = this;
            if (!_.db[key]) _.list.push(item);
            _.db[key] = new Entry(item, expiredInMinutes(_.opt.expire_time));
            return _;
        };

        /**
         * Menambahkan banyak data ke db
         */
        addAll(items) {
            var _ = this;
            for (var s = 0; s < items.length; s++) {
                var item = items[s];
                var id = item[_.opt.key];
                _.list.push(item);
                _.db[id] = new Entry(item, expiredInMinutes(_.opt.expire_time));
            }
        };


        /**
         * Mendapatkan cache untuk key tertentu.
         * - key
         * - callback(result, key, is_fetch)   : fungsi jika entry sudah didapat
         * - force      : paksa fetch entry
         */
        get(key, force = false, param:any = null) {
            var _ = this;
            var entry = _.db[key];

            if (!entry || force) {
                return _.fetch(key, param);
            } else if (entry.promise) {
                return entry.promise; //jika sudah diminta sebelumnya, antrikan
            } else if (entry.exp < new Date()) {
                return _.fetch(key, param);//expired
            } else {
                //check if required param exist
                if (param) {
                    if (typeof param == 'string') {
                        param = { props: [param] };
                    } else if (param instanceof Array) {
                        param = { props: param };
                    }
                    return _.fetch(key, param, true);
                } else {
                    return new (<any>window).Promise(function (done, fail) {
                        done(entry.data); //found
                    });
                }
            };
        };

        /**
         * Mendapat cache untuk semua key.
         */
        getMany(force = false, param: any = null, skip = 0, count = Number.MAX_VALUE) {
            var _ = this;
            var now = new Date();
            if (force || _.allExpired < now && _.opt.fetchAll) {
                //if expired, fetch again
                return _.opt.fetchAll(param, skip, count).then(function (data) {
                    //reseed database
                    _.db = {};
                    _.list = [];
                    _.addAll(data);
                    _.allExpired = expiredInMinutes(_.opt.expire_time);

                    if (_.opt.autosave === true) _.saveLocal();

                    return data;
                });
            } else {
                //return cache
                return new (<any>window).Promise(function (done, fail) {
                    var result = _.list;
                    if (skip > 0 && count < _.list.length) {
                        //get partial
                        result = [];
                        var until = Math.min(count || 99999, _.list.length);
                        while (skip < until) {
                            result.push(_.list[skip]);
                            skip++;
                        }
                    }
                    done(result);
                });
            }
        };

        /**
         * fetch data untuk key tertentu
         */
        fetch(key: string, param: any, patch = false) {
            var _ = this;
            var entry = _.db[key] || (_.db[key] = new Entry());
            return _.opt.fetch(key, param)
                .then(function (data) {
                    //cek apakah data diterima
                    if (_.opt.accept && !_.opt.accept(data)) return;
                    
                    if (patch && entry.data) {
                        //patch
                        for (var d in data) {
                            entry.data[d] = data[d];
                        }
                    } else {
                        //replace
                        entry.data = data;

                        //atur expiracy
                        entry.exp = expiredInMinutes(_.opt.expire_time);
                    }

                    //bersihkan queue
                    entry.promise = null;

                    if (_.opt.autosave) _.saveLocal();

                    return data;
                });
        };
    }

    class Entry {
        constructor(data = null, exp = null) {
            this.data = data;
            this.exp = exp;
        }
        data;
        exp;
        promise = null;
    }

    class Opt {
        seed = null;
        fetch = null;
        fetchAll = null;

        accept = <(data) => boolean>null;

        /**
         * Default 5 minute
         */
        expire_time = 5;

        /**
         * Properti yang digunakan sebagai key
         */
        key = 'id';

        /**
         * Auto save to local
         */
        autosave = false;
    }

    function expiredInMinutes(min): Date {
        var d = new Date();
        d.setMinutes(d.getMinutes() + min);
        return d;
    }
}