(function (app) {
    'use strict';
    /**
     * App sample container
     */
    var appSamples = app.samples;

    //----- ui mockuper
    (function () {
        var TAG_NAME = 'p-ui'
            , OPT_ATTR = 'opt-'
        ;

        app.addScanner(function (elm) {
            app.each(app.sa(elm, TAG_NAME), function (ui) {
                var name = app.attr(ui, 'name');
                var appUI = app.ui[name];
                if (appUI) {
                    //ambil option
                    var opt = {};
                    for (var i = 0; i < ui.attributes.length; i++) {
                        var attr = ui.attributes[i];
                        if (attr.name.startsWith(OPT_ATTR)) {
                            var optName = attr.name.substring(OPT_ATTR.length);
                            opt[optName] = attr.value;
                        }
                    }

                    ui.innerHTML = "";
                    //jalankan ui
                    appUI(ui, opt);
                }
            });
        }, 99999);
    })();

    //----- loading animation
    (function () {
        var LOADING_CLASSNAME = 'show-loading'
              , sample = app.grabSample(appSamples, '.loading-status')
        ;

        /**
         * Tampilkan anim loading
         */
        app.ui.loading = function (elm, promise, errorMsg, successMsg, loadingText) {
            app.addClass(elm, LOADING_CLASSNAME);
            var loading = app.clone(sample)
                , label = app.s(loading, '.text')
            ;
            label.innerHTML = loadingText || '';// || app.getText('loading');
            elm.appendChild(loading);

            if (promise) {
                return promise.then(function () {
                    app.remClass(elm, LOADING_CLASSNAME);
                    if (successMsg) {
                        app.ui.notifSuccess(successMsg);
                    }
                    loading.remove();
                }, function (error) {
                    app.remClass(elm, LOADING_CLASSNAME);
                    loading.remove();

                    console.error('Load error\n', (error && (error.stack || error.statusText)) || 'unknown');
                    if (!error) return;//maybe overwritten

                    if (errorMsg === undefined) {
                        errorMsg = (error.responseJSON && error.responseJSON.error) || error.responseText || error.statusText;
                    } else if (typeof errorMsg == 'function') {
                        errorMsg = errorMsg(error);
                    }

                    app.ui.notifError(errorMsg || 'Error');

                    return error;
                });
            } else {
                return {
                    hide: function () { loading.remove(); app.remClass(elm, LOADING_CLASSNAME); }
                }
            }
        };
    })();

    //--- tooltip
    (function () {
        app.ui.tooltip = function (elm, tooltip) {
            if (tooltip === false) {
                app.remAttr(elm, 'title');
            } else {
                app.attr(elm, 'title', tooltip);
            }
        };
    })();

    //--- progress
    (function () {
        var sample = app.grabSample('.progress');

        /**
         * 
         */
        app.ui.progress = function (percentageOrDone, total) {
            var clone = app.clone(sample);
            var percentage = total ? percentageOrDone / total : percentageOrDone;
            percentage = Math.min(100, parseFloat(percentage).toFixed(2));

            app.s(clone, 'label').innerHTML = total ? (percentageOrDone + '/' + total) : (percentage + '%');
            app.s(clone, '.bar').style.width = percentage + '%';
            return clone;
        };
    })();

    //--- label
    (function () {
        var sample = app.grabSample('p-label');

        function label(type, msg, opt) {
            var clone = app.clone(sample);
            clone.innerHTML = msg;
            app.attr(clone, 'lbl', type);
            if (opt && opt.wrap === false) {
                app.class(clone, 'nowrap');
            }
            return clone;
        }

        app.ui.label = function (msg, opt) {
            return label('default', msg, opt);
        };

        app.ui.labelGreen = function (msg, opt) {
            return label('green', msg, opt);
        };

        app.ui.labelRed = function (msg, opt) {
            return label('red', msg, opt);
        };

        app.ui.labelOrange = function (msg, opt) {
            return label('orange', msg, opt);
        };
    })();

    //----- confirm dialog
    (function () {
        var dialogSample = app.grabSample(appSamples, '.confirm-dialog');

        var confirmDialog;
        app.onStarting(function () {
            app.lang.scan(dialogSample);
            confirmDialog = app.ui.dialog().define(dialogSample, 'confirm_dialog');
            confirmDialog.oncreate = function (instance) {
                instance = confirmDialog.ins(instance);
                var btnNo = app.s(instance.contentElm, '[btn=no]');
                var btnYes = app.s(instance.contentElm, '[btn=yes]');

                instance.contentElm.onkeydown = function (e) {
                    switch (e.which) {
                        case app.keys.left.which:
                        case app.keys.up.which:
                        case 89://y
                            btnYes.focus();
                            return false;
                            break;

                        case app.keys.right.which:
                        case app.keys.down.which:
                        case 78://n
                            btnNo.focus();
                            return false;
                            break;
                    }
                };
            };
        });
        app.ui.confirm = function (msgOrOption, ok, no) {
            var dialog = confirmDialog.open();

            var btnNo = app.s(dialog.contentElm, '[btn=no]');
            var btnYes = app.s(dialog.contentElm, '[btn=yes]');

            var showNo = true, showYes = true;

            var msg = msgOrOption;
            if (typeof msgOrOption == 'object') {
                msg = msgOrOption.msg;
                if (msgOrOption.no === false) {
                    showNo = false;
                } else if (msgOrOption.no !== undefined) {
                    btnNo.innerHTML = msgOrOption.no;
                }

                if (msgOrOption.ok == false) showYes = false;
                else if (msgOrOption.ok !== undefined) {
                    btnYes.innerHTML = msgOrOption.ok;
                }
            }

            app.show(btnNo, showNo);
            app.show(btnYes, showYes);

            app.s(dialog.contentElm, '.confirm-msg').innerHTML = msg;

            btnNo.focus();
            if (ok) {//if function style
                app.click(app.s(dialog.contentElm, '[btn=yes]'), function (e) {
                    dialog.close();
                    if (ok) ok();
                }, true);
                app.click(btnNo, function (e) {
                    dialog.close(true);
                }, true);
                dialog.onclose = function (fromUser) {
                    if (fromUser && no) no();
                };
            } else {//promise style
                return new Promise(function (done, not) {
                    app.click(app.s(dialog.contentElm, '[btn=yes]'), function (e) {
                        dialog.close();
                        done();
                    }, true);
                    app.click(btnNo, function (e) {
                        dialog.close(true);
                        not();
                    }, true);
                    dialog.onclose = function (fromUser) {
                        if (fromUser) not();
                    };
                });
            }
        };
    })();

    //----- notif
    (function () {
        var container = appNotifs;
        var sample = app.grabSample(container, '.notif');

        app.onStarting(function () {
            app.show(container);
        });

        app.ui.notif = function (msg) {
            var clone = app.clone(sample);
            clone.innerHTML = msg;
            container.appendChild(clone);
            var obj = {
                elm: clone,
            };

            var timer = 3500;
            if (msg) {
                if (msg.length > 60) {
                    app.addClass(clone, 'longer');
                    timer = 5000;
                } else if (msg.length > 30) {
                    app.addClass(clone, 'long');
                    timer = 4300;
                } else {
                    app.addClass(clone, 'short');
                }
            }

            obj.timer = setTimeout(function () {
                clone.remove();
            }, timer);

            return obj;
        };

        app.ui.notifError = function (msg) {
            var notif = app.ui.notif(msg);
            app.addClass(notif.elm, 'red');
            return notif;
        };
        app.ui.notifSuccess = function (msg) {
            var notif = app.ui.notif(msg);
            app.addClass(notif.elm, 'green');
            return notif;
        };
    })();

    //--- card
    (function () {
        var TITLE = '.title'
            , TAG_NAME = 'P-CARD'
            , CLASS_NAME = 'card'
        ;

        app.ui.card = function (elm) {
            if (elm.pcard) return elm.pcard;

            //cek apakah elm adalah card
            if (elm.tagName != TAG_NAME && !app.hasClass(elm, CLASS_NAME)) return null;

            var obj = elm.pcard = {
                elm: elm
            };

            obj.titleElm = app.s(elm, TITLE);

            /**
             * Get or set card title
             */
            obj.title = function (title) {
                if (!obj.titleElm) return null;
                if (title != undefined) return obj.titleElm.innerHTML = title;
                return obj.titleElm.innerHTML;

            };

            return obj;
        };

        function toggleTitle(title) {
            app.click(title, function (title) {
                var card = app.sup(title, '.' + CLASS_NAME);
                var body = app.s(card, '.body');

                if (body.cardRealHeight === undefined) {//hide
                    body.cardRealOverflow = body.style.overflow || null;
                    body.style.overflow = 'hidden';
                    body.style.height = body.offsetHeight + 'px';
                    body.cardRealHeight = body.offsetHeight;
                    body.style.height = 0;
                    app.class(card, 'collapse');
                } else {//show
                    app.remClass(card, 'collapse');
                    body.style.height = body.cardRealHeight + 'px';

                    //release height constraint after transition finished
                    setTimeout(function () {
                        body.style.height = null;
                        body.style.overflow = body.cardRealOverflow;
                        delete body.cardRealHeight;
                        delete body.cardRealOverflow;
                    }, 300);
                }
            }, true);
        }

        app.addScanner(function (elm) {
            var titles = app.sa(elm, '.' + CLASS_NAME + '>' + TITLE);
            for (var c = 0; c < titles.length; c++) toggleTitle(titles[c]);
            titles = app.sa(elm, '.' + CLASS_NAME + '>.head>' + TITLE);
            for (var c = 0; c < titles.length; c++) toggleTitle(titles[c]);
        });
    })();

    //--- form formatter
    (function () {
        var ATTR_NAME = 'form-label';
        var stylesheet = app.getStylesheet();
        var formCounter = 1;

        app.addScanner(function (elm) {
            app.each(app.sa(elm, '[' + ATTR_NAME + ']'), function (form) {
                var pform = form.pform;
                if (pform) {
                    app.remAttr(form, pform.css);
                } else {
                    pform = form.pform = {};
                }
                pform.css = 'pform' + formCounter++;
            });
        });
    })();

    //--- copy me 
    (function () {
        var ATTR_NAME = 'copy-me';
        app.addScanner(function (elm) {
            app.each(app.sa(elm, '[' + ATTR_NAME + ']'), function (targetElm) {
                var count = app.attr(targetElm, ATTR_NAME);
                app.remAttr(targetElm, 'copy-me');
                while (count-- > 0) {
                    var clone = app.clone(targetElm);
                    targetElm.parentElement.appendChild(clone);
                }
            });
        });
    })();

    //--- dropdown
    (function () {
        var CLASS_NAME = 'dropdown';
        app.addScanner(function (elm) {
            app.each(app.sa(elm, '.' + CLASS_NAME), function (dropdownElm) {
                var button = app.s(dropdownElm, 'button');
                app.click(button, function (btnElm) {
                    var ul = btnElm.nextElementSibling;
                    if (app.hasClass(ul, 'on')) return;
                    app.class(ul, 'on');
                    setTimeout(function () {
                        function hide(ev) {
                            if (app.sup(ev.target, 'button') != btnElm) {
                                app.remClass(ul, 'on');
                                $(document).off('click', hide);
                            }
                        }
                        $(document).on('click', hide);
                    });
                });
            });
        });
    })();

    //----- tree
    (function () {
        var sample = app.grabSample(appSamples, 'p-tree')
            , emptyLiSample = app.grabSample(sample, 'ul>li')
            , TREE_IS_NEW_CLASSNAME = 'is-new-tree'
            , SOFTREMOVE_CLASSNAME = 'is-removed'
            , CHILDREN_PROPNAME = 'children'
            , SELECTOR_TREE = '.tree'
            , SELECTOR_BTN_CARET = '[btn=tree-caret]'
            , SELECTOR_BTN_ADD = '[btn=tree-add]'
            , SELECTOR_BTN_UNREMOVE = '[btn=tree-unremove]'
            , SELECTOR_BTN_REMOVE = '[btn=tree-remove]'
        ;

        /*
         * Return money elm 
         */
        app.ui.tree = function (elm, option) {
            var rootElm = app.clone(sample);
            app.replace(elm, rootElm);

            //rangkai liSample
            var liSample = app.clone(emptyLiSample);
            app.s(liSample, 'div>div').appendChild(elm);

            var obj = {};

            function recursiveSetVal(treeElm, data) {
                var ulElm = app.s(treeElm, 'ul');
                app.empty(ulElm);//clear

                var before = option.setVal, after = null;
                if (typeof before === 'object') {
                    before = option.setVal.before;
                    after = option.setVal.after;
                }

                for (var i = 0; i < data.length; i++) {
                    var datum = data[i];
                    var liElm = app.clone(liSample);

                    var beforeResult = before(liElm, datum);
                    ulElm.appendChild(liElm);

                    if (datum[CHILDREN_PROPNAME]) {
                        recursiveSetVal(liElm, datum[CHILDREN_PROPNAME]);
                    }

                    if (after) after(liElm, datum, beforeResult);
                }

                addControl(treeElm, ulElm);
            }

            obj.setVal = function (data) {
                recursiveSetVal(rootElm, data);
            };

            function recursiveGetVal(treeElm) {
                var lis = app.s(treeElm, 'ul').children;
                var data = [];
                for (var i = 0; i < lis.length; i++) {
                    var li = lis[i];
                    var liData = option.getVal(li);
                    if (liData) {
                        liData[CHILDREN_PROPNAME] = recursiveGetVal(li);
                        data.push(liData);
                    }
                }
                return data;
            }

            obj.getVal = function () {
                return recursiveGetVal(rootElm);
            };

            obj.editable = function (treeElm) {
                if (!treeElm) treeElm = rootElm;
                app.hide(app.sa(treeElm, '[btn]'));
            };

            function addControl(treeElm, ulElm) {
                //display/hide caret caret
                redisplayCaret(treeElm, ulElm);

                //collapse
                app.click(app.s(treeElm, SELECTOR_BTN_CARET), function (btn) {
                    var liElm = app.sup(btn, SELECTOR_TREE);
                    var collapse = !app.hasClass(liElm, 'lapse');
                    app.class(liElm, 'lapse', collapse);
                }, true);

                //add
                app.click(app.s(treeElm, SELECTOR_BTN_ADD), function (btn) {
                    var liElm = app.sup(btn, SELECTOR_TREE);
                    var ulElm = app.s(liElm, 'ul');
                    var clone = app.clone(liSample);

                    var before = option.add, after = null;
                    if (typeof before === 'object') {
                        before = option.add.before;
                        after = option.add.after;
                    }

                    if (!before || (before(clone) !== false)) {
                        addControl(clone, ulElm);
                        app.class(clone, TREE_IS_NEW_CLASSNAME);
                        ulElm.appendChild(clone);
                        redisplayCaret(liElm);

                        if (after) after(clone);
                    }
                }, true);

                //remove
                app.click(app.s(treeElm, SELECTOR_BTN_REMOVE), function (btn) {
                    var liElm = app.sup(btn, SELECTOR_TREE);
                    if (option.remove) option.remove(liElm, app.hasClass(liElm, TREE_IS_NEW_CLASSNAME), function (soft) {
                        if (soft) {
                            app.class(liElm, SOFTREMOVE_CLASSNAME);
                        } else {
                            var parentTreeElm = app.sup(liElm.parentElement, SELECTOR_TREE);
                            liElm.remove();
                            redisplayCaret(parentTreeElm);
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

            function redisplayCaret(treeElm, ulElm) {
                if (!ulElm) ulElm = app.s(treeElm, 'ul');
                app.s(treeElm, '[btn=tree-caret]').style.visibility = ulElm.hasChildNodes() ? 'visible' : 'hidden';
            }

            return obj;
        };
    })();

    //image
    (function () {
        var DEFAULT_IMG_URL = 'img/no_img.png';

        function AppValImage(imgElm, url) {
            this.elm = imgElm;
            this.val(imgElm.src || url);
        }
        AppValImage.prototype.val = function (url) {
            var ini = this;
            if (url !== undefined) {
                ini.url = url;
                ini.elm.onerror = function () {
                    ini.elm.onerror = null;//prevent continues fetch, if not found
                    ini.elm.src = app.viewUrl(DEFAULT_IMG_URL);
                }
                url = url || app.viewUrl(DEFAULT_IMG_URL);
                ini.elm.src = url;
            } else return ini.url;
        };

        app.ui.img = function (imgElm, url) {
            return new AppValImage(imgElm, url);
        };
    })();
})(window.app);