namespace app {
    /// setup auth
    app.auth.can = function (...permissions: string[]) {
        for (var i = 0; i < permissions.length; i++) {
            if (!app.auth.permissions[permissions[i]]) return false;
        }
        return true;
    }

    app.auth.canUse = function (part: app.Part) {
        var userPermissions = app.auth.permissions;

        if (Array.isArray(part.permissions)) {
            for (var i = 0; i < part.permissions.length; i++) {
                if (!userPermissions[part.permissions[i]]) return false;
            }
        } else if (typeof part.permissions == 'function') {
            return part.permissions(function (perm) {
                return !!userPermissions[perm];
            });
        }
        return true;
    };

    app.auth.canView = function (menu: Menu) {
        var userPermissions = app.auth.permissions;

        if (Array.isArray(menu.permissions)) {
            for (var i = 0; i < menu.permissions.length; i++) {
                if (!userPermissions[menu.permissions[i]]) return false;
            }
        } else if (typeof menu.permissions == 'function') {
            return menu.permissions(function (perm) {
                return !!userPermissions[perm];
            });
        }
        return true;
    };


    /// --------------- PERMISSIONS DECLARATION ------------------
    //
    export const PERMISSION_ADMIN = 'admin';
    export const PERMISSION_DASHBOARD_VIEW = 'dash_v';
}