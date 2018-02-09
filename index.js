// @flow
import debugAgent from 'debug';
import _ from 'lodash';
import oauth2 from './lib/oauth2';
import session from './lib/session';
import type { UserData, UserDef } from './lib/user-store';
// noinspection NpmUsedModulesInstalled
import type { $Request, $Response, NextFunction } from 'express';

type GladosRequest = $Request & {
    session:any
};

type OptionsObject = {
    expressApp: {
        locals: {}
    },
    oauth: {
        callbackUrl:string,
        clientId:string,
        clientSecret:string,
        domain:string
    },
    userStore: {
        getOrCreate: ( userData:UserData ) => UserDef
    }
};

const debug = debugAgent( 'glados:core' );


// TODO >>> Create a `configure` function here that allows for DI but uses reasonable defaults, then configures the separate submodules
function configure( options:OptionsObject ) {
    if ( !_.has( options, 'expressApp' ) ) {
        throw new Error( messages.optionsMustHaveField( 'an "expressApp"' ) );
    }
    if ( !_.has( options.expressApp, 'locals' ) || !_.isPlainObject( options.expressApp.locals ) ) {
        throw new Error( messages.fieldMustHaveProperty( 'expressApp', 'locals', 'Plain Object', options.expressApp.locals ) );
    }

    // Test `oauth` field and values
    if ( !_.has( options, 'oauth' ) ) {
        throw new Error( messages.optionsMustHaveField( 'an "oauth"' ) );
    }
    if ( !_.has( options.oauth, 'callbackUrl' ) || ( !_.isString( options.oauth.callbackUrl ) ) ) {
        throw new Error( messages.fieldMustHaveProperty( 'oauth', 'callbackUrl', 'string', options.oauth.callbackUrl ) );
    }
    if ( !_.has( options.oauth, 'clientId' ) || ( !_.isString( options.oauth.clientId ) ) ) {
        throw new Error( messages.fieldMustHaveProperty( 'oauth', 'clientId', 'string', options.oauth.clientId ) );
    }
    if ( !_.has( options.oauth, 'clientSecret' ) || ( !_.isString( options.oauth.clientSecret ) ) ) {
        throw new Error( messages.fieldMustHaveProperty( 'oauth', 'clientSecret', 'string', options.oauth.clientSecret ) );
    }
    if ( !_.has( options.oauth, 'domain' ) || ( !_.isString( options.oauth.domain ) ) ) {
        throw new Error( messages.fieldMustHaveProperty( 'oauth', 'domain', 'string', options.oauth.domain ) );
    }

    if ( !_.has( options, 'userStore' ) ) {
        throw new Error( messages.optionsMustHaveField( 'a "userStore"' ) );
    }


}

function getCookieMiddleware() {
    // TODO >>> Copy the guts of the `cookie-parser` library here
    // TODO >>> Implement signing and encrypting cookies
}

function getSessionMiddleware() {
    return function( request:GladosRequest, response:$Response, next:NextFunction ) {
        if ( request.session ) {
            // The session object **DOES NOT** persist between requests. This never gets called; it's just here to
            // document this behavior
            debug( 'Existing session: %O', request.session );
        } else {
            debug( 'Generating new session' );
            request.session = session.generateSessionObject();
        }
        next();
    }
}

export const messages = {
    fieldMustHaveProperty: ( field:string, property:string, expectedType:string, actualValue:any ) => {
        const actualType = typeof property;
        const secondClause = !!actualType
            ? `${property} has value ${actualValue} with type ${actualType}`
            : `${property} is missing or empty`;
        return `The \`${field}\` field (of the \`options\` argument to \`Glados.configure\`) must have a ${property}`
            + ` of type "${expectedType}", but ` + secondClause;
    },
    optionsMustHaveField: ( fieldWithArticle:string ) => {
        // The `fieldsWithArticle` should have double-quotes around the field name (e.g., 'an "awesome"')
        return `The \`options\` argument to \`Glados.configure\` must have ${fieldWithArticle} property.`;
    }
};

const glados = {
    completeOAuth2: oauth2.completeOAuth2,
    configure,
    configureOAuth2: oauth2.configure,
    configureSessionStore: session.configureStore,
    generateSessionObject: session.generateSessionObject,
    getCookieMiddleware,
    getDummyHandler: oauth2.getDummyHandler,
    getRequireAuthMiddleware: session.getRequireAuthMiddleware,
    getSessionMiddleware,
    logout: oauth2.logout,
    startOAuth2: oauth2.startOAuth2
};

export default glados;
