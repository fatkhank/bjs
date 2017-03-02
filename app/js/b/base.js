/**
 * b.js framework
 * 
 */
(function (app) {
    'use strict';

    //----- UI base
    app.ui = {};
    app.context = {};
    app.config = {};

    //---- app elms
    app.headElm = appHeader;
    app.bodyElm = appBody;

    /**
     * Cari 1 elemen ke bawah
     */
    app.s = function (a, b) {
        /// <returns type='HTMLElement' ></returns>
        return typeof (a) == 'string' ? document.querySelector(a) : (b ? a.querySelector(b) : a);
    };

    /**
     * Cari banyak elemen ke bawah. (selector) or (dom, selector)
     */
    app.sa = function (a, b) {
        /// <returns type='NodeList'></returns>
        return typeof (a) == 'string' ? document.querySelectorAll(a) : a.querySelectorAll(b);
    };

    /**
     * Mencari elemen dari dirinya, keparent, sampai ketemu
     */
    app.sup = function (elm, selector) {
        //<returns type="HTMLElement">Single Element.</returns>
        return $(elm).closest(selector)[0];
    };

    app.each = function (elms, func, param) {
        for (var i = 0; i < elms.length; i++) func(elms[i], i, param);
    };
    app.attr = function (elm, name, val) {
        if (val != undefined) {
            elm.setAttribute(name, val);
            return val;
        }
        return elm.getAttribute(name);
    };
    app.copyAttr = function (fromElm, toElm, filters) {
        var attrs = fromElm.attributes;
        if (!filters) filters = {};
        for (var a = 0; a < attrs.length; a++) {
            var attr = attrs[a];
            if (filters[attr.name] === undefined || filters[attr.name]) {
                toElm.setAttribute(attr.name, attr.value);
            }
        }
    };
    app.hasAttr = function (elm, name, val) {
        return elm.hasAttribute(name);
    };
    app.remAttr = function (elm, name) {
        elm.removeAttribute(name);
        return elm;
    };
    app.addClass = function (elm, className) {
        elm.classList.add(className);
        return elm;
    };
    app.remClass = function (elm, className) {
        elm.classList.remove(className);
        return elm;
    };
    app.hasClass = function (elm, className) {
        return elm.classList.contains(className);
    };
    /**
     * Add or toggle class
     */
    app.class = function (elm, className, toggle) {
        if (toggle === false) {
            app.remClass(elm, className);
        } else app.addClass(elm, className);
        return elm;
    };

    /**
     * Clone element
     */
    app.clone = function (elm) {
        ///<returns type="HTMLElement">Single Element.</returns>
        ///<param name="elm" type="HTMLElement" />
        return elm.cloneNode(true);
    };

    app.html = function (elm, val) {
        if (val != undefined) elm.innerHTML = val;
        return elm.innerHTML;
    };

    /**
     * Delete all children
     */
    app.empty = function (elm, preserve) {
        var children = [].slice.call(elm.children);
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            if (!preserve || !preserve(child)) child.remove();
        }
    };

    /**
     * Replace elemen dengan elemen lain
     */
    app.replace = function (elm, newElm, withOldAttr, withOldClasses) {
        if (withOldAttr) {
            var attrs = elm.attributes;
            for (var a = 0; a < attrs.length; a++) {
                var attr = attrs[a];
                if (attr.name == 'class') continue;
                newElm.setAttribute(attr.name, attr.value);
            }
        }
        if (withOldClasses) {
            var classes = elm.classList;
            for (var a = 0; a < classes.length; a++) {
                newElm.classList.add(classes[a]);
            }
        }
        elm.parentNode.replaceChild(newElm, elm);
    };

    //--- hide and show
    /**
     * Hide elm or elms
     */
    app.hide = function (elm) {
        //Array or NodeList
        if (elm.length === undefined) elm = [elm];
        for (var i = 0; i < elm.length; i++) {
            var tgt = elm[i];
            if (app.hasClass(tgt, 'should-hide') || (tgt.parentElement && app.hasClass(tgt.parentElement, 'filter-shown'))) {
                app.remClass(tgt, 'shown');
            } else app.addClass(tgt, 'hidden');
        }
    }
    /**
     * Show hidden elm or elms. If second param == false -> hide
     */
    app.show = function (elm, trueOrFalse) {
        if (trueOrFalse === false) app.hide(elm);
        else {
            //Array or NodeList
            if (elm.length === undefined) elm = [elm];
            for (var i = 0; i < elm.length; i++) {
                var tgt = (elm.item && elm.item(i)) || elm[i];
                if (app.hasClass(tgt, 'should-hide') || (tgt.parentElement && app.hasClass(tgt.parentElement, 'filter-shown'))) {
                    app.addClass(tgt, 'shown');
                } else app.remClass(tgt, 'hidden');
            }
        }
    }

    /**
     * Main sample container
     */
    app.samples = window.appSamples;
    app.grabSample = function (domOrSelector, selector) {
        var sample = app.s(domOrSelector, selector);
        app.remClass(sample, 'sample');
        sample.remove();
        return sample;
    };

    app.on = function (elm, event, handler) {
        elm.addEventListener(event, function (ev) {
            handler(ev.currentTarget, ev);
        });
        return elm;
    };

    //-------- events
    /**
     * On click
     */
    app.click = function (elm, handler, override, ignoreNull) {
        if (!elm && ignoreNull) return;
        var handlers = elm.hclick || (elm.hclick = []);
        if (override) {
            for (var i = 0; i < handlers.length; i++) {
                elm.removeEventListener('click', handlers[i]);
            }
            handlers.length = 0;
        }
        var wrapper = function (e) {
            handler.call(this, e.currentTarget, e);
        };

        elm.addEventListener('click', wrapper);
        handlers.push(wrapper);
    };
    
    /**
     * On double click
     */
    app.click2 = function (elm, handler, override, ignoreNull) {
        var handlers = elm.hclick2 || (elm.hclick2 = []);
        if (override) {
            for (var i = 0; i < handlers.length; i++) {
                elm.removeEventListener('dblclick', handlers[i]);
            }
            handlers.length = 0;
        }

        var wrapper = function (e) { handler(e.currentTarget, e); };

        elm.addEventListener('dblclick', wrapper);
        handlers.push(wrapper);
    };

    function onKeyPress(elm, key, handler, override, ignoreNull) {
        if (!elm && ignoreNull) return;
        var pkeyp = elm.pkeyp;

        if (!pkeyp) {
            pkeyp = elm.pkeyp = {};
            elm.addEventListener('keypress', function (ev) {
                var theElm = ev.currentTarget;
                var pkeyp = theElm.pkeyp;

                if (!pkeyp) return;
                switch (ev.which) {
                    case keys.enter.which://enter
                        if (pkeyp.enter) pkeyp.enter(theElm, ev);
                        break;
                }

                //handle any key
                if (pkeyp.any) pkeyp.any(theElm, ev);
            }, true);
        }

        if (override || !pkeyp[key.name]) {
            pkeyp[key.name] = handler;
        } else {
            var f = pkeyp[key.name];
            pkeyp[key.name] = function (evElm, ev) {
                f(evElm, ev);
                handler(evElm, ev);
            };
        }
    };

    function onKeyUp(elm, key, handler, override, ignoreNull) {
        if (!elm && ignoreNull) return;
        var pkeyu = elm.pkeyu;

        if (!pkeyu) {
            pkeyu = elm.pkeyu = {};
            elm.addEventListener('keyup', function (ev) {
                var theElm = ev.currentTarget;
                var pkeyu = theElm.pkeyu;

                if (!pkeyu) return;
                switch (ev.which) {
                    case keys.left.which://arrow left
                        if (pkeyu.left) pkeyu.left(theElm, ev);
                        break;
                    case keys.up.which://arrow up
                        if (pkeyu.up) pkeyu.up(theElm, ev);
                        break;
                    case keys.right.which://arrow right
                        if (pkeyu.right) pkeyu.right(theElm, ev);
                        break;
                    case keys.down.which://arrow down
                        if (pkeyu.down) pkeyu.down(theElm, ev);
                        break;
                    case keys.esc.which://esc
                        if (pkeyu.esc) pkeyu.esc(theElm, ev);
                        break;
                    case keys.backspace.which://esc
                        if (pkeyu.backspace) pkeyu.backspace(theElm, ev);
                        break;
                    case keys.del.which://esc
                        if (pkeyu.del) pkeyu.del(theElm, ev);
                        break;
                }
                if (pkeyu.any) pkeyu.any(theElm, ev);
            }, true);
        }

        if (override || !pkeyu[key.name]) {
            pkeyu[key.name] = handler;
        } else {
            var f = pkeyu[key.name];
            pkeyu[key.name] = function (evElm, ev) {
                f(evElm, ev);
                handler(evElm, ev);
            };
        }
    };

    var keys = app.keys = {
        enter: { name: 'enter', which: 13 },
        esc: { name: 'esc', which: 27 },
        left: { name: 'left', which: 37 },
        up: { name: 'up', which: 38 },
        right: { name: 'right', which: 39 },
        down: { name: 'down', which: 40 },
        any: { name: 'any' },
        backspace: { name: 'backspace', which: 8 },
        del: { name: 'del', which: 46 },
    };

    app.onArrowLeft = function (elm, handler, override, ignoreNull) {
        return onKeyUp(elm, keys.left, handler, override, ignoreNull);
    };
    app.onArrowUp = function (elm, handler, override, ignoreNull) {
        return onKeyUp(elm, keys.up, handler, override, ignoreNull);
    };
    app.onArrowRight = function (elm, handler, override, ignoreNull) {
        return onKeyUp(elm, keys.right, handler, override, ignoreNull);
    };
    app.onArrowDown = function (elm, handler, override, ignoreNull) {
        return onKeyUp(elm, keys.down, handler, override, ignoreNull);
    };
    app.onKeyEnter = function (elm, handler, override, ignoreNull) {
        return onKeyPress(elm, keys.enter, handler, override, ignoreNull);
    };
    app.onKeyEsc = function (elm, handler, override, ignoreNull) {
        return onKeyUp(elm, keys.esc, handler, override, ignoreNull);
    };

    /**
     * Executed after finished typing
     */
    app.onTypeDone = function (elm, handler, override, delay) {
        var func = app.debounce(handler, delay || 500);
        onKeyUp(elm, keys.backspace, func, override);
        onKeyUp(elm, keys.del, func, override);
        onKeyPress(elm, keys.any, func, override);
    };

    function arrowScrollIntercept(e) {
        switch (e.which) {
            case keys.up.which:
            case keys.left.which:
            case keys.right.which:
            case keys.down.which:
                //allow for input
                if (!app.isInput(e.target))
                    e.preventDefault();
                break;
            default: break;
        }
    };
    app.arrowScrolling = function (elm, enable) {
        if (enable == false) {
            elm.addEventListener("keydown", arrowScrollIntercept, false);
        } else {
            elm.removeEventListener("keydown", arrowScrollIntercept);
        }
    };

    //--- scanner
    var scanners = [];
    /**
     * Scan specific elemen
     */
    app.scan = function (elm) {
        for (var i = 0; i < scanners.length; i++) scanners[i].f(elm);
        return elm;
    };
    /**
     * Add scanner function
     */
    app.addScanner = function (scanner, priority) {
        scanners.push({ f: scanner, p: (priority || 0) });
        scanners = scanners.sort(function (a, b) {
            return b.p - a.p;
        });
    };

    app.isInput = function (elm) {
        return (elm.value !== undefined || app.hasClass(elm, 'input') || app.hasAttr(elm, 'contenteditable'));
    };


    //---------------------------------------------- else
    /**
     * Empty function
     */
    app.noop = function () { };

    /**
     * return promise that immedietly executed
     */
    app.asPromise = function (funcOrData) {
        if (typeof funcOrData == 'function') return new Promise(funcOrData);
        return new Promise(function (done) { done(funcOrData); });
    };

    //---- utils
    app.debounce = function (fn, delay) {
        //from https://remysharp.com/2010/07/21/throttling-function-calls
        var timer = null;
        return function () {
            var context = this, args = arguments;
            clearTimeout(timer);
            timer = setTimeout(function () {
                fn.apply(context, args);
            }, delay);
        };
    };
    app.mapFromProp = function (arr, keyName) {
        var db = {};
        for (var i = 0; i < arr.length; i++) {
            var obj = arr[i];
            var key = obj[keyName];
            db[key] = obj;
        }
        return db;
    }

    /**
     * Compare object properties, ignore function
     */
    app.propsEqual = function (a, b, depth) {
        if (depth <= 0) return false;

        //ignore function
        if (typeof a == 'function') return (typeof b == 'function');
        if (typeof a != 'object') return a === b;

        //both null or undefined or not
        if (!a) return !b;
        if (!b) return !a;

        //if object
        var keysA = Object.keys(a).sort();
        var keysB = Object.keys(b).sort();
        //difer count
        if (keysA.length != keysB.length) return false;
        //difer name
        if (keysA.join('') !== keysB.join('')) return false;
        for (var i = 0; i < keysA.length; i++) {
            var key = keysA[i];

            if (!app.propsEqual(a[key], b[key], depth - 1)) return false;
        }

        return true;

    };

    //--
    var stylesheet = null;
    app.getStylesheet = function () {
        if (!stylesheet) {
            var stylesheets = document.styleSheets;
            for (var s = 0; s < stylesheets.length; s++) {
                stylesheet = stylesheets[s];
                if (stylesheet.href && stylesheet.href.indexOf('app.min.css')) break;
            }
        }
        return stylesheet;
    };
    /**
     * Add new css rule
     */
    app.addCSS = function (css, index) {
        var depth = (index == undefined) ? stylesheet.cssRules.length : index;
        (stylesheet || app.getStylesheet()).insertRule(css, depth);
    };

})(window.app || (window.app = {}));



//---------------- TYPES ------------------------------
function AppInput(valFunc, elm, inputElm) {
    var _ = this;
    _.elm = elm;
    _.inputElm = inputElm;

    /**
     * Get or set value
     */
    _.val = valFunc || function (val) { return null; };

    /**
     * Get or set object bound to val prop
     */
    _.valObj = function (obj) { };

    _.focus = function () { if (inputElm) inputElm.focus(); };

    /**
     * Set input enable or not
     */
    _.enable = function (isEnable) { return true; };

    _.required = function (isRequired) { return false; };

    //default method
    if (inputElm) {
        if (!valFunc) {
            _.val = function (val) {
                if (val !== undefined) {
                    inputElm.value = val;
                    _.onchange(_, val, false);
                }
                return inputElm.value;
            };
        }

        _.enable = function (e) {
            if (e !== undefined) {
                if (e) inputElm.removeAttribute('disabled');
                else inputElm.setAttribute('disabled', 1);
            }
            return !inputElm.hasAttribute('disabled');
        };

        inputElm.onchange = function () {
            _.onchange(_, inputElm.value, true);
        };

        _.required = function (isRequired) {
            if (_.inputElm) {
                if (_.inputElm.required) {
                    _.inputElm.enable(isRequired);
                } else {
                    if (isRequired) app.attr(_.inputElm, 'required', '1');
                    else app.remAttr(_.inputElm, 'required', '1');
                }
                return app.hasAttr(_.inputElm, 'required')
            }
            return false;
        };

        _.valid = function () {
            return _.inputElm.validity.valid;
        };
    }

    /**
     * Override this func to intercept onchange
     */
    _.onchange = function (inputObj, value, isFromUser) { };

    _._ = {
        defaultSetup: function (option) {
            if (option) {
                if (option.enable !== undefined) _.enable(option.enable);

                if (option.required !== undefined) _.required(option.required);
                else if (option.nullable !== undefined) _.required(!option.nullable);

                if (option.value !== undefined) _.val(option.value);
            }
        }
    };
}

function AppView() {
    var _ = this;

    /**
     * Override me
     */
    _.onShow = function (trigger, param) { };

    /**
     * Executed on firsttime show
     */
    _.onFirstShow = function (trigger, param) { };

    /**
     * Trigger show view
     */
    _.show = function () {
        if (_.onFirstShow) {
            _.onFirstShow();
            _.onFirstShow = null;
        }

        _.onShow();
    };

    /**
     * Element bound to view
     */
    _.elm = null;
}

function AppPart(url, permissions, uses) {
    var _ = this;
    _.url = url;

    _.allowFor = function (userPermissions) {
        if (Array.isArray(permissions)) {
            for (var i = 0; i < permissions.length; i++) {
                if (!userPermissions[permissions[i]]) return false;
            }
        } else if (typeof permissions == 'function') {
            return permissions(function (perm) {
                return !!userPermissions[perm];
            });
        }

        return true;
    };

    _.loadPromise = null;

    _.holderElm = null;
    _.uses = uses || [];

    _.onload = function () { };

    _.viewSample = null;
    _.getViewElm = function (initParam) {
        /// <returns type="AppView">dfd</returns>
        if (!_.viewSample) {
            _.viewSample = _.holderElm.firstElementChild;
            _.viewSample.remove();
        }
        return app.clone(_.viewSample);
    };
    _.initView = function (view, initParam) { };

    /**
     * Execute func when part is loaded
     */
    _.then = function (func) {
        if (_.loadPromise) _.loadPromise.then(func);
        else func();
    };
}