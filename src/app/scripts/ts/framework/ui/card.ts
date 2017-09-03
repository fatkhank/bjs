namespace app.ui {
    'use strict';

    //--- card
    var TITLE = '.title'
        , TAG_NAME = 'P-CARD'
        , CLASS_NAME = 'card'
        ;

    export class Card {
        elm: HTMLElement;
        titleElm: HTMLElement;
        constructor(elm) {
            var obj = this;
            obj.elm = elm;
            obj.titleElm = app.s(elm, TITLE);

            app.click(app.s(elm, '.head .actions [btn=enlarge]'), function () {
                obj.enlarge(!app.hasClass(elm, 'enlarge'));
            }, true, true);
        }

        /**
         * Get or set card title
         */
        title(title?: string): void | string {
            var _ = this;
            if (!_.titleElm) return null;
            if (title != undefined) return _.titleElm.innerHTML = title;
            return _.titleElm.innerHTML;

        }
        /**
         * Set fullscreen
         */
        enlarge(trueOrFalse: boolean) {
            var _ = this;
            var elm = _.elm;
            var isEnlarged = app.hasClass(elm, 'enlarge');
            if (isEnlarged == trueOrFalse) return;
            if (isEnlarged) {
                //shrink
                let prelg = (<any>elm).prelg;
                elm.style.width = prelg.b.width + 'px';
                elm.style.top = prelg.b.top + 'px';
                elm.style.left = prelg.b.left + 'px';

                setTimeout(function () {
                    app.remClass(elm, 'enlarge');
                    elm.style.width = prelg.width;
                    elm.style.top = prelg.top;
                    elm.style.left = prelg.left;
                }, 302);//wait animation finish

            } else {
                //enlarging
                let prelg = (<any>elm).prelg = {
                    width: elm.style.width,
                    top: elm.style.top,
                    left: elm.style.left,
                    b: elm.getBoundingClientRect()
                };
                app.setClass(elm, 'enlarge');
                //pre anim
                elm.style.position = '';
                elm.style.width = prelg.b.width + 'px';
                elm.style.top = prelg.b.top + 'px';
                elm.style.left = prelg.b.left + 'px';
                //begin anim
                setTimeout(function () {
                    elm.style.width = '98%';
                    elm.style.top = '10px';
                    elm.style.left = '1%';
                });
            }
        };

        /**
         * Show/hide body
         */
        collapse(isCollapse: boolean) {
            let _ = this;
            var cardElm = _.elm;
            var bodyElm: any = app.s(cardElm, '.body');
            if (isCollapse) {//hide
                bodyElm.cardRealOverflow = bodyElm.style.overflow || null;
                bodyElm.style.overflow = 'hidden';
                bodyElm.style.height = bodyElm.offsetHeight + 'px';
                bodyElm.cardRealHeight = bodyElm.offsetHeight;
                bodyElm.style.height = 0;
                app.setClass(cardElm, 'collapse');
            } else {//show
                app.remClass(cardElm, 'collapse');
                bodyElm.style.height = bodyElm.cardRealHeight + 'px';

                //release height constraint after transition finished
                setTimeout(function () {
                    bodyElm.style.height = null;
                    bodyElm.style.overflow = bodyElm.cardRealOverflow;
                    delete bodyElm.cardRealHeight;
                    delete bodyElm.cardRealOverflow;
                }, 300);
            }
        }
    }

    /**
     * Create card
     * @param elm
     */
    export function card(elm: HTMLElement): Card {
        if ((<any>elm).pcard) return <Card>(<any>elm).pcard;

        //cek apakah elm adalah card
        if (elm.tagName != TAG_NAME && !app.hasClass(elm, CLASS_NAME)) return null;

        return new Card(elm);
    };

    function toggleTitle(title) {
        app.click(title, function (title) {
            var card = app.sup(title, '.' + CLASS_NAME);
            var body: any = app.s(card, '.body');

            if (body.cardRealHeight === undefined) {//hide
                body.cardRealOverflow = body.style.overflow || null;
                body.style.overflow = 'hidden';
                body.style.height = body.offsetHeight + 'px';
                body.cardRealHeight = body.offsetHeight;
                body.style.height = 0;
                app.setClass(card, 'collapse');
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

    //scan cards
    app.addScanner(function (elm) {
        var titles = app.sa(elm, '.' + CLASS_NAME + '>' + TITLE);
        for (var c = 0; c < titles.length; c++) toggleTitle(titles[c]);
        titles = app.sa(elm, '.' + CLASS_NAME + '>.head>' + TITLE);
        for (var c = 0; c < titles.length; c++) toggleTitle(titles[c]);
    });
}