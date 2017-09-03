namespace app.ui {
    'use strict';

    /**
     * App sample container
     */
    var appSamples = document.getElementById('appSamples');
    let w: any = window;
    let moment = w.moment;

    //----- datepicker
    var TAG_NAME = 'p-datepicker';
    var CONTAINER_SELECTOR = 'div';
    var sample = app.grabSample(appSamples, TAG_NAME);

    //let moment = w.moment;
    let Pikaday = w.Pikaday;

    type TDatepickerOption = TInputOpt & {
        end?: boolean
    };

    export class Datepicker extends InputField {
        picker: any;

        private fromUser = true;
        private trigoc = true;
        private _opt: TDatepickerOption;

        constructor(elm: HTMLElement, inputElm: HTMLInputElement) {
            super(elm, inputElm);

            var _ = this;

            _.picker = new Pikaday({
                field: inputElm,
                //container: app.s(elm, CONTAINER_SELECTOR)
            });

            //onchange, harus translate tanggal dulu
            inputElm.onchange = function () {
                var value = _.inputElm.value;
                var m = moment(value);
                if (_.trigoc //by pass onchange
                    &&
                    (!value || m.isValid())) {
                    _.onchange(_, value && (_._opt.end ? m.endOf('day') : m).toISOString(), _.fromUser);
                }
                return true;
            };
        }
        val(val?) {
            var _ = this;
            if (val !== undefined) {
                //set value
                _.valObj(val && moment.utc(val).toDate());
            } else {
                var date = (_._opt.end ? _.picker.getMoment().endOf('day') : _.picker.getDate());
                return _.inputElm.value && date && date.toISOString();
            }
        }

        valObj(date) {
            var _ = this;
            if (date !== undefined) {
                _.fromUser = false;
                if (date) {
                    _.trigoc = false;
                    if (moment.isMoment(date)) {
                        _.picker.setMoment(date);
                    } else {
                        _.picker.setDate(date);
                    }
                    _.preview(date);
                    _.trigoc = true;
                } else {
                    _.inputElm.value = null;
                }

                _.onchange(_, date && date.toISOString(), false);
                _.fromUser = true;
            } else return _.picker.getDate();
        }
        preview(dateOrMoment) {
            var _ = this;
            //input value menggunakan waktu lokal
            _.trigoc = false;
            _.inputElm.value = (moment.isMoment(dateOrMoment) ? dateOrMoment : moment.utc(dateOrMoment)).local().format('D MMM YYYY');
            _.trigoc = true;
        }

        /**
         * set value to today
         */
        today() {
            this.valObj(new Date());
        }

        opt(option: TDatepickerOption) {
            var _ = this;
            _._opt = option;
            if (option) {
                //default show today if required
                if (option.required) {
                    _.today();
                }
            }
            return super.opt(option);
        }
    }

    export function datepicker(elm, option?: TDatepickerOption) {
        if (elm.pdatepicker) return;//init once

        if (!option) option = {};

        var sampleClone = app.clone(sample);
        var input = <HTMLInputElement>app.s(sampleClone, TAG_NAME + " input");

        //copy attribute
        app.copyAttr(elm, input, { 'class': 0, 'id': 0 });

        app.replace(elm, sampleClone);
        var obj = new Datepicker(sampleClone, input);
        (<any>sampleClone).pdatepicker = obj;

        //readjust position
        obj.picker.adjustPosition();

        return obj.opt(option);
    };

    export type TDateViewOpt = {
        relative?: 'future' | 'past' | true | false,
        from?: Date,
        enable?: boolean
    };

    //
    function choosePreview(momentObj, format, dateOnly, option: TDateViewOpt) {
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
        return momentObj.local().format(format);
    }

    /**
     * Display date to input
     */
    export function dateviewer(elm, option?: TDateViewOpt) {
        var obj = ui.input(elm, option);

        obj.val = function (dateOrMoment) {
            if (dateOrMoment !== undefined) {
                var val = dateOrMoment ? choosePreview((moment.isMoment(dateOrMoment) ? dateOrMoment : moment.utc(dateOrMoment)), 'D MMM YYYY', true, option) : '';
                if (obj.elm instanceof HTMLInputElement) obj.elm.value = val;
                else obj.elm.innerHTML = val;
            } else {
                return (obj.elm instanceof HTMLInputElement) ? obj.elm.value : obj.elm.innerHTML;
            }
        };
        return obj;
    };

    /**
     * Display date & time to input
     */
    export function datetimeviewer(elm, option?: TDateViewOpt) {
        var obj = app.ui.input(elm, option);
        obj.val = function (dateOrMoment) {
            if (dateOrMoment !== undefined) {
                var val = dateOrMoment ? choosePreview((moment.isMoment(dateOrMoment) ? dateOrMoment : moment.utc(dateOrMoment)), 'D MMM YYYY, HH:mm', false, option) : '';
                if (obj.elm instanceof HTMLInputElement) obj.elm.value = val;
                else obj.elm.innerHTML = val;
            } else {
                return (obj.elm instanceof HTMLInputElement) ? obj.elm.value : obj.elm.innerHTML;
            }
        };
        return obj;
    };

    /**
     * Preview date
     */
    export function dateTxtElm(dateOrMoment, option?: TDateViewOpt) {
        var val = dateOrMoment ? choosePreview((moment.isMoment(dateOrMoment) ? dateOrMoment : moment.utc(dateOrMoment)), 'D MMM YYYY', true, option) : '';
        return document.createTextNode(val);
    };

    /**
     * Preview date
     * @param dateOrMoment
     * @param option
     */
    export function timeTxtElm(dateOrMoment, option?: TDateViewOpt) {
        var val = dateOrMoment ? choosePreview((moment.isMoment(dateOrMoment) ? dateOrMoment : moment.utc(dateOrMoment)), 'HH:mm', false, option) : '';
        return document.createTextNode(val);
    };

    /**
     * Preview date and time
     * @param dateOrMoment
     * @param option
     */
    export function datetimeTxtElm(dateOrMoment, option?: TDateViewOpt) {
        var val = dateOrMoment ? choosePreview((moment.isMoment(dateOrMoment) ? dateOrMoment : moment.utc(dateOrMoment)), 'D MMM YYYY, HH:mm', false, option) : '';
        return document.createTextNode(val);
    };

}

namespace app.date {
    var baseTime = (<any>window).moment.utc().startOf("day");

    export function from(template: string): Date;
    export function from(template: string, format: string): string;
    export function from(template: string, format?: string): Date | string {
        let result = null;
        switch (template) {
            case "this_week":
            case "thisweek":
                result = baseTime.clone().startOf("week");
                break;
            case "this_month":
            case "thismonth":
                result = baseTime.clone().startOf("month");
                break;
            case "this_year":
            case "thisyear":
                result = baseTime.clone().startOf("year");
                break;
            case "last_week":
            case "lastweek":
            case "prevweek":
                result = baseTime.clone().subtract(1, "week").startOf("week");
                break;
            case "prevweek2":
                result = baseTime.clone().subtract(2, "week").startOf("week");
                break;
            case "prevweek3":
                result = baseTime.clone().subtract(3, "week").startOf("week");
                break;
            case "prevweek4":
                result = baseTime.clone().subtract(4, "week").startOf("week");
                break;
            case "prevweek5":
                result = baseTime.clone().subtract(5, "week").startOf("week");
                break;
            case "last_month":
            case "lastmonth":
            case "prevmonth":
                result = baseTime.clone().subtract(1, "month").startOf("month");
                break;
            case "prevmonth2":
                result = baseTime.clone().subtract(2, "month").startOf("month");
                break;
            case "prevmonth3":
                result = baseTime.clone().subtract(3, "month").startOf("month");
                break;
            case "prevmonth4":
                result = baseTime.clone().subtract(4, "month").startOf("month");
                break;
            case "prevmonth5":
                result = baseTime.clone().subtract(5, "month").startOf("month");
                break;
            case "last_year":
            case "lastyear":
            case "prevyear":
                result = baseTime.clone().subtract(1, "year").startOf("year");
                break;
            case "prevyear2":
                result = baseTime.clone().subtract(2, "year").startOf("year");
                break;
            case "prevyear3":
                result = baseTime.clone().subtract(3, "year").startOf("year");
                break;
            case "prevyear4":
                result = baseTime.clone().subtract(4, "year").startOf("year");
                break;
            case "prevyear5":
                result = baseTime.clone().subtract(5, "year").startOf("year");
                break;
            default:
                return null;
        }

        if (format) {
            return result.format(format);
        }
        return result.toDate();
    }

    export function to(template: string): Date;
    export function to(template: string, format: string): string;
    export function to(template: string, format?: string): Date | string {
        let result = null;
        switch (template) {
            case "this_week":
            case "thisweek":
                result = baseTime.clone().endOf("week");
                break;
            case "this_month":
            case "thismonth":
                result = baseTime.clone().endOf("month");
                break;
            case "this_year":
            case "thisyear":
                result = baseTime.clone().endOf("year");
                break;
            case "last_week":
            case "lastweek":
            case "prevweek":
                result = baseTime.clone().subtract(1, "week").endOf("week");
                break;
            case "prevweek2":
                result = baseTime.clone().subtract(2, "week").endOf("week");
                break;
            case "prevweek3":
                result = baseTime.clone().subtract(3, "week").endOf("week");
                break;
            case "prevweek4":
                result = baseTime.clone().subtract(4, "week").endOf("week");
                break;
            case "prevweek5":
                result = baseTime.clone().subtract(5, "week").endOf("week");
                break;
            case "last_month":
            case "lastmonth":
            case "prevmonth":
                result = baseTime.clone().subtract(1, "month").endOf("month");
                break;
            case "prevmonth2":
                result = baseTime.clone().subtract(2, "month").endOf("month");
                break;
            case "prevmonth3":
                result = baseTime.clone().subtract(3, "month").endOf("month");
                break;
            case "prevmonth4":
                result = baseTime.clone().subtract(4, "month").endOf("month");
                break;
            case "prevmonth5":
                result = baseTime.clone().subtract(5, "month").endOf("month");
                break;
            case "last_year":
            case "lastyear":
            case "prevyear":
                result = baseTime.clone().subtract(1, "year").endOf("year");
                break;
            case "prevyear2":
                result = baseTime.clone().subtract(2, "year").endOf("year");
                break;
            case "prevyear3":
                result = baseTime.clone().subtract(3, "year").endOf("year");
                break;
            case "prevyear4":
                result = baseTime.clone().subtract(4, "year").endOf("year");
                break;
            case "prevyear5":
                result = baseTime.clone().subtract(5, "year").endOf("year");
                break;
            default:
                return null;
        }
        if (format) {
            return result.format(format);
        }
        return result.toDate();
    }
}