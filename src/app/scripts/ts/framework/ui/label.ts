namespace app.ui {
    'use strict';

    //--- label
    var sample = app.grabSample('p-label');

    function createLabel(type, msg, opt) {
        var clone = app.clone(sample);
        clone.innerHTML = msg;
        app.attr(clone, 'lbl', type);
        if (opt && opt.wrap === false) {
            app.setClass(clone, 'nowrap');
        }
        return clone;
    }

    export function label(msg, opt?) {
        return createLabel('default', msg, opt);
    };

    export function labelGreen(msg, opt?) {
        return createLabel('green', msg, opt);
    };

    export function labelRed(msg, opt?) {
        return createLabel('red', msg, opt);
    };

    export function labelOrange(msg, opt?) {
        return createLabel('orange', msg, opt);
    };
}