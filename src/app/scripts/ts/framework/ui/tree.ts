namespace app.ui {
    "use strict";

    var sample = app.grabSample("p-tree")
        , emptyLiSample = app.grabSample(sample, "ul>li")
        , TREE_IS_NEW_CLASSNAME = "is-new-tree"
        , SOFTREMOVE_CLASSNAME = "is-removed"
        , CHILDREN_PROPNAME = "children"
        , SELECTOR_TREE = ".tree"
        , SELECTOR_BTN_CARET = "[btn=tree-caret]"
        , SELECTOR_BTN_ADD = "[btn=tree-add]"
        , SELECTOR_BTN_UNREMOVE = "[btn=tree-unremove]"
        , SELECTOR_BTN_REMOVE = "[btn=tree-remove]"
        ;

    type TTreeOpt<V> = TInputOpt<V> & {
        setVal?: (<V>(liElm: HTMLElement, item) => V) | {
            before: <V>(liElm: HTMLElement, item) => V,
            after: <V>(liElm, item, beforeResult: V) => void,
        },
        getVal?: (rowElm: HTMLElement) => V,
        add?: ((liElm?: HTMLElement) => void | boolean) | {
            before: (liElm?: HTMLElement) => void | boolean,
            after: (liElm?: HTMLElement) => void,
        },
        softRemove?: true,
        remove?: (rowElm: HTMLElement, isNewEntry: boolean, remove: (doRemove: boolean) => void) => void
    };

    export class Tree<V = any> extends Input<V[]> {
        _opt: TTreeOpt<V>;
        private liSample: HTMLElement;
        constructor(rootElm, rowSample) {
            super(rootElm);
            
            //rangkai liSample
            let liSample = this.liSample = app.clone(emptyLiSample);
            app.s(liSample, "div>div").appendChild(rowSample);
        }
        opt(option: TTreeOpt<V>) {
            var _ = this;
            _._opt = option;
            if (option) {
                //add control
                _.addControl(_.elm);
            }
            return super.opt(option);
        }
        val(data?: V[]): V[] {
            if (data !== undefined) {
                this.setVal(data);
            } else return this.getVal();
        }

        /**
         * Atur nilai tree
         */
        setVal(data: V[]) {
            this.recursiveSetVal(this.elm, data);
        }
        private recursiveSetVal(treeElm: HTMLElement, data: V[]) {
            let _ = this;
            var option = _._opt;
            var ulElm = app.s(treeElm, "ul");
            let liSample = _.liSample;
            app.empty(ulElm);//clear

            //parse param
            let before: <T>(liElm: HTMLElement, item) => T = null;
            let after: <T>(liElm, item, beforeResult: T) => void = null;
            if (typeof option.setVal == "object") {
                before = option.setVal.before;
                after = option.setVal.after;
            } else {
                before = option.setVal;
            }

            //set data
            for (var i = 0; i < data.length; i++) {
                var datum = data[i];
                var liElm = app.clone(liSample);

                var beforeResult = before(liElm, datum);
                ulElm.appendChild(liElm);

                if (datum[CHILDREN_PROPNAME]) {
                    _.recursiveSetVal(liElm, datum[CHILDREN_PROPNAME]);
                }

                if (after) after(liElm, datum, beforeResult);
            }

            _.addControl(treeElm, ulElm);
        }


        getVal(): V[] {
            return this.recursiveGetVal(this.elm);
        }
        private recursiveGetVal(treeElm): V[] {
            var lis = app.s(treeElm, "ul").children;
            var data = [];
            for (var i = 0; i < lis.length; i++) {
                var li = <HTMLElement>lis[i];
                var liData = this._opt.getVal(li);
                if (liData) {
                    liData[CHILDREN_PROPNAME] = this.recursiveGetVal(li);
                    data.push(liData);
                }
            }
            return data;
        }

        redisplayCaret(treeElm, ulElm?) {
            if (!ulElm) ulElm = app.s(treeElm, "ul");
            app.s(treeElm, "[btn=tree-caret]").style.visibility = ulElm.hasChildNodes() ? "visible" : "hidden";
        }

        editable(treeElm) {
            if (!treeElm) treeElm = this.elm;
            app.hide(app.sa(treeElm, "[btn]"));
        }

        private addControl(treeElm, ulElm?) {
            var _ = this;
            var liSample = _.liSample;
            let option = _._opt;
            //display/hide caret caret
            _.redisplayCaret(treeElm, ulElm);

            //collapse
            app.click(app.s(treeElm, SELECTOR_BTN_CARET), function (btn) {
                var liElm = app.sup(btn, SELECTOR_TREE);
                var collapse = !app.hasClass(liElm, "lapse");
                app.setClass(liElm, "lapse", collapse);
            }, true);

            //add
            app.click(app.s(treeElm, SELECTOR_BTN_ADD), function (btn) {
                let liElm = app.sup(btn, SELECTOR_TREE);
                let ulElm = app.s(liElm, "ul");
                let clone = app.clone(liSample);

                //parse param
                let before: (a) => void | boolean = null;
                let after: (a) => void = null;
                if (typeof option.add == "object") {
                    before = option.add.before;
                    after = option.add.after;
                } else {
                    before = option.add;
                }

                //if allow add
                if (!before || (before(clone) !== false)) {
                    _.addControl(clone, ulElm);
                    app.setClass(clone, TREE_IS_NEW_CLASSNAME);
                    ulElm.appendChild(clone);
                    //_.redisplayCaret(liElm);

                    if (after) after(clone);
                }
            }, true);

            //remove
            app.click(app.s(treeElm, SELECTOR_BTN_REMOVE), function (btn) {
                var liElm = app.sup(btn, SELECTOR_TREE);
                if (option.remove) option.remove(liElm, app.hasClass(liElm, TREE_IS_NEW_CLASSNAME), function (soft) {
                    if (soft) {
                        app.setClass(liElm, SOFTREMOVE_CLASSNAME);
                    } else {
                        var parentTreeElm = app.sup(liElm.parentElement, SELECTOR_TREE);
                        liElm.remove();
                        _.redisplayCaret(parentTreeElm);
                    }
                });
            }, true, true);

            //unremove
            app.click(app.s(treeElm, SELECTOR_BTN_UNREMOVE), function (btn) {
                var liElm = app.sup(btn, SELECTOR_TREE);
                if (option.softRemove && app.hasClass(liElm, SOFTREMOVE_CLASSNAME)) {
                    //kembalikan
                    app.remClass(liElm, SOFTREMOVE_CLASSNAME);
                }
            }, true, true);
        }
    }

    /**
     * Create tree view
     * @param elm
     * @param option
     */
    export function tree<V>(elm: HTMLElement, option?: TTreeOpt<V>) {
        var rootElm = app.clone(sample);
        app.replace(elm, rootElm);
        return new Tree<V>(rootElm, elm).opt(option);
    };
}