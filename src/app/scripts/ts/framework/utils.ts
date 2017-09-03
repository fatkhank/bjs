namespace app {
    //-------- QUERY
    /**
     * Cari 1 elemen ke bawah
     */
    export function s<T extends HTMLElement = HTMLElement>(a: HTMLElement | string, b: string = null): T {
        /// <returns type="HTMLElement" ></returns>
        return <T>(typeof (a) == "string" ? document.querySelector(a) : (b ? a.querySelector(b) : a));
    };

    /**
     * Cari banyak elemen ke bawah. (selector) or (dom, selector)
     */
    export function sa(a: HTMLElement | string, b: string = null) {
        return <NodeListOf<HTMLElement>>(typeof (a) == "string" ? document.querySelectorAll(a) : a.querySelectorAll(b));
    };

    /**
     * Mencari elemen dari dirinya, keparent, sampai ketemu
     */
    export function sup(elm, selector) {
        return window.$(elm).closest(selector)[0];
    };

    export function each<P = any>(elms, func: (elm: HTMLElement, index?: number, param?: P) => void, param?: P) {
        for (var i = 0; i < elms.length; i++) func(elms[i], i, param);
    };
    /**
     * Get or set attr
     * @param elm
     * @param name
     * @param val
     * @param toggle Jika true=set attr, jika false = unset
     */
    export function attr(elm: HTMLElement, name, val?, toggle: boolean = true) {
        if (val != undefined) {
            if (toggle) {
                elm.setAttribute(name, val);
            } else {
                elm.removeAttribute(name);
            }

            return val;
        }
        return elm.getAttribute(name);
    };
    export function copyAttr(fromElm, toElm, filters) {
        var attrs = fromElm.attributes;
        if (!filters) filters = {};
        for (var a = 0; a < attrs.length; a++) {
            var attr = attrs[a];
            if (filters[attr.name] === undefined || filters[attr.name]) {
                toElm.setAttribute(attr.name, attr.value);
            }
        }
    };
    export function hasAttr(elm: HTMLElement, name) {
        return elm.hasAttribute(name);
    };
    export function remAttr(elm: HTMLElement, name) {
        elm.removeAttribute(name);
        return elm;
    };
    export function addClass(elm: HTMLElement, className) {
        elm.classList.add(className);
        return elm;
    };
    export function remClass(elm: HTMLElement, className) {
        elm.classList.remove(className);
        return elm;
    };
    export function hasClass(elm: HTMLElement, className) {
        return elm.classList.contains(className);
    };

    /**
     * Add or toggle class
     * @param elm
     * @param className
     * @param toggle if true, class added, false=removed
     */
    export function setClass(elm: HTMLElement, className: string, toggle: boolean = true) {
        if (toggle === false) {
            app.remClass(elm, className);
        } else app.addClass(elm, className);
        return elm;
    };

    /**
     * Clone elm
     * @param elm
     */
    export function clone<T extends HTMLElement = HTMLElement>(elm: HTMLElement): T {
        return <T>elm.cloneNode(true);
    };

    /**
     * Get or set innerHTML
     * @param elm
     * @param val
     */
    export function html(elm: HTMLElement, val: any) {
        if (val != undefined) elm.innerHTML = val;
        return elm.innerHTML;
    };

    /**
     * Delete all children
     * @param elm
     * @param preserve
     */
    export function empty(elm: HTMLElement, preserve: (HTMLElement) => boolean = null) {
        var children = [].slice.call(elm.children);
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            if (!preserve || !preserve(child)) child.remove();
        }
    };

    /**
     * Replace elemen dengan elemen lain
     */
    export function replace(elm, newElm, withOldAttr: boolean = false, withOldClasses: boolean = false) {
        if (withOldAttr) {
            var attrs = elm.attributes;
            for (var a = 0; a < attrs.length; a++) {
                var attr = attrs[a];
                if (attr.name == "class") continue;
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
    export function hide(elm) {
        //Array or NodeList
        if (!elm) return;
        if (elm.length === undefined) elm = [elm];
        for (var i = 0; i < elm.length; i++) {
            var tgt = elm[i];
            if (app.hasClass(tgt, "should-hide") || (tgt.parentElement && app.hasClass(tgt.parentElement, "filter-shown"))) {
                app.remClass(tgt, "shown");
            } else app.addClass(tgt, "hidden");
        }
    }
    /**
     * Show hidden elm or elms. If second param == false -> hide
     */
    export function show(elm, trueOrFalse: boolean = null) {
        if (!elm) return;
        if (trueOrFalse === false) app.hide(elm);
        else {
            //Array or NodeList
            if (elm.length === undefined) elm = [elm];
            for (var i = 0; i < elm.length; i++) {
                var tgt = (elm.item && elm.item(i)) || elm[i];
                if (app.hasClass(tgt, "should-hide") || (tgt.parentElement && app.hasClass(tgt.parentElement, "filter-shown"))) {
                    app.addClass(tgt, "shown");
                } else app.remClass(tgt, "hidden");
            }
        }
    }

    /**
     * Main sample container
     */
    export var samples = document.getElementById("appSamples");
    export function grabSample(domOrSelector: HTMLElement | string, selector?: string) {
        if (typeof domOrSelector == "string") {
            selector = domOrSelector;
            domOrSelector = app.samples;
        }
        var sample = app.s(domOrSelector, selector);
        app.remClass(sample, "sample");
        sample.remove();
        return sample;
    };

    export function on(elm, event, handler) {
        elm.addEventListener(event, function (ev) {
            handler(ev.currentTarget, ev);
        });
        return elm;
    };


    //----------------------- EVENTS -----------------------
    /**
     * On click
     */
    export function click<T extends HTMLElement = HTMLElement>(elm: T, handler: (target: T, ev: MouseEvent) => void, override = false, ignoreNull = false) {
        if (!elm && ignoreNull) return;
        var handlers = (<any>elm).hclick || ((<any>elm).hclick = []);
        if (override) {
            for (var i = 0; i < handlers.length; i++) {
                elm.removeEventListener("click", handlers[i]);
            }
            handlers.length = 0;
        }
        var wrapper = function (e) {
            handler.call(this, e.currentTarget, e);
        };

        elm.addEventListener("click", wrapper);
        handlers.push(wrapper);
    };

    /**
     * On double click
     */
    export function click2<T extends HTMLElement = HTMLElement>(elm: T, handler: (target: T, ev: MouseEvent) => void, override = false, ignoreNull = false) {
        var handlers = (<any>elm).hclick2 || ((<any>elm).hclick2 = []);
        if (override) {
            for (var i = 0; i < handlers.length; i++) {
                elm.removeEventListener("dblclick", handlers[i]);
            }
            handlers.length = 0;
        }

        var wrapper = function (e) { handler(e.currentTarget, e); };

        elm.addEventListener("dblclick", wrapper);
        handlers.push(wrapper);
    };

    type TKeyHandler = (elm: HTMLElement, ev: KeyboardEvent) => void;

    export function onKeyPress(elm, key: TKey, handler: TKeyHandler, override = false, ignoreNull = false) {
        if (!elm && ignoreNull) return;
        var pkeyp = elm.pkeyp;

        if (!pkeyp) {
            pkeyp = elm.pkeyp = {};
            elm.addEventListener("keypress", function (ev) {
                var theElm = ev.currentTarget;
                var pkeyp = theElm.pkeyp;

                if (!pkeyp) return;
                switch (ev.which) {
                    case KEYS.ENTER.which://enter
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

    export function onKeyUp(elm, key: TKey, handler: TKeyHandler, override = false, ignoreNull = false) {
        if (!elm && ignoreNull) return;
        var pkeyu = elm.pkeyu;

        if (!pkeyu) {
            pkeyu = elm.pkeyu = {};
            elm.addEventListener("keyup", function (ev: KeyboardEvent) {
                var theElm = <any>ev.currentTarget;
                var pkeyu = theElm.pkeyu;

                if (!pkeyu) return;
                switch (ev.which) {
                    case KEYS.LEFT.which://arrow left
                        if (pkeyu.left) pkeyu.left(theElm, ev);
                        break;
                    case KEYS.UP.which://arrow up
                        if (pkeyu.up) pkeyu.up(theElm, ev);
                        break;
                    case KEYS.RIGHT.which://arrow right
                        if (pkeyu.right) pkeyu.right(theElm, ev);
                        break;
                    case KEYS.DOWN.which://arrow down
                        if (pkeyu.down) pkeyu.down(theElm, ev);
                        break;
                    case KEYS.ESC.which://esc
                        if (pkeyu.esc) pkeyu.esc(theElm, ev);
                        break;
                    case KEYS.BACKSPACE.which://esc
                        if (pkeyu.backsp) pkeyu.backsp(theElm, ev);
                        break;
                    case KEYS.DEL.which://esc
                        if (pkeyu.del) pkeyu.del(theElm, ev);
                        break;
                    default:
                        if (pkeyu.def) pkeyu.def(theElm, ev);
                        break
                }
                //handle alphabet
                if (pkeyu.alpha && ev.which >= app.KEYS.A.which
                    && ev.which < app.KEYS.Z.which
                    && !ev.ctrlKey && !ev.altKey) {
                    pkeyu.alpha(theElm, ev);
                }
                //handle any
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

    type TKey = { name: string, which?: number };
    export const KEYS = {
        /**
         * any key
         */
        ANY: { name: "any" },
        /**
         * Alphabet, with no control
         */
        ALPHA: { name: "alpha" },
        BACKSPACE: { name: "backsp", which: 8 },
        ENTER: { name: "enter", which: 13 },
        ESC: { name: "esc", which: 27 },
        SPACE: { name: "space", which: 32 },
        PAGEUP: { name: "left", which: 33 },
        PAGEDOWN: { name: "up", which: 34 },
        END: { name: "end", which: 35 },
        HOME: { name: "home", which: 36 },
        LEFT: { name: "left", which: 37 },
        UP: { name: "up", which: 38 },
        RIGHT: { name: "right", which: 39 },
        DOWN: { name: "down", which: 40 },
        DEL: { name: "del", which: 46 },
        NUM0: { name: "n0", which: 48 },
        NUM1: { name: "n1", which: 49 },
        NUM2: { name: "n2", which: 50 },
        NUM3: { name: "n3", which: 51 },
        NUM4: { name: "n4", which: 52 },
        NUM5: { name: "n5", which: 53 },
        NUM6: { name: "n6", which: 54 },
        NUM7: { name: "n7", which: 55 },
        NUM8: { name: "n8", which: 56 },
        NUM9: { name: "n9", which: 57 },
        A: { name: "a", which: 65 },
        B: { name: "b", which: 66 },
        C: { name: "c", which: 67 },
        D: { name: "d", which: 68 },
        E: { name: "e", which: 69 },
        F: { name: "f", which: 70 },
        G: { name: "g", which: 71 },
        H: { name: "h", which: 72 },
        I: { name: "i", which: 73 },
        J: { name: "j", which: 74 },
        K: { name: "k", which: 75 },
        L: { name: "l", which: 76 },
        M: { name: "m", which: 77 },
        N: { name: "n", which: 78 },
        O: { name: "o", which: 79 },
        P: { name: "p", which: 80 },
        Q: { name: "q", which: 81 },
        R: { name: "r", which: 82 },
        S: { name: "s", which: 83 },
        T: { name: "t", which: 84 },
        U: { name: "u", which: 85 },
        V: { name: "v", which: 86 },
        W: { name: "w", which: 87 },
        X: { name: "x", which: 88 },
        Y: { name: "y", which: 89 },
        Z: { name: "z", which: 90 },
    };

    export function onArrowLeft(elm, handler: TKeyHandler, override = false, ignoreNull = false) {
        return onKeyUp(elm, KEYS.LEFT, handler, override, ignoreNull);
    };
    export function onArrowUp(elm, handler: TKeyHandler, override = false, ignoreNull = false) {
        return onKeyUp(elm, KEYS.UP, handler, override, ignoreNull);
    };
    export function onArrowRight(elm, handler: TKeyHandler, override = false, ignoreNull = false) {
        return onKeyUp(elm, KEYS.RIGHT, handler, override, ignoreNull);
    };
    export function onArrowDown(elm, handler: TKeyHandler, override = false, ignoreNull = false) {
        return onKeyUp(elm, KEYS.DOWN, handler, override, ignoreNull);
    };
    export function onKeyEnter(elm, handler: TKeyHandler, override = false, ignoreNull = false) {
        return onKeyPress(elm, KEYS.ENTER, handler, override, ignoreNull);
    };
    export function onKeyEsc(elm, handler: TKeyHandler, override = false, ignoreNull = false) {
        return onKeyUp(elm, KEYS.ESC, handler, override, ignoreNull);
    };

    /**
     * Executed after finished typing
     */
    export function onTypeDone(elm, handler, override = false, delay = 500) {
        var func = app.debounce(handler, delay);
        onKeyUp(elm, KEYS.BACKSPACE, func, override);
        onKeyUp(elm, KEYS.DEL, func, override);
        onKeyPress(elm, KEYS.ANY, func, override);
    };

    function arrowScrollIntercept(e) {
        switch (e.which) {
            case KEYS.UP.which:
            case KEYS.LEFT.which:
            case KEYS.RIGHT.which:
            case KEYS.DOWN.which:
                //allow for input
                if (!app.isInput(e.target))
                    e.preventDefault();
                break;
            default: break;
        }
    };
    export function arrowScrolling(elm, enable) {
        if (enable == false) {
            elm.addEventListener("keydown", arrowScrollIntercept, false);
        } else {
            elm.removeEventListener("keydown", arrowScrollIntercept);
        }
    };

    //--- scanner
    type TScanFunc = {
        /**
         * Priority
         */
        p: number
        /**
         * Function
         */
        f: (elm: HTMLElement) => void;
    };
    var scanners = <TScanFunc[]>[];

    /**
     * Scan specific elemen
     */
    export function scan(elm) {
        for (var i = 0; i < scanners.length; i++) {
            scanners[i].f(elm);
        }
        return elm;
    };

    /**
     * Add scanner function
     * @param scanner
     * @param priority
     */
    export function addScanner(scannerFunc: (elm: HTMLElement) => void, priority: number = 0) {
        scanners.push({ f: scannerFunc, p: priority });
        scanners = scanners.sort(function (a, b) {
            return b.p - a.p;
        });
    };

    export function isInput(elm) {
        return (elm.value !== undefined || app.hasClass(elm, "input") || app.hasAttr(elm, "contenteditable"));
    };


    //---------------------------------------------- else
    /**
     * Empty function
     */
    export function noop() { };

    //------------ Promise
    /**
     * return promise that immedietly executed
     */
    export function asPromise<T = any>(funcOrData: (() => T) | T): Promise<T> {
        if (typeof funcOrData == "function") return new window.Promise(funcOrData);
        return new window.Promise(function (done) { done(funcOrData); });
    };

    /**
     * return promise
     */
    export function promise<T = any>(func: (done?: (r?: T) => void, fail?: (e?: any) => void) => any): Promise<T> {
        return new window.Promise(func);
    };

    /**
     * return promise
     */
    export function promiseAll(promises: Promise<any>[]): Promise<any> {
        return window.Promise.all(promises);
    };

    /**
     * Check if something is promise
     */
    export function isPromise(something) {
        return something && !!something.then;
    };

    export var PROMISE_NULL = asPromise(null);
    export var PROMISE_EMPTY = asPromise({});

    //---- utils
    export function debounce(fn, delay: number) {
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
    export function mapFromProp(arr, keyName) {
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
    export function propsEqual(a, b, depth) {
        if (depth <= 0) return false;

        //ignore function
        if (typeof a == "function") return (typeof b == "function");
        if (typeof a != "object") return a === b;

        //both null or undefined or not
        if (!a) return !b;
        if (!b) return !a;

        //if object
        var keysA = Object.keys(a).sort();
        var keysB = Object.keys(b).sort();
        //difer count
        if (keysA.length != keysB.length) return false;
        //difer name
        if (keysA.join("") !== keysB.join("")) return false;
        for (var i = 0; i < keysA.length; i++) {
            var key = keysA[i];

            if (!app.propsEqual(a[key], b[key], depth - 1)) return false;
        }

        return true;

    }

    //--
    var stylesheet = null;
    export function getStylesheet() {
        if (!stylesheet) {
            var stylesheets = document.styleSheets;
            for (var s = 0; s < stylesheets.length; s++) {
                stylesheet = stylesheets[s];
                if (stylesheet.href && stylesheet.href.indexOf("app.min.css")) break;
            }
        }
        return stylesheet;
    };
    /**
     * Add new css rule
     * @param css
     * @param index if null, rule inserted to last
     */
    export function addCSS(css, index = null) {
        var depth = (index == undefined) ? stylesheet.cssRules.length : index;
        (stylesheet || app.getStylesheet()).insertRule(css, depth);
    };
}