//--- form mapper
function AppMapper() {

}
(function () {
    var counter = 1;

    app.mapper = function (mapperFunc) {
        var obj = {};
        obj.id = 'm' + counter++;

        obj.map = mapperFunc || function (formElm, mapParam) { return {}; };
        obj.get = function (formElm, forceRemapWithParam) {
            //for intellisense
            if (!formElm) return obj.map(formElm, forceRemapWithParam);

            var form = (formElm.pam || (formElm.pam = {}))[obj.id];
            if (!form || forceRemapWithParam) {
                form = formElm.pam[obj.id] = obj.map(formElm || {}, forceRemapWithParam);
            }
            return form;
        };

        function mapData(form, data, parent, propName) {
            if (form instanceof Array) {
                if (data instanceof Array) parent[propName] = data;
            } else if (typeof form == 'object') {
                if (form.setVal) {
                    //has val override
                    form.setVal(data);
                } else if (form.val) {
                    //has val override
                    form.val(data);
                } else if (form.constructor.name.startsWith('HTML')) {
                    if (data !== null && data.constructor.name.startsWith('HTML')) {
                        form.innerHTML = '';
                        form.appendChild(data);
                    }else form.innerHTML = data;
                } else {
                    //set individoal object props
                    for (var d in data) {
                        var value = data[d];
                        
                        var input = form[d], obj = form;
                        if (input === undefined) {
                            input = (obj = form._set) && form._set[d];//trust me
                        }

                        //direct prop
                        if (input !== undefined) {
                            if (input == null) {
                                obj[d] = value;
                            } else {
                                if (input.setVal) input.setVal((value === undefined) ? '' : value);
                                else if (input.val) {
                                    input.val((value === undefined) ? '' : value);
                                } else if (typeof input == 'function') {

                                } else if (typeof input == 'object') {
                                    mapData(input, value, form, d);
                                } else {
                                    //empty variable
                                    obj[d] = value;
                                }
                            }
                        }
                    }
                }
            } else if (typeof form != 'function') {
                //pure value
                if (form.setVal) form.setVal((data === undefined) ? '' : data);
                else if (form.val) form.val((data === undefined) ? '' : data);
            }
        }

        obj.setData = function (formOrElm, data) {
            var form = formOrElm;
            if (formOrElm.constructor.name.startsWith('HTML')) {
                form = obj.get(formOrElm);
            }

            mapData(form, data);
        }

        obj.getData = function (formOrElm, additionalPayload, option) {
            if (!option) option = {};
            var form = formOrElm;
            if (formOrElm.constructor.name.startsWith('HTML')) {
                form = obj.get(formOrElm);
            }
            //option.withSkip tidak dipake, karena _skip selalu hilang
            var payload = extractData(form, 5, option.withSet, option);
            if (additionalPayload) for (var name in additionalPayload) payload[name] = additionalPayload[name];

            return payload;
        };

        obj.getValidData = function (formOrElm, ifValid, someInvalid, additionalPayload, option) {
            if (!option) option = {};
            var form = formOrElm;
            if (formOrElm.constructor.name.startsWith('HTML')) {
                form = obj.get(formOrElm);
            }
            //option.withSkip tidak dipake, karena _skip selalu hilang
            var payload = extractData(form, 5, option.withSet, option);
            if (additionalPayload) for (var name in additionalPayload) payload[name] = additionalPayload[name];

            return payload;
        };

        function extractData(form, depth, includeSet, option, invalid) {
            if (depth == 0) return null;
            if (form instanceof Array) {
                var payload = [];
                for (var f = 0; f < form.length; f++) {
                    var prop = form[f];

                    var type = typeof prop;
                    if (prop == null || (type != 'object' && type != 'function')) {
                        payload.push(prop);
                    } else {
                        if (invalid && prop.validate) {
                            var validateRes = prop.validate();
                            if (validateRes) invalid();
                        }
                        if (prop.getVal) {
                            payload.push(prop.getVal(option));
                        } else if (prop.val) {
                            payload.push(prop.val());
                        } else if (!prop.constructor.name.startsWith('HTML')) {
                            //parse if not an html element
                            payload.push(extractData(prop, depth - 1, includeSet, option));
                        }
                    }
                }
                return payload;
            } else if (typeof form == 'object') {
                //if has valoverride, return value
                if (form.getVal) return form.getVal(option);
                if (form.val) return form.val();

                //parse each props
                var payload = {};
                for (var f in form) {
                    if (f == '_ignore' || f == '_skip' || (f == '_set' && !includeSet)) continue;

                    if (f == '_get') {
                        for (var f in form._get) {
                            var prop = form._get[f];
                            var type = typeof prop;
                            if (prop == null || (type != 'object' && type != 'function')) {
                                payload[f] = prop;
                            } else if (prop.val) {
                                payload[f] = prop.val();
                            } else if (!prop.constructor.name.startsWith('HTML')) {
                                //parse if not an html element
                                payload[f] = extractData(prop, depth - 1, includeSet, option);
                            }
                        }
                        continue;
                    }
                    var prop = form[f];
                    var type = typeof prop;
                    
                    if (prop == null || (type != 'object' && type != 'function')) {
                        //pure value
                        payload[f] = prop;
                    } else if (prop.getVal) {
                        payload[f] = prop.getVal(option);
                    } else if (prop.val) {
                        payload[f] = prop.val();
                    } else if (!prop.constructor.name.startsWith('HTML')) {
                        //parse if not an html element
                        payload[f] = extractData(prop, depth - 1, includeSet, option);
                    }
                }
                return payload;
            } else if (typeof form == 'function') {
                return form();
            }

            //pure value
            return form;
        }

        return obj;
    };

    (function () {
        function ListMapper(option) {
            this.elms = [];
            this.opt = option;
        }

        (function (proto) {
            proto.val = function (data) {
                var _ = this;
                if (data !== undefined) {
                    _.setData(data);
                } else return _.getData();
            };

            proto.setData = function (data) {
                var _ = this;
                _.elms = [];
                _.clear();

                for (var i = 0; i < data.length; i++) {
                    var itemElm = app.clone(_.opt.sampleElm);
                    if (_.opt.mapper) _.opt.mapper;
                    if (_.opt.setData) _.opt.setData(itemElm, data[i]);
                    _.opt.parentElm.appendChild(itemElm);
                    _.elms.push(itemElm);
                }
            }

            /**
             * Clear content
             */
            proto.clear = function () {
                app.empty(this.opt.parentElm, function (child) {
                    return app.hasClass(child, 'persist');
                });
            };

            proto.getData = function () {
                var _ = this;
                var data = [];
                for (var i = 0; i < _.elms.length; i++) {
                    data.push(_.opt.getData(_.elms[i]));
                }
                return data;
            }

        })(ListMapper.prototype);

        app.listMapper = function (option) {
            //default ambil anak pertama sebagai sample elm
            if (!option.sampleElm) {
                option.sampleElm = option.parentElm.firstElementChild;
            }
            return new ListMapper(option);
        };
    })();
})(app);