(function (app) {
    'use strict';
    var keystack = [];

    app.accesskey = {
        remove: function (index) {
            keystack.splice(index, 1);
        },
        register: function (handlers, index) {
            if (index === undefined) {
                index = keystack.length;
                keystack.push(handlers || {});
            } else {
                unreg(keystack[index]);
                keystack[index] = handlers || {};
            }

            //register
            var doc = $(document);
            for (var keys in handlers) {
                doc.on('keyup', null, keys, handlers[keys]);
            }

            return index;
        }
    };

    function unreg(handlers) {
        var doc = $(document);
        for (var keys in handlers) {
            doc.off('keyup', handlers[keys]);
        }
    }
})(app);