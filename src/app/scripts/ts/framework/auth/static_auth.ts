namespace app.auth {
    const STORAGE_KEY = "logged_as";

    type TStaticAuthOpt = TAuthHandlerOpt & {
        accounts: TAccount[];
    };

    type TAccount = {
        id?: string;
        username: string;
        password: string;
    };

    export class StaticAuth extends AuthHandler {
        ///<param name="client" type="string"></param>
        client: any;
        accounts: { [key: string]: TAccount };

        constructor(opt: TStaticAuthOpt) {
            super(opt);

            if (!opt.accounts) {
                opt.accounts = [];
            }

            this.accounts = {};

            for (var i = 0; i < opt.accounts.length; i++) {
                var acc = opt.accounts[i];
                this.accounts[acc.username] = acc;
            }
        }

        setUser(user: TAccount) {
            userID = user.id;
            userName = user.username
        }

        init(param: TAuthHandlerInitOpt) {
            let ini = this;

            ini.login = function (uname, pwd) {
                var user = ini.accounts[uname];

                if (user) {
                    //login success
                    //save to session
                    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
                        uname: uname,
                        pwd: pwd
                    }));

                    //continue app process
                    param.onLoggedIn();
                } else {
                    //login fail
                    ui.notifError("Username and password missmatch");

                    param.onLoginFail();
                }
            }

            ini.logout = function () {
                //clear from session
                sessionStorage.removeItem(STORAGE_KEY);

                param.onLoggedOut();
            }

            //check if logged in
            var loggedAs = sessionStorage.getItem(STORAGE_KEY);
            if (loggedAs) {
                ini.setUser(JSON.parse(loggedAs));

                param.onLoggedIn();
            } else {
                //no recent user
                param.onAskLogin();
            }
        };
    }
}