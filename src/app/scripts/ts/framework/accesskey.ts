namespace app{
    var keystack = [];
    var w = window;

    export const accesskey = {
        remove: function (index) {
            keystack.splice(index, 1);
        },
        
        register: function (handlers, index: number = null) {
            if (index === undefined) {
                index = keystack.length;
                keystack.push(handlers || {});
            } else {
                unreg(keystack[index]);
                keystack[index] = handlers || {};
            }

            //register
            var doc = w.$(document);
            for (var keys in handlers) {
                doc.on('keyup', null, keys, handlers[keys]);
            }

            return index;
        }
    };

    function unreg(handlers) {
        var doc = w.$(document);
        for (var keys in handlers) {
            doc.off('keyup', handlers[keys]);
        }
    }
}