namespace app.ui {
    "use strict";

    var container = document.getElementById("appNotifs");
    var sample = app.grabSample(container, ".notif");

    app.onStarting(function () {
        app.show(container);
    });

    type TNotifOpt = {
        msg?: string;
        sticky?: boolean;
        /**
         * Notif duration in millisecond
         */
        time?: number;
        actions?: {
            /**
             * Auto trigger action after some duration in millisecond
             */
            time?: number,
            label: string,
            func: (
                (notif: Notif) => void
            )
        }[];
    };

    class Notif {
        elm: HTMLElement;
        timer;
        constructor(option: TNotifOpt) {
            let _ = this;
            var notifElm = app.clone(sample);
            _.elm = notifElm;

            //find msg elm
            var msgElm = app.s(notifElm, ".msg");
            msgElm.innerHTML = option.msg;

            container.appendChild(notifElm);

            //parse param
            let sticky = option.sticky;
            let msg = option.msg;

            if (option.actions && option.actions.length) {
                sticky = true;
                const action = option.actions[0];
                const btn: any = app.s(notifElm, "button[btn]");
                btn.innerHTML = action.label;
                app.show(btn);
                btn.notifElm = notifElm;
                btn.act = action.func;
                app.click(btn, function (btn) {
                    btn.act(_);
                }, true);

                if (action.time) {
                    //round
                    let remainingTime = 1000 * Math.floor(action.time / 1000);
                    let reminder = action.time - remainingTime;
                    setTimeout(function () {
                        //auto trigger
                        let interval = setInterval(function () {
                            //show time
                            btn.innerHTML = action.label + "(" + (remainingTime / 1000) + ")";
                            //countdown
                            remainingTime -= 1000;
                            if (remainingTime <= 0) {
                                clearInterval(interval);
                                //show time
                                btn.innerHTML = action.label + "(0)";
                                //do action
                                btn.act(_);
                            }
                        }, 1000);
                    }, reminder);
                }
                //for (var i = 0; i < msgOrOptions.actions.length; i++) {
                //    var action = msgOrOptions.actions;
                //    app.
                //}
            }

            if (sticky) {
                app.addClass(notifElm, "sticky");
                var btn: any = app.s(notifElm, "button.x");
                app.remClass(btn, "hidden");
                app.click(btn, function (btn) {
                    var notifElm = btn.parentElement;
                    app.addClass(notifElm, "dismiss");
                    setTimeout(function () {
                        notifElm.remove();
                    }, 500);
                }, true);
            } else {
                var timer = option.time;
                if (!timer && msg) {
                    //set timer by message length
                    if (msg.length > 60) {
                        timer = 5000;
                    } else if (msg.length > 30) {
                        timer = 4300;
                    } else {
                        timer = 3500;
                    }
                }

                _.timer = setTimeout(function () {
                    _.dismiss();
                }, timer);
            }
        }
        /**
         * Close notification
         */
        dismiss() {
            const _ = this;
            app.addClass(_.elm, "dismiss");
            setTimeout(function () {
                _.elm.remove();
            }, 500);
        }
        /**
         * Get or set message
         * @param msg The message
         */
        msg(msg?: string): string | void {
            const msgElm = app.s(this.elm, ".msg");
            if (msg !== undefined) {
                //set message
                msgElm.innerHTML = msg;
            } else {
                //get message
                return msgElm.innerHTML;
            }
        }
    }

    /**
     * Show notification
     * @param msgOrOption
     * @param sticky
     */
    export function notif(msgOrOption: TNotifOpt | string, sticky = false) {
        if (sticky === undefined) sticky = false;
        let opt: TNotifOpt = {};
        if (msgOrOption) {
            if (typeof msgOrOption == "string") {
                opt = {
                    msg: msgOrOption,
                    sticky: sticky
                };
            } else {
                if (msgOrOption.sticky !== undefined) sticky = msgOrOption.sticky;
                opt = msgOrOption;
            }
        }

        return new Notif(opt);
    };

    /**
     * Show error notification
     */
    export function notifError(msg: TNotifOpt | string, sticky?: boolean) {
        var notif = app.ui.notif(msg, sticky);
        app.addClass(notif.elm, "red");
        return notif;
    };

    /**
     * Show success notification
     */
    export function notifSuccess(msg: TNotifOpt | string, sticky?: boolean) {
        var notif = app.ui.notif(msg, sticky);
        app.addClass(notif.elm, "green");
        return notif;
    };
}