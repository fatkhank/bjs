//parse env variables
let ENV: {
    part_url: string,
    base_url: string,
    base_api_url: string,
    app_debug: boolean,
    auth: string,
} = (<any>window).ENV;

interface IInput<V = any> {
    val: (value?: V) => V
}

interface Window {
    app: any;
    //hack
    Promise: any;
    $: any;
}

/**
 * b.js framework
 * https://github.com/fatkhank/bjs/
 */
namespace app {
    //--- DECLARE APP COMPONENTS
    //---- app elms
    /**
     * The head elm
     */
    export var headElm = document.getElementById("appHeader");
    /**
     * The app body elm
     */
    export var bodyElm = document.getElementById("appBody");
    /**
     * Application name (defined in meta in document.head section)
     */
    export var appName = document.head.querySelector("[name=application-name]").getAttribute("content");

    /**
     * Read konfiguration in ENV.js
     * @param key env key name
     */
    export function env(key: string, nullVal = null) {
        var keys = key.split(".");
        var env = (<any>window).ENV;
        
        for (var i = 0; i < keys.length; i++) {
            env = env[keys[i]];
            if (!env) {
                break;
            }
        }
        return i >= keys.length ? env : nullVal;
    }
    //---------------- TYPES ------------------------------
    export type TInputOpt<V = any> = {
        /**
         * Set input value
         */
        value?: V,
        /**
         * Enable input
         */
        enable?: boolean,
        /**
         * Set input to be required
         */
        required?: boolean,
    };
    export abstract class Input<V = any> implements IInput {
        elm: HTMLElement;

        abstract val(val?: V): V;

        /**
         * Set input enable or not
         */
        enable(isEnable?: boolean): boolean | void {
            return true;
        }

        required(isRequired?: boolean): (boolean | void) {
            return false;
        }

        /**
         * Set focus
         */
        focus() { }

        /**
         * Cek if valid
         */
        isValid() {
            return true;
        };

        constructor(elm: HTMLElement) {
            var _ = this;
            _.elm = elm;
            if (!elm) {
                console.error("Cannot create input from null elm ");
            }
        }

        opt(option: TInputOpt) {
            var _ = this;
            //read option
            if (option) {
                if (option.value !== undefined) _.val(option.value);
                if (option.enable !== undefined) _.enable(option.enable);
                if (option.required !== undefined) _.required(option.required);
            }

            return _;
        }

        /**
         * Override this func to intercept onchange
         */
        onchange(inputObj, value: V, isFromUser: boolean) { };
    }
}