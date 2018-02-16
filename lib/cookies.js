// @flow
import cookieTools from 'cookie';
import debugAgent from 'debug';
import _ from 'lodash';
import type { $Response, NextFunction } from 'express';
import type { GladosRequest } from '../index';

const debug = debugAgent( 'glados:cookies' );

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

const gladosCookies = {
    getMiddleware: getCookieMiddleware
};

export default gladosCookies;
