namespace app.auth {
    /**
     * Permissions table
     */
    export var permissions: any;

    /**
     * Current user ID
     */
    export var userID: string;

    /**
     * Current userName
     */
    export var userName: string;

    /**
     * Add authentication to xhr
     */
    export function authXhr(url: string) {
        return handler.authXhr(url);
    }

    /**
     * Add authentication to url
     */
    export function authUrl(url: string) {
        return handler.authUrl(url);
    }

    /**
     * Check if user can do something
     */
    export function can(...permissions: string[]) {
        return true;
    }

    /**
     * Check if use can load part
     * @param permissions
     */
    export function canUse(part: app.Part) {
        return true;
    }

    /**
     * Check if user can view menu
     * @param menu
     */
    export function canView(menu: app.Menu) {
        return true;
    }

    /**
     * This controll how authentication work.
     */
    export var handler: AuthHandler;

    export type TAuthHandlerOpt = {

    };

    /**
     * Base class of handler
     */
    export class AuthHandler {
        /**
         * Check/Ensure token is valid, then do something
         */
        check() {
            return xget(app.url('oauth/check'));
        }

        /**
         * Check if response contain auth error (not authorized)
         * @param response
         */
        isError(response: string) {
            return false;
        }

        /**
         * Do the login process
         */
        login(uname: string, pwd: string) {

        }

        /**
         * Logout
         */
        logout() {

        }

        /**
         * Reset auth cookie in server, this will ensure auth cookie is set to
         * correct user for current application instance.
         */
        resetCookie(): Promise<any> {
            return PROMISE_NULL;
        }

        /**
         * Add authentication to url
         */
        authUrl(url: string) { }
    
        /**
         * Add authentication to url
         */
        authXhr(xhr: string) { }

        constructor(opt: TAuthHandlerOpt) { }

        init(param: TAuthHandlerInitOpt) { }
    }

    export type TAuthHandlerInitOpt = {
        onAskLogin: () => void,
        onLoginFail: () => void,
        onLoggedIn: () => void,
        onLoggedOut: () => void
    };

    /**
     * Start the auth process
     * @param param 
     */
    export function init(param: TAuthHandlerInitOpt) {
        if (!handler) {
            console.error("Auth handler not set.");
        }

        handler.init(param);
    }
}