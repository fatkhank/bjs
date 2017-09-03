namespace app.ui {
    var DEFAULT_IMG_URL = app.viewUrl("img/no_img.png");

    export class ValImage implements IInput{
        elm:HTMLImageElement;
        url:string;
        constructor(imgElm, url) {
            this.elm = imgElm;
            this.val(imgElm.src || url);
        }
        val(url) {
            var ini = this;
            if (url !== undefined) {
                ini.url = url;
                ini.elm.onerror = function () {
                    ini.elm.onerror = null;//prevent continues fetch, if not found
                    ini.elm.src = DEFAULT_IMG_URL;
                }
                url = url || DEFAULT_IMG_URL;
                ini.elm.src = url;
            } else return ini.url;
        }
    }

    /**
     * Handle image elm
     * @param imgElm
     * @param url
     */
    export function img(imgElm, url?: string) {
        return new ValImage(imgElm, url);
    };
}