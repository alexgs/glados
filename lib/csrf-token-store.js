// @flow
import crypto from 'crypto';
import debugAgent from 'debug';
import _ from 'lodash';
import type { GladosContext } from '../index';

const CSRF_FIELD = 'glados-csrf';
const debug = debugAgent( 'glados:csrf' );

let store = new Set();

function generateToken() {
    const token = crypto.randomBytes( 32 ).toString( 'base64' );
    csrfTokenStore.storeToken( token );
    return token;
}

function generateTokenAsync():Promise<string> {
    return new Promise( ( resolve, reject ) => {
        crypto.randomBytes( 32, ( error, tokenBuffer ) => {
            if ( error ) {
                reject( error );
            }

            const token = tokenBuffer.toString( 'base64' );
            csrfTokenStore.storeToken( token );
            resolve( token );
        } );
    } );
}

function initialize( context:GladosContext ) {
    if ( store.size > 0 ) {
        throw new Error( messageFactory.storeNotEmpty() );
    }
    context.locals[ CSRF_FIELD ] = store;
}

export const messageFactory = {
    storeHasToken: ( token:string ) => `The store already contains the token ${token}.`,
    storeNotEmpty: () => `The store must be empty.`,
};

/**
 * @private
 *
 * Reset the token store so that `initialize` can be called again. **WARNING:** For use only in **development**
 * and **testing;** use in a production environment may lead to unexpected and unpredictable results.
 */
export function _reset() {
    store = new Set();
}

function storeToken( token:string ) {
    if ( store.has( token ) ) {
        throw new Error( messageFactory.storeHasToken( token ) );
    }
    store.add( token );
}

function verifyToken( token:string ) {
    if ( store.has( token ) ) {
        // TODO Handle the case where `delete` returns false for some reason
        store.delete( token );
        debug( 'Successfully verified token: %s', token );
        return true;
    } else {
        debug( 'Failed to verify token: %s', token );
        return false;
    }
}

const csrfTokenStore = {
    generateToken,
    generateTokenAsync,
    initialize,
    storeToken,
    verifyToken
};

export default csrfTokenStore;
