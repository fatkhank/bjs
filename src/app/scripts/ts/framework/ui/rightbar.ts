namespace app.ui.rightbar {
    const ACTIVE_ATTR = 'is-active';
    const BODY_ELM = app.s('body');
    const HIDE_ANIMATION_DURATION = 300;
    const toggleCurrentUser = document.getElementById('appCurrentUser');
    const viewCurrentUser = document.getElementById('appContentUser');

    type TUser = {
        id: number,
        name: string,
        email: string
    };

    /**
     * Check if rihtbar is shown
     */
    export function isShown() {
        return app.hasAttr(viewCurrentUser, ACTIVE_ATTR);
    }

    /**
     * Show or hide righbar
     * @param isVisible 
     */
    export function show(isVisible = true) {
        if (isVisible) {
            if (isShown()) {
                //already shown
                return;
            }

            //hide menu drawer
            ui.menus.show(false);
            var toggle = ui.menus.switcher.headElm;
            if (toggle) app.remAttr(toggle, ACTIVE_ATTR);

            //show sidebar
            app.show(viewCurrentUser);
            app.attr(viewCurrentUser, ACTIVE_ATTR, 1);
            app.attr(toggleCurrentUser, ACTIVE_ATTR, 1);

            //add control to hide rightbar
            var onclick = BODY_ELM.onclick;
            BODY_ELM.onclick = function (ev) {
                if (app.sup(ev.target, '#appContentUser') == null
                    && app.sup(ev.target, '#appCurrentUser') == null) {
                    //if clicked outside content and toggle
                    show(false);
                    BODY_ELM.onclick = onclick;
                }
            };
        } else {
            //hide rightbar
            app.remAttr(viewCurrentUser, ACTIVE_ATTR);
            app.remAttr(toggleCurrentUser, ACTIVE_ATTR);

            //restore last menu
            var toggle = app.ui.menus.switcher.headElm;
            if (toggle) app.attr(toggle, ACTIVE_ATTR, 1);

            //force hide righbar if menu drawer is shown
            if (ui.menus.isShown()) {
                //skip animation
                app.setClass(viewCurrentUser, 'hidden');
            } else {
                setTimeout(function () {
                    app.setClass(viewCurrentUser, 'hidden');
                }, HIDE_ANIMATION_DURATION);//same as animation duration
            }
        }
    }

    /**
     * Do the setup
     * @param currentUser 
     */
    export function init(currentUser: TUser) {
        //set current user profile
        app.auth.userID = String(currentUser.id);
        app.auth.userName = currentUser.name;

        //display user info

        app.s(toggleCurrentUser, '.currentusername').innerHTML = currentUser.name;
        app.s(viewCurrentUser, '.name').innerHTML = currentUser.name;
        app.s(viewCurrentUser, '.email').innerHTML = currentUser.email;

        //add controls
        app.click(toggleCurrentUser, function () {
            show(true);
            return false;
        }, true);

        //add logout
        app.click(document.getElementById('appBtnLogout'), function () {
            app.auth.handler.logout();
        }, true);

        var formChangePwd = document.getElementById('appFormChangePwd');
        //change password
        app.click(document.getElementById('appBtnChangePwd'), function () {
            var newPwd = (<HTMLInputElement>app.s(formChangePwd, '[name=new_pwd]')).value;
            var newPwd2 = (<HTMLInputElement>app.s(formChangePwd, '[name=new_pwd2]')).value;
            if (newPwd2 != newPwd) return app.ui.notifError(app.getText('pwd_missmatch'));

            var oldPwd = (<HTMLInputElement>app.s(formChangePwd, '[name=old_pwd]')).value;
            app.ui.loading(formChangePwd, xpost(app.url('api/users/change_pwd'), {
                old_pwd: oldPwd,
                new_pwd: newPwd
            }).then(function (response) {
                //success
                app.ui.notifSuccess(app.getText('pwd_changed'));
                app.ui.loading(document.getElementById('appBody'));
                setTimeout(function () {
                    app.auth.handler.logout();
                }, 3000);
            }));
        }, true);
    }
}