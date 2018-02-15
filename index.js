// @flow
import debugAgent from 'debug';
import cookies from './lib/cookie-middleware';
import oauth2 from './lib/oauth2';
import session from './lib/session';
import type { UserLookupData, GladosUser } from './lib/user-store';
import type { $Request, $Response, NextFunction } from 'express';
import type { GladosOAuthOptions } from './lib/oauth2';

// TODO --> Prioritized priorities <--
// [1] Signing and encrypting cookies
// [2] Abstraction and in-memory, dev-only module for user data store
// [3] Abstraction and in-memory, dev-only modules for other data stores (i.e. CSRF tokens and sessions)

type GladosContext = {
    locals: { [name: string]: mixed }
}
type GladosRequest = $Request & {
    session:mixed       // Replace with Session Object
};
type GladosOptions = {
    expressApp: GladosContext,
    oauth: GladosOAuthOptions,
    userStore: {
        getOrCreate: ( userData:UserLookupData ) => GladosUser
    }
};

const debug = debugAgent( 'glados:core' );

function configure( options:GladosOptions ) {
    oauth2.configure( options.oauth, options.expressApp );
    session.configureStore( options.expressApp );
}

function getCookieMiddleware() {
    return cookies.getMiddleware();
}

function getSessionMiddleware() {
    return function( request:GladosRequest, response:$Response, next:NextFunction ) {
        if ( request.session ) {
            // The session object **DOES NOT** persist between requests. This never gets called; it's just here to
            // document this behavior
            debug( 'Existing session: %O', request.session );
        } else {
            debug( 'Generating session object' );
            request.session = session.generateSessionObject();
        }
        next();
    }
}

const glados = {
    completeOAuth2: oauth2.completeOAuth2,
    configure,
    generateSessionObject: session.generateSessionObject,
    getCookieMiddleware,
    getDummyHandler: oauth2.getDummyHandler,
    getRequireAuthMiddleware: session.getRequireAuthMiddleware,
    getSessionMiddleware,
    logout: oauth2.logout,
    startOAuth2: oauth2.startOAuth2
};

export default glados;
export type { GladosContext, GladosOptions, GladosRequest };
