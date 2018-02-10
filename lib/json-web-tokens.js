// @flow
import jwtLibrary from 'jsonwebtoken';
import { ERROR_SOURCE } from './constants';
import { errorFactory } from './utils';

type JwtToken = {
    aud:string,
    exp:number,
    email:string,
    email_verified:boolean,
    iat:number,
    iss:string,
    sub:string
};

const messages = {
    expiredToken: ( nowTimestamp:number, expiryTimestamp:number ) => {
        return `It is now ${nowTimestamp}, but the ID token expired at ${expiryTimestamp}.`
    },
    invalidAudience: ( badAudience:string ) => `The ID token has an invalid audience: ${badAudience}.`,
    invalidIssuer: ( badIssuer:string ) => `The ID token has an invalid issuer: ${badIssuer}.`
};

function validateClaims( idToken:JwtToken, auth0Domain:string, clientId:string ):Promise<JwtToken> {
    // The current date/time must be before the expiration date/time listed in the `exp` claim
    const now = Math.floor( Date.now() / 1000 );        // Convert ms to seconds
    if ( now > idToken.exp ) {
        throw errorFactory( messages.expiredToken( now, idToken.exp ), ERROR_SOURCE.JWT.CLAIMS );
    }

    // The `iss` value must match the the URL of your Auth0 tenant
    if ( idToken.iss !== `https://${auth0Domain}/`) {
        throw errorFactory( messages.invalidIssuer( idToken.iss ), ERROR_SOURCE.JWT.CLAIMS );
    }

    // The `aud` value must match the Client ID of your Auth0 Client.
    if ( idToken.aud !== clientId ) {
        throw errorFactory( messages.invalidAudience( idToken.aud ), ERROR_SOURCE.JWT.CLAIMS );
    }

    return Promise.resolve( idToken );
}

function verifySignature( idToken:string, publicKey:Buffer|string ):Promise<JwtToken> {
    return new Promise( ( resolve, reject ) => {
        jwtLibrary.verify( idToken, publicKey, ( error, decodedToken ) => {
            if ( error ) {
                reject( errorFactory( error.message, ERROR_SOURCE.JWT.SIGNATURE ) );
            } else {
                resolve( decodedToken );
            }
        } );
    } );
}

const jwt = {
    validateClaims,
    verifySignature
};

export default jwt;
export { messages };
export type { JwtToken };
