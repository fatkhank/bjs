//------ content switcher
namespace app.ui {
    var ATTR_SHOW = 'sw-show'
        , ATTR_VIEW = 'sw-view'
        , ACTIVE_ATTR = 'is-active'
        ;

    var contexts = {};

    type TSwitcherHeadElm = HTMLElement & {
        switcher: THeadBodyPair;
    }

    type TSwitcherBodyElm = HTMLElement & {
        pair: THeadBodyPair;
    }

    type THeadBodyPair = {
        bodyElm: HTMLElement,
        context: Switcher,
        order: number
    };

    /**
     * UI switcher component
     */
    export class Switcher {
        static ATTR_SHOW = ATTR_SHOW;
        static ATTR_VIEW = ATTR_VIEW;
        static CONTENT_REF_ATTR = 'href';
        static EVENT_SWITCHING_TO = 'switching.to';
        static EVENT_SWITCH_TO = 'switch.to';
        static EVENT_SWITCHING_FROM = 'switching.from';
        static EVENT_SWITCH_FROM = 'switch.from';
        static list: any = contexts;
        static _counter = 0;

        name: string;

        /**
         * Current content
         */
        bodyElm: HTMLElement;

        /**
         * Current head
         */
        headElm: HTMLElement;
        constructor(name) {
            var _ = this;
            _.name = name;
        }

        /**
         * Create new context
         */
        static create(): Switcher {
            var name = 'switcher' + Switcher._counter++;
            return Switcher.get(name);
        };

        /**
         * Get switcher
         */
        static get(name: string): Switcher {
            return contexts[name] || (contexts[name] = new Switcher(name));
        }

        static scan(elm: HTMLElement) {
            //cari normal show attr
            app.each(app.sa(elm, '[' + ATTR_SHOW + ']'), function (head, index) {
                var name = app.attr(head, ATTR_SHOW);
                var context = Switcher.get(name);
                var pair = registerPair(head, null, context, index);

                if (!pair) return;//failed to register
                var bodyElm = pair.bodyElm;

                //set as default head
                if (app.hasAttr(head, ACTIVE_ATTR)) {
                    context.headElm = head;

                    //tandai content yg ditunjuk jika ditemukan
                    if (bodyElm) {
                        context.bodyElm = bodyElm;
                        showContent(bodyElm);
                    }
                }
            });
        }
        /**
         * Add head and content pair. Return null if fail
         */
        add(bodyElm: HTMLElement, headElm: HTMLElement, order: number = 0) {
            return registerPair(headElm, bodyElm, this, order);
        }

        onchange(fromHead: HTMLElement, toHead: HTMLElement) {
            return true;
        }
        /**
         * Get or set head
         */
        headOn(headElm: HTMLElement, withContent = true) {
            var _ = this;
            if (!_.onchange || !(_.onchange(_.headElm, headElm) === false)) {
                showHead(headElm, withContent);
            }
        }
    }

    /**
     * Create view switcher
     * @param name
     */
    export function switcher(name: string) {
        return Switcher.get(name);
    };

    //let switcher auto scan elms
    app.addScanner(Switcher.scan);

    function showHead(headElm: HTMLElement, withContent) {
        var pair = (<TSwitcherHeadElm>headElm).switcher;
        var context = pair.context;
        var prevBodyElm = <TSwitcherBodyElm>context.bodyElm;

        //ganti head
        if (context.headElm) app.remAttr(context.headElm, ACTIVE_ATTR);
        app.attr((context.headElm = headElm), ACTIVE_ATTR, 'true');

        if (withContent) {
            //change content
            if (prevBodyElm) {
                //hide previous content
                hideContent(prevBodyElm);

                //set animation direction
                if (prevBodyElm.pair) {
                    if (pair.order > prevBodyElm.pair.order) {
                        //next content is after previous content
                        attr(pair.bodyElm, "anim", "left");
                    } else if (pair.order < prevBodyElm.pair.order) {
                        //next content is before previous content
                        attr(pair.bodyElm, "anim", "right");
                    }
                }
            }

            //show last content
            showContent(pair.bodyElm);

            //update current content
            context.bodyElm = pair.bodyElm;
        }
    }

    function registerPair(headElm: HTMLElement, bodyElm: HTMLElement, context: Switcher, order: number) {
        //add ref to content
        if (!bodyElm) {
            var contentRef = app.attr(headElm, 'href');

            if (!contentRef) return null;
            bodyElm = app.s(contentRef);
        }

        var pairObj = (<TSwitcherHeadElm>headElm).switcher = {
            bodyElm: bodyElm,
            context: context,
            order: order
        };

        (<TSwitcherBodyElm>bodyElm).pair = pairObj;
        //            if (!app.hasAttr(head, ATTR_SHOW)) app.attr(head, ATTR_SHOW, context.name);

        //----- switch sub content
        app.click(headElm, function (btn) {
            showHead(btn, true);
            return false;
        });

        return pairObj;
    }

    function hideContent(elm: HTMLElement) {
        elm.dispatchEvent(new Event(Switcher.EVENT_SWITCHING_FROM));

        app.remAttr(elm, ACTIVE_ATTR);

        elm.dispatchEvent(new Event(Switcher.EVENT_SWITCH_FROM));
    }

    function showContent(elm: HTMLElement) {
        elm.dispatchEvent(new Event(Switcher.EVENT_SWITCHING_TO));

        app.attr(elm, ACTIVE_ATTR, true);

        elm.dispatchEvent(new Event(Switcher.EVENT_SWITCH_TO));
    }
}