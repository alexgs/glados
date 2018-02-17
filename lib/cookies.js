// @flow
import cookieTools from 'cookie';
import debugAgent from 'debug';
import _ from 'lodash';
import sodium from '@philgs/sodium';
import type { $Response, NextFunction } from 'express';
import type { GladosRequest } from '../index';

const debug = debugAgent( 'glados:cookies' );

let key:?Buffer = null;

function configure( sessionKey:Buffer ) {
    if ( sessionKey.length < sodium.KEYBYTES ) {
        throw new Error( messages.incorrectKeySize( sessionKey ) );
    }
    if ( key != null ) {
        throw new Error( messages.keyAlreadySet() );
    }
    key = sessionKey;
}

function getCookieMiddleware() {
    return function cookieMiddleware( request:GladosRequest, response:$Response, next:NextFunction ) {
        // If we've already processed cookies, bail
        if ( request.cookies ) {
            return next();
        }

        // If there are no cookies on the Request, bail
        const cookieHeader = request.headers.cookie;
        if ( !cookieHeader ) {
            return next();
        }

        // Parse header and JSON strings
        request.cookies = cookieTools.parse( cookieHeader );
        request.cookies = _.mapValues( request.cookies, value => {
            try {
                return JSON.parse( value );
            } catch( error ) {
                // Continue on `SyntaxError`, rethrow on other error types
                if ( error instanceof SyntaxError ) {
                    return value;
                } else {
                    throw error;
                }
            }
        } );

        // TODO [1] >>> Implement signing and encrypting cookies <<<
        next();
    };
}

function getSessionKey():Buffer {
    if ( key == null ) {
        throw new Error( messages.keyNotSet() );
    }
    return key;
}

const messages = {
    incorrectKeySize: ( badKey:Buffer ) => {
        return `Session key must be ${sodium.KEYBYTES} bytes, but the provided key is only ${badKey.length} bytes.`;
    },
    keyAlreadySet: () => `Attempted to set the session key, but it is already set.`,
    keyNotSet: () => `Attempted to retrieve the session key, but it is not set.`
};

const gladosCookies = {
    configure,
    getMiddleware: getCookieMiddleware,
    getSessionKey,
    messages
};

export default gladosCookies;
