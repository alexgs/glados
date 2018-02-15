// @flow
import cookieTools from 'cookie';
import debugAgent from 'debug';
import type { $Response, NextFunction } from 'express';
import type { GladosRequest } from '../index';

const debug = debugAgent( 'glados:cookies' );

function getCookieMiddleware() {
    return function cookieMiddleware( request:GladosRequest, response:$Response, next:NextFunction ) {
        // TODO Copy the guts of the `cookie-parser` library here
        // TODO [1] >>> Implement signing and encrypting cookies <<<

    };
}

const gladosCookies = {
    getMiddleware: getCookieMiddleware
};

export default gladosCookies;
