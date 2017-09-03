namespace app.ui {
    var w = window;
    var CLASS_NAME = 'dropdown';
    app.addScanner(function (elm) {
        app.each(app.sa(elm, '.' + CLASS_NAME), function (dropdownElm) {
            var button = app.s(dropdownElm, 'button');
            app.click(button, function (btnElm) {
                var ul = <HTMLElement>btnElm.nextElementSibling;
                if (app.hasClass(ul, 'on')) return;
                app.setClass(ul, 'on');
                setTimeout(function () {
                    function hide(ev) {
                        if (app.sup(ev.target, 'button') != btnElm) {
                            app.remClass(ul, 'on');
                            w.$(document).off('click', hide);
                        }
                    }
                    w.$(document).on('click', hide);
                });
            });
        });
    });
}