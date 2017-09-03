namespace app {
    const TAG_INCLUDE = "INCLUDE";
    function includeHtml(path, holderElm) {
        console.log("include ", path);
        //prepare part url
        let url = viewUrl(<any>ENV.part_url + path);
        if (!url.startsWith('http')) {
            url = app.viewUrl(url);
            if (!url.endsWith('.html')) url += (ENV.app_debug ? '' : '.min') + '.html';
        }


        //fetch all required
        return app.asPromise(function (done, fail) {
            return window.$(holderElm).load(url, function (response, status) {
                if (status == 'error') {
                    console.error('Cannot include html ', path);
                    app.ui.notifError('Cannot fetch part ' + url, true);
                } else if (done) {
                    console.log("include done", path);
                    done(holderElm);
                }
            });
        });
    }

    function findIncludedPart(elm) {
        //fetch inluded part
        let includedPromises = [];
        let tagElms = sa(elm, TAG_INCLUDE);
        for (var i = 0; i < tagElms.length; i++) {
            let tagElm = tagElms[i];
            let url = attr(tagElm, "src");
            let includedHolderElm = document.createElement('div');
            replace(tagElm, includedHolderElm);

            includedPromises.push(includeHtml(url, includedHolderElm).then(function (includedHolderElm) {
                //recursive scan
                return findIncludedPart(includedHolderElm);
            }));
        }

        //wait until all included html finish
        return promiseAll(includedPromises);
    }

    /**
     * Application part
     */
    export class Part<T = any> {
        constructor(url: string, permissions?: Array<string> | ((any) => boolean), uses: Array<Part> = []) {
            this.url = url;
            this.permissions = permissions;
            this.uses = uses;
        }
        url;
        permissions: Array<string> | ((any) => boolean);

        holderElm: HTMLElement;

        //required part
        private uses: Array<Part> = [];

        onload = function (holderElm: HTMLElement) { };

        /**
         * View sample
         */
        viewSample: HTMLElement = null;

        /**
         * Generate new view elm. Default = clone first child elm from view wrapper
         * @param initParam
         */
        getViewElm(initParam?: T): HTMLElement {
            if (!this.viewSample) {
                this.viewSample = <HTMLElement>this.holderElm.firstElementChild;
                this.viewSample.remove();
            }
            return app.clone(this.viewSample);
        };

        /**
         * Generate view
         * @param initParam
         */
        getView: (initParam?: T) => View;

        /**
         * Initiate new view
         * @param view
         * @param initParam
         */
        initView(view: View, initParam: T): void { };

        private loadPromise: Promise<any>;
        load() {
            var _ = this;

            //load once
            if (!_.loadPromise) {
                //fetch self & all dependency
                var promises: Array<Promise<any>> = [_.fetch()];

                //fetch dependency
                for (var r = 0; r < _.uses.length; r++) {
                    promises.push(_.uses[r].load());
                }

                _.loadPromise = window.Promise.all(promises).then(function () {
                    //scan first
                    app.scan(_.holderElm);

                    _.onload(_.holderElm);
                });
            }

            return _.loadPromise;
        }

        private fetchPromise: Promise<any> = null;
        private fetch() {
            var _ = this;

            //if fetch executed
            if (_.fetchPromise != null) return _.fetchPromise;

            //fetch
            var holderElm = document.createElement('div');
            document.getElementById('appParts').appendChild(holderElm);
            _.holderElm = holderElm;

            //prepare part url
            var url = <any>ENV.part_url + _.url;
            if (!url.startsWith('http')) {
                url = app.viewUrl(url);
                if (!url.endsWith('.html')) url += (ENV.app_debug ? '' : '.min') + '.html';
            }
            holderElm.id = 'holder_' + url.replace(' ', '_');

            //fetch all required
            var fetchPromises = [app.asPromise(function (done, fail) {
                return window.$(holderElm).load(url, function (response, status) {
                    if (status == 'error') {
                        console.error('Cannot load part ', _);
                        app.ui.notifError('Cannot fetch part ' + _.url, true);
                    } else if (done) {
                        //fetch inluded part
                        return findIncludedPart(holderElm).then(function () {
                            done(holderElm, _);
                        });
                    }
                });
            })];

            //fetch dependency
            for (var r = 0; r < _.uses.length; r++) {
                var part = _.uses[r];
                if (!part) {
                    console.error('Unknown part dependency on index ' + r, _);
                    return;
                }
                fetchPromises.push(_.uses[r].fetch());
            }

            return _.fetchPromise = window.Promise.all(fetchPromises);
        }
    }
}