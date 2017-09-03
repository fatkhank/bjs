//----- content tab
namespace app.ui {
    const TAG_NAME = "crud-tab";
    const TAB_CLOSE_BTN = ".btn-close-tab";
    const ATTR_BODIES = "[tab=contents]";
    const ATTR_BODY = "[tab=content]";
    const ATTR_HEADS = "[tab=heads]";
    const ATTR_HEAD = "[tab=head]";
    const HEAD_APPROX_WIDTH = 120;//untuk menghitung max tab
    const SAMPLE_DEFAULT = "default";

    export class Tab {
        id: string;
        sample: TTabSample;

        /**
         * The head
         */
        headElm: HTMLElement;
        /**
         * The content elm
         */
        bodyElm: HTMLElement;
        /**
         * The obj
         */
        obj: TabGroup;

        onset: () => void | boolean;
        onunset: () => void | boolean;

        constructor(obj: TabGroup, headClone: HTMLElement,
            contentClone: HTMLElement, tabId?: string, sample?: TTabSample) {
            var _ = this;
            _.obj = obj;
            _.headElm = headClone;
            _.bodyElm = contentClone;
            _.id = tabId;
            _.sample = sample;

            //hook

        }

        /**
         * tampilkan tab
         */
        show() {
            this.headElm.click();

            return this;
        }

        /**
         * Sembunyikan tab (dan remove)
         */
        close(fallbackHead?: HTMLElement | false) {
            var _ = this;
            var obj = _.obj;
            var prev = <HTMLElement>((fallbackHead !== false) && (_.headElm.nextElementSibling || _.headElm.previousElementSibling || fallbackHead));

            _.headElm.remove();
            _.bodyElm.remove();

            if (prev) prev.click();

            delete obj.opened[_.id];
            _.sample.count--;
        }

        /**
         * Set or get title
         */
        title(title?: string) {
            return this.obj.title(this.headElm, title);
        }

        /**
         * 
         */
        persist(isPersist: boolean): boolean | void {
            var _ = this;
            if (isPersist !== undefined) {
                app.setClass(_.headElm, "persist", isPersist);
            } else return app.hasClass(_.headElm, "persist");
        }
    }

    export type TTabSample = {
        head: HTMLElement,
        content: HTMLElement,
        heads: HTMLElement,
        contents: HTMLElement,
        max: number | "auto" | ((sample: TTabSample, count: number) => boolean),
        count: number
    };

    export class TabGroup {
        elm: HTMLElement;
        switcher: app.ui.Switcher;
        private samples: { [id: string]: TTabSample } = {};
        private tabCounter = 0;

        /*
         * Opened tabs
         */
        opened = <{ [id: string]: Tab }>{};

        onset: () => void;
        onunset: () => void;
        constructor(elm, param) {
            var _ = this;
            _.elm = elm;
            _.switcher = app.ui.Switcher.create();
        }

        /**
         * Menambahkan sample tab baru
         * 
         * @param {string} name 
         * @param {HTMLElement} head 
         * @param {HTMLElement} content 
         * @param {HTMLElement} heads heads container
         * @param {HTMLElement} contents contents container
         * @param {number} maxCount 
         * 
         * @memberof ContentTab
         */
        addSample(name: string, head: HTMLElement, content: HTMLElement, headContainer: HTMLElement, contentContainer: HTMLElement, maxCount: number | ((sample: TTabSample, count: number) => boolean)) {
            return this.samples[name] = <TTabSample>{
                head: head,
                content: content,
                heads: headContainer,
                contents: contentContainer,
                max: (maxCount || 30),
                count: 0
            };
        }

        /**
         * Close all tab
         */
        closeAll(withPersist = false) {
            for (var i in this.opened) {
                var tab = this.opened[i];
                if (withPersist || !app.hasClass(tab.headElm, "persist"))
                    tab.close(false);
            }
        }

        /**
         * Get nth tab
         */
        get(indexOrElm: number | HTMLElement): Tab {
            /// <returns type="TabObj" mayBeNull="true"></returns>
            var target = indexOrElm;
            if (typeof indexOrElm == "number") target = app.s(this.elm, ATTR_HEADS + ">:nth-child(" + (indexOrElm + 1) + ")");
            if (!target) return null;
            return (<any>target).ptab;
        };

        /**
         * Get tab count
         */
        count(): number {
            return app.sa(this.elm, ATTR_HEADS + ">" + ATTR_HEAD + ":not(.hidden)").length;
        }

        /**
         * Get last tab
         */
        lastTab(): Tab {
            /// <returns type="TabObj" mayBeNull="true"></returns>
            var target: any = app.s(this.elm, ATTR_HEADS + ">:last-child");
            if (!target) return null;
            return target.ptab;
        }

        /**
         * Get or set head title
         */
        title(headElm: HTMLElement, title?: string) {
            //find label or use the head
            var titleLabel = app.s(headElm, "b");
            if (!titleLabel) titleLabel = headElm;

            if (title != undefined) {
                titleLabel.innerHTML = title;
                app.ui.tooltip(headElm, title);
            }
            return titleLabel.innerHTML;
        }

        /**
         * Try open existing tab
         */
        openTab(tabId: string): Tab {
            var tab = this.opened[tabId];
            if (tab) tab.show();
            return tab;
        }

        /**
         * Create new tab
         * 
         * @param {string} [sampleName] 
         * @param {string} [title] 
         * @param {string} [tabId] 
         * @returns {Tab} 
         * 
         * @memberof TabGroup
         */
        newTab(sampleName = SAMPLE_DEFAULT, title?: string, tabId?: string): Tab {
            var _ = this;

            //find sample
            let sample = _.samples[sampleName];

            //set tabid
            if (!tabId) {
                tabId = _.switcher.name + "_" + sampleName + (++_.tabCounter);
            }

            //batasi jumlah tab
            if (_.isMax(sample)) return null;
            //jaga id

            sample.count++;

            //atur head
            var headClone = app.clone(sample.head);
            _.title(headClone, title);

            sample.heads.appendChild(headClone);

            //atur content
            var contentClone = app.clone(sample.content);
            app.attr(contentClone, "id", tabId);//id
            sample.contents.appendChild(contentClone);

            //add tab
            _.switcher.add(contentClone, headClone);

            var tabObj = new Tab(_, headClone, contentClone, tabId, sample);
            _.opened[tabId] = tabObj;
            //add hook
            (<any>headClone).ptab = tabObj;

            //cari tombol close
            app.each(app.sa(contentClone, TAB_CLOSE_BTN), function (btn) {
                app.click(btn, function () { tabObj.close(); });
            });

            //scan content
            app.scan(contentClone);

            return tabObj;
        }

        private isMax(sample: TTabSample) {
            return (typeof sample.max == "function"
                && sample.max(sample, sample.count))
                ||
                ((sample.max == "auto") &&
                    (sample.count >= 3) && // minimal harus 3
                    ((sample.heads.children.length + 1) * (sample.head.offsetWidth || HEAD_APPROX_WIDTH) > sample.heads.offsetWidth)
                )
                || (sample.count >= sample.max)
        }
    }

    type TContentTabOpt = {
        headElm?: HTMLElement,
        content?: HTMLElement,
        headsElm?: HTMLElement,
        contents?: HTMLElement,
        findSample?: boolean | "preserve",
        maxCount?: number
    };

    /**
     * Create content tab
     * @param elm
     * @param param
     */
    export function contentTab(elm, param?: TContentTabOpt) {//todo refactor
        if (elm && elm.ptabs) return;
        var obj = (elm.ptabs = new TabGroup(elm, param));
        if (!param) param = <any>{};

        obj.switcher.onchange = function (fromHeadElm, toHeadElm) {
            var fromTab = obj.get(fromHeadElm);
            var toTab = obj.get(toHeadElm);
            return (!fromTab || !fromTab.onunset || (fromTab.onunset() !== false)) && (!toTab || !toTab.onset || (toTab.onset() !== false));
        };

        //find default element
        if (!(param.findSample === false)) {
            var headElm = param.headElm || app.s(elm, ATTR_HEAD);
            var bodyElm = param.content || app.s(elm, ATTR_BODY);
            var headsElm = param.headsElm || app.s(elm, ATTR_HEADS);
            var bodiesElm = param.contents || app.s(elm, ATTR_BODIES);

            if (param.findSample != "preserve") {
                headElm.remove();
                bodyElm.remove();
            }

            //find default
            obj.addSample(SAMPLE_DEFAULT, headElm, bodyElm, headsElm, bodiesElm, param.maxCount);
        }

        return obj;
    };
}