/// <reference path="../app/_base.js" />
/// <reference path="../app/_route.js" />
/// <reference path="../app/local_cache.js" />
/// <reference path="../app/_dialog.js" />
/// <reference path="../registration/caches.js" />
/// <reference path="../registration/parts.js" />

(function (app) {
    'use strict';

    /**
     * App sample container
     */
    var appSamples = window.appSamples;

    //----- datepicker
    (function () {
        var TAG_NAME = 'p-datepicker'
        var sample = app.grabSample(appSamples, TAG_NAME);

        app.ui.datepicker = function (elm, option) {
            if (elm.pdatepicker) return;//init once

            if (!option) option = {};

            var sampleClone = app.clone(sample);
            var input = app.s(sampleClone, TAG_NAME + " input");

            //copy attribute
            app.copyAttr(elm, input, { 'class': 0, 'id': 0 });

            app.replace(elm, sampleClone);
            var obj = new AppInput(function (val) {
                if (val !== undefined) {
                    obj.valObj(val && new Date(val));
                } else {
                    return obj.inputElm.value && (option.end ? obj.picker.getMoment().endOf('day') : obj.picker.getDate()).toISOString();
                }
            }, sampleClone, input);
            sampleClone.pdatepicker = obj;

            obj.valObj = function (date) {
                if (date !== undefined) {
                    if (date) {
                        obj.picker.setDate(date);
                        obj.preview(date);
                    } else {
                        obj.inputElm.value = null;
                    }

                    obj.onchange(obj, date && date.toISOString(), false);
                } else return obj.picker.getDate();
            };

            obj.preview = function (dateOrMoment) {
                //input value menggunakan waktu lokal
                obj.inputElm.value = (moment.isMoment(dateOrMoment) ? dateOrMoment : moment(dateOrMoment)).format('D MMM YYYY');
            };

            obj.picker = new Pikaday({
                field: input,
            });

            //default show today
            obj.preview(moment());

            obj._.defaultSetup(option);

            //onchange, harus translate tanggal dulu
            obj.inputElm.onchange = function (a, b, c) {
                var value = obj.inputElm.value;
                var m = moment(value);
                if (!value || m.isValid()) {
                    obj.onchange(obj, value && (option.end ? m.endOf('day') : m).toISOString(), true);
                }
            };
            return obj;
        };

        function choosePreview(momentObj, format, dateOnly, option) {
            if (option) {
                var now = moment();
                var diff = momentObj.diff(now, dateOnly ? 'days' : undefined);
                if ((option.relative == 'future' && diff >= 0) || (option.relative == 'past' && diff <= 0) || (option.relative === true)) {
                    if (!option.from) option.from = now;
                    if (dateOnly) {
                        if (diff < 1) {
                            return app.getText('today');
                        }
                        //if (option.relative == 'future') {
                        //    momentObj = momentObj.endOf('day');
                        //    option.from.startOf('day')
                        //} else {
                        //    momentObj = momentObj.startOf('day');
                        //    option.from.endOf('day')
                        //}
                    }
                    return momentObj.from(option.from);
                }
            }
            return momentObj.format(format);
        }

        /**
         * Display date to input
         */
        app.ui.dateviewer = function (elm, option) {
            var obj = app.ui.input(elm, option);

            obj.val = function (dateOrMoment) {
                var val = dateOrMoment ? choosePreview((moment.isMoment(dateOrMoment) ? dateOrMoment : moment(dateOrMoment)), 'D MMM YYYY', true, option) : '';
                if (obj.elm instanceof HTMLInputElement) obj.elm.value = val;
                else obj.elm.innerHTML = val;
            };
            return obj;
        };

        /**
         * Display date & time to input
         */
        app.ui.datetimeviewer = function (elm, option) {
            var obj = app.ui.input(elm, option);
            obj.val = function (dateOrMoment) {
                var val = dateOrMoment ? choosePreview((moment.isMoment(dateOrMoment) ? dateOrMoment : moment(dateOrMoment)), 'D MMM YYYY, HH:mm', false, option) : '';
                if (obj.elm instanceof HTMLInputElement) obj.elm.value = val;
                else obj.elm.innerHTML = val;
            };
            return obj;
        };

        /**
         * Preview date
         */
        app.ui.dateTxtElm = function (dateOrMoment, option) {
            var val = dateOrMoment ? choosePreview((moment.isMoment(dateOrMoment) ? dateOrMoment : moment(dateOrMoment)), 'D MMM YYYY', true, option) : '';
            return document.createTextNode(val);
        };

        /**
         * Preview date
         */
        app.ui.timeTxtElm = function (dateOrMoment, option) {
            var val = dateOrMoment ? choosePreview((moment.isMoment(dateOrMoment) ? dateOrMoment : moment(dateOrMoment)), 'HH:mm', false, option) : '';
            return document.createTextNode(val);
        };

        /**
         * Preview date and time
         */
        app.ui.datetimeTxtElm = function (dateOrMoment, option) {
            var val = dateOrMoment ? choosePreview((moment.isMoment(dateOrMoment) ? dateOrMoment : moment(dateOrMoment)), 'D MMM YYYY, HH:mm', false, option) : '';
            return document.createTextNode(val);
        };
    })();

    //----- preview money
    (function () {
        var sample = app.grabSample(appSamples, '.money')
            , inputSample = app.grabSample(appSamples, '.input-money');
        ;

        var component = {
            defaultCurrency: ''
        };

        /*
         * Return money elm 
         */
        app.ui.money = function (elm, amount, currency) {
            if (elm === 0) return component;
            var sampleClone = app.clone(sample);

            if (elm) app.replace(elm, sampleClone);

            var obj = new AppInput(function (val) {
                var amount = app.s(sampleClone, '.amount');
                if (val !== undefined) {
                    obj._value = val ? parseFloat(val) : null;
                    amount.innerHTML = app.ui.formatMoney(obj._value);
                }
                return obj._value;
            }, sampleClone);

            //default
            obj.val('0');

            obj._value = null;

            /**
             * Get or set currency
             */
            obj.currency = function (c) {
                var currencyElm = app.s(sampleClone, '.symbol');
                if (c !== undefined) currencyElm.innerHTML = c;
                return currencyElm.innerHTML;
            };

            if (amount !== undefined) obj.val(amount);
            obj.currency(component.defaultCurrency);
            if (currency !== undefined) obj.currency(currency);

            return obj;
        };

        var inputComponent = {
            defaultCurrency: ''
        };

        //input money
        app.ui.inputMoney = function (elm, option) {
            if (elm === 0) return inputComponent;

            var sampleClone = app.clone(inputSample);
            var input = app.s(sampleClone, "input");

            app.replace(elm, sampleClone);

            var obj = new AppInput(function (val, sampleClone) {
                if (val !== undefined) {
                    input.value = val;
                }
                return input.value ? parseFloat(input.value) : null;
            }, sampleClone, input);

            //default
            input.value = '0';

            /**
             * Get or set currency
             */
            obj.currency = function (c) {
                app.s(sampleClone, '.symbol').innerHTML = (typeof (c) == 'string') ? c : c.code;
            };

            /**
             * Get or set step
             */
            obj.step = function (step) {
                if (step !== undefined) {
                    app.attr(input, 'step', step);
                } else return app.attr(input, 'step');
            };

            obj._.defaultSetup(option);

            obj.currency(inputComponent.defaultCurrency);
            if (option) {
                if (option.currency) obj.currency(option.currency);
                if (option.step) obj.step(option.step);
            }

            return obj;
        };
    })();

    //----- money format
    (function () {
        /**
         * From http://www.josscrowcroft.com/2011/code/format-unformat-money-currency-javascript/
         */
        function formatMoney(number, places, symbol, thousand, decimal) {
            number = number || 0;
            places = !isNaN(places = Math.abs(places)) ? places : 2;
            symbol = symbol !== undefined ? symbol : "$";
            thousand = thousand || ",";
            decimal = decimal || ".";
            var negative = number < 0 ? "-" : "",
                i = parseInt(number = Math.abs(+number || 0).toFixed(places), 10) + "",
                j = (j = i.length) > 3 ? j % 3 : 0;
            return symbol + negative + (j ? i.substr(0, j) + thousand : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousand) + (places ? decimal + Math.abs(number - i).toFixed(places).slice(2) : "");
        }
        app.ui.formatMoney = function (value) {
            var res = parseFloat(value)
            return formatMoney(Number.isNaN(res) ? 0 : res, 2, '', '.', ',');
        };
    })();

    //----- input bilangan cacah
    (function () {
        var sample = app.grabSample(appSamples, '.input-whole');
        /**
         * Whole number/bilangan cacah
         */
        app.ui.inputWhole = function (elm, option) {
            var sampleClone = app.clone(sample);
            var input = app.s(sampleClone, "input");
            app.replace(elm, sampleClone);

            var obj = new AppInput(function (val, sampleClone) {
                if (val !== undefined) input.value = val;
                return input.value && parseInt(input.value);
            }, sampleClone, input);

            obj.min = function (number) {
                if (number !== undefined) {
                    app.attr(input, 'min', number);
                } else {
                    var num = app.attr(input, 'min');
                    return num && parseInt(num);
                }
            };

            obj.max = function (number) {
                if (number !== undefined) {
                    app.attr(input, 'max', number);
                } else {
                    var num = app.attr(input, 'max');
                    return num && parseInt(num);
                }
            };

            if (option) {
                if (option.min) {
                    obj.min(option.min);
                }
                if (option.max) obj.max(option.max);
            }

            obj._.defaultSetup(option);

            return obj;
        };
    })();

    //----- input float
    (function () {
        var sample = app.grabSample(appSamples, '.input-float');

        app.ui.inputFloat = function (elm, option) {
            var sampleClone = app.clone(sample);
            var input = app.s(sampleClone, "input");
            app.replace(elm, sampleClone);

            var obj = new AppInput(function (val, sampleClone) {
                if (val !== undefined) input.value = val;
                return input.value ? parseFloat(input.value) : null;
            }, sampleClone, input);

            //default
            input.value = '0.0';

            if (option) {
                if (option.nullable) input.value = null;
                if (option.step) app.attr(input, 'step', option.step);
                obj._.defaultSetup(option);
            }

            //set trim
            obj.trim = function () {

            };

            return obj;
        };
    })();

    //----- input percent
    (function () {
        var sample = app.grabSample(appSamples, '.input-percent');

        //input percent
        app.ui.inputPercent = function (elm, option) {
            var sampleClone = app.clone(sample);
            var input = app.s(sampleClone, "input");
            app.replace(elm, sampleClone);

            var obj = new AppInput(function (val, sampleClone) {
                if (val !== undefined) {
                    input.value = val === null ? null : (val * obj.scale);
                    obj.onchange(obj, val, false);
                } else {
                    return input.value ? parseFloat(input.value / obj.scale) : null;
                }
            }, sampleClone, input);

            input.onchange = function () {
                obj.onchange(obj, input.value / obj.scale, true);
            };

            obj.scale = 100;
            if (option) {
                obj.scale = option.native ? 1 : 100;
                input.value = option.nullable == false ? '0.0' : null;
                if (option.step) app.attr(input, 'step', option.step);
                obj._.defaultSetup(option);
            }

            return obj;
        };
    })();

    //----- input textfield
    (function () {
        /**
         * Input textfield
         */
        app.ui.input = function (elm, option) {
            var obj = new AppInput(null, elm, elm);
            app.addClass(elm, 'input');
            obj._.defaultSetup(option);
            obj.placeholder = function (placeholder) {
                if (placeholder !== undefined) {
                    app.attr(elm, 'placeholder', placeholder);
                }
                return app.attr(elm, 'placeholder');
            };
            return obj;
        };
    })();

    //----- input text multiple
    (function () {
        var sample = app.grabSample(appSamples, '.input-text');

        /**
         * Input text multiline
         */
        app.ui.inputText = function (elm, option) {
            var sampleClone = app.clone(sample);
            app.replace(elm, sampleClone);

            var obj = new AppInput(function (val) {
                if (val !== undefined) {
                    sampleClone.innerHTML = val;
                    if (obj.required()) {
                        app.class(sampleClone, 'invalid', !val);
                    }
                }
                return sampleClone.innerHTML;
            }, sampleClone);

            sampleClone.onblur = function (e) {
                if (obj.required()) {
                    app.class(sampleClone, 'invalid', !(sampleClone.innerHTML && sampleClone.innerHTML.trim()));
                }
                obj.onchange(obj, sampleClone.innerHTML, true);
            };

            obj.focus = function () { sampleClone.focus(); };
            obj.enable = function (isEnabled) {
                if (isEnabled !== undefined) {
                    app.attr(obj.elm, 'contenteditable', isEnabled);
                }
                return app.attr(obj.elm, 'contenteditable') == 'true';
            };

            obj.required = function (required) {
                if (required !== undefined) {
                    app.class(sampleClone, 'required', required);
                    app.class(sampleClone, 'invalid', required && !(sampleClone.innerHTML && sampleClone.innerHTML.trim()));
                } else return app.hasClass(sampleClone, 'required');
            };

            obj._.defaultSetup(option);

            return obj;
        };
    })();

    //--- email
    (function () {
        app.ui.inputEmail = function (elm, option) {
            var obj = app.ui.input(elm, option);
            app.attr(obj.inputElm, 'type', 'email');
            return obj;
        };
    })();

    //----- checkbox
    (function () {
        var sample = app.grabSample(appSamples, '.i-check');
        var CLASS_CHECKED = 'checked';

        var component = {
            //Set checked state
            check: function (elm, isChecked) {
                if (elm.pcheck) {
                    elm.pcheck.checked(isChecked);
                }
            },
            findAll: function (elm) {
                /// <returns type="app.ui.checkbox">dfd</returns>
                var elms = app.sa(elm, '.i-check');
                var checks = [];
                for (var i = 0; i < elms.length; i++) {
                    checks.push(app.ui.checkbox(checks[i]));
                }
                return checks;
            }
        };

        app.ui.checkbox = function (elm, option) {
            //karena intellisense
            if (elm === 0) return component;

            if (elm.pcheck) return elm.pcheck;//init once
            var sampleClone = app.clone(sample);

            var input = app.s(sampleClone, "button");
            app.replace(elm, sampleClone, true, true);

            var obj = new AppInput(function (val, sampleClone) {
                if (val !== undefined) {
                    app.class(input, CLASS_CHECKED, val === true);
                }
                return app.hasClass(input, CLASS_CHECKED);
            }, sampleClone, input);

            //hook
            sampleClone.pcheck = obj;

            /**
             * Get or set checked
             */
            obj.checked = function (isChecked) {
                if (isChecked !== undefined) {
                    if (isChecked) {
                        app.addClass(input, CLASS_CHECKED);
                        obj.onchange(obj, true, false);
                    } else {
                        app.remClass(input, CLASS_CHECKED);
                        obj.onchange(obj, false, false);
                    }
                } else return app.hasClass(input, CLASS_CHECKED);
            };

            input.onclick = function () {
                if (app.hasClass(input, CLASS_CHECKED)) {
                    app.remClass(input, CLASS_CHECKED);
                    obj.onchange(obj, false, true);
                } else {
                    app.addClass(input, CLASS_CHECKED);
                    obj.onchange(obj, true, true);
                }
            };

            //cek jika ada label
            var label = sampleClone.nextElementSibling;
            if (label && ((label.tagName == 'LABEL') || (label.tagName == 'B'))) {
                label.onclick = input.onclick;
            }

            obj._.defaultSetup(option);
            if (option) {
                if (option.size) {
                    switch (option.size) {
                        case 'small':
                            app.addClass(sampleClone, 'small');
                            break;
                        default:
                            app.removeClass(sampleClone, 'small');
                            break;
                    }
                }
            }

            return obj;
        };
    })();

    //----- radio
    (function () {
        var sample = app.grabSample(appSamples, '.i-radio')
            , CLASS_CHECKED = 'checked'
        ;

        var counter = 0;

        app.ui.radio = function (elms, option) {
            var obj = new AppInput();
            obj.name = 'radio' + counter++;
            obj.inputs = {};

            /**
             * Add new elm
             */
            obj.add = function (target) {
                var elm, val, label;
                if (target.constructor.name.startsWith('HTML')) {
                    elm = target;
                    val = app.attr(elm, 'value');
                } else {
                    elm = target.elm;
                    val = target.val;
                    label = target.label;
                }

                var sampleClone = app.clone(sample);
                var input = app.s(sampleClone, "button");
                app.replace(elm, sampleClone, true, true);

                //label
                if (label) {
                    app.s(sampleClone, 'label').innerHTML = label;
                }

                app.attr(input, 'name', obj.name);
                if (val !== undefined) {
                    obj.inputs[val] = input;
                    input.pradio = obj;
                    input.pval = val;
                    app.click(input, function (inputElm) {
                        inputElm.pradio.select(inputElm);
                    }, true);

                    //trigger label click
                    if (label) {
                        app.s(sampleClone, 'label').onclick = function () {
                            input.click();
                        };
                    }
                }
            }

            obj.valElm = null;

            obj.select = function (radioElm) {
                obj.val(radioElm.pval);
            };

            obj.val = function (value) {
                if (value !== undefined) {
                    //uncheck old
                    if (obj.valElm) app.remClass(obj.valElm, CLASS_CHECKED);
                    obj.valElm = obj.inputs[value];
                    if (obj.valElm) app.addClass(obj.valElm, CLASS_CHECKED);

                    obj.onchange(obj, value, false);
                }
                return (obj.valElm && obj.valElm.pval);
            }

            obj._enable = true;
            obj.enable = function (isEnable) {
                if (isEnable !== undefined) {
                    for (var i in obj.inputs) {
                        var input = obj.inputs[i];
                        if (isEnable) app.remAttr(input, 'disabled');
                        else app.attr(input, 'disabled', true);
                    }
                    obj._enable = isEnable;
                }
                return obj._enable;
            };

            for (var i = 0; i < elms.length; i++) obj.add(elms[i]);

            obj._.defaultSetup(option);
            return obj;
        };
    })();

    //----- select
    (function () {
        var selectSample = app.grabSample(appSamples, '.p-select')
            , liSample = app.grabSample(selectSample, 'li');
        ;

        app.ui.select = function (elm, option) {
            var selectElm = app.clone(selectSample);
            app.replace(elm, selectElm, true);

            var ulElm = app.s(selectElm, 'ul');
            var previewElm = app.s(selectElm, 'button');
            if (!(elm instanceof HTMLSelectElement)) {
                previewElm.remove();//remove default button
                previewElm = elm;
                selectElm.insertBefore(previewElm, ulElm);
                //make focusable
                app.attr(previewElm, 'tabindex', 0);
            }

            var obj = new AppInput(function (val) {
                if (val !== undefined) {
                    //deselect previous
                    app.remClass(app.s(ulElm, '.active') || ulElm, 'active');
                    //set val
                    selectElm.pselectval = val;

                    var previewTxt = '';
                    var lis = app.sa(ulElm, 'li');
                    for (var i = 0; i < lis.length; i++) {
                        var li = lis[i];
                        if (li.pselectval == val) {
                            previewTxt = li.innerHTML;

                            //select choosen
                            app.class(li, 'active');

                            //trigger onchange
                            obj.onchange(obj, val, !!obj._fromuser);
                            delete obj._fromuser;

                            break;
                        }
                    }

                    //display
                    if (previewElm instanceof HTMLInputElement) {
                        previewElm.value = previewTxt;
                    } else {
                        previewElm.innerHTML = previewTxt;
                    }
                } else return selectElm.pselectval;
            }, selectElm);

            /**
             * Clear options
             */
            obj.empty = function () {
                app.empty(ulElm);
            };
            obj.addOption = function (opt, useValue, useLabel) {
                if (typeof opt == 'string') opt = { label: opt, value: opt };

                var liElm = app.clone(liSample);
                liElm.innerHTML = opt[useLabel || 'label'];

                var value = opt[useValue || 'value'];
                if (value !== undefined) liElm.pselectval = value;
                ulElm.appendChild(liElm);

                app.click(liElm, function (liElm, e) {
                    if (obj._fromuser !== undefined) obj._fromuser = true;//hack
                    obj.val(value);

                    e.stopPropagation();
                    return false;
                }, false);
                app.onKeyEnter(liElm, function () { liElm.click(); });

                //select first jika belum ada
                if (option && (option.nullable !== true) && (selectElm.pselectval === undefined)) {
                    obj._fromuser = false;//hack
                    liElm.click();
                }

            };

            obj.addOptions = function (options, useValue, useLabel) {
                for (var i = 0; i < options.length; i++) {
                    obj.addOption(options[i], useValue, useLabel);
                }

                //jika tiba2 ada yang cocok dengan value
                if (selectElm.pselectval) {
                    obj._fromuser = false;//hack
                    obj.val(selectElm.pselectval);
                }
            };

            //select option/liElm
            obj.select = function (optionElm) {
                obj.val(optionElm.pselectval);
            };

            obj.enable = function (isEnable) {
                if (isEnable !== undefined) {
                    app.class(selectElm, 'disabled', !isEnable);
                    app.class(previewElm, 'disabled', !isEnable);
                } else return !app.hasClass(selectElm, 'disabled');
            };

            //scan default options
            var optionElms = app.sa(elm, 'option');
            for (var i = 0; i < optionElms.length; i++) {
                var opt = optionElms[i];
                obj.addOption({
                    label: opt.innerHTML,
                    value: app.attr(opt, 'value') || opt.innerHTML
                });
            }

            //set default option
            if (previewElm instanceof HTMLInputElement) {
                selectElm.pselectval = previewElm.value || undefined;
            }

            if (option) {
                if (Array.isArray(option)) option = { options: option };
                if (option.options) {
                    var result = option.options;
                    var useLabel = option.optionLabel;
                    var useValue = option.optionValue;

                    if (typeof option.options == 'function') {
                        result = option.options();
                    }

                    if (result instanceof LocalCache) {
                        result.getMany().then(function (data) {
                            obj.addOptions(data, useValue, useLabel);
                        });
                    } else if (option.options.then) {//promise hack
                        result.then(function (data) {
                            obj.addOptions(data, useValue, useLabel);
                        });
                    } else {
                        obj.addOptions(result, useValue, useLabel);
                    }
                }
                obj._.defaultSetup(option);
            }

            //add row nav
            app.onArrowUp(selectElm, function (selectElm, ev) {
                var selected = app.s(selectElm, 'li:focus') || app.s(selectElm, 'li.active');
                selected = (selected.previousElementSibling || selected);
                if (app.hasClass(ulElm, 'on')) selected.focus();
                else selected.click();
                return false;
            }, true);
            app.onArrowDown(selectElm, function (selectElm, ev) {
                var selected = app.s(selectElm, 'li:focus') || app.s(selectElm, 'li.active');
                selected = (selected.nextElementSibling || selected);
                if (app.hasClass(ulElm, 'on')) selected.focus();
                else selected.click();
                return false;
            }, true);

            //open ul on click
            function showUl(btnElm, e) {
                if (app.hasClass(selectElm, 'disabled')
                || (app.hasClass(ulElm, 'on')))
                    return;
                app.class(ulElm, 'on');

                setTimeout(function () {
                    function hide(ev) {
                        if (app.sup(ev.target, 'button') != btnElm) {
                            app.remClass(ulElm, 'on');
                            $(document).off('click', hide);
                        }
                    }
                    $(document).on('click', hide);
                    //focus first
                    (app.s(ulElm, 'li:first-child') || btnElm).focus();
                });
            }
            app.click(previewElm, showUl);
            app.onKeyEnter(previewElm, showUl);

            return obj;
        };
    })();

    //----- add datalist to text input
    (function () {
        //TODO prepare me
        var counter = 1;
        app.ui.datalist = function (elm, options) {
            var listName = 'dlist_' + counter++;

            //todo adddatalist
        };
    })();

    //----- html as input
    (function () {
        /**
         * HTML gettable value
         */
        app.ui.valhtml = function (elm, selector) {
            if (selector) elm = app.s(elm, selector);
            elm.val = function (html) {
                if (html !== undefined) elm.innerHTML = html;
                return elm.innerHTML
            };
            return elm;
        };
    })();

    //----- input extensions
    (function () {
        HTMLSelectElement.prototype.val = function (v) { if (v != undefined) { this.value = v; } return this.value; };
        HTMLSelectElement.prototype.enable = function (e) {
            var _ = this;
            if (e != undefined) {
                if (e) _.removeAttribute('disabled');
                else _.setAttribute('disabled', 1);
            }
            return !_.hasAttribute('disabled');
        };

        HTMLButtonElement.prototype.enable = function (e) {
            var _ = this;
            if (e != undefined) {
                if (e) _.removeAttribute('disabled');
                else _.setAttribute('disabled', 1);
            }
            return !_.hasAttribute('disabled');
        };
    })();
})(window.app || (window.app = {}));