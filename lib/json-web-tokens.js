import jwtLibrary from 'jsonwebtoken';
import { ERROR_SOURCE } from './constants';
import { errorFactory } from './utils';

function validateClaims( idToken, auth0Domain, clientId ) {
}

function verifySignature( idToken, publicKey ) {
}

const jwt = {
    validateClaims,
    verifySignature
};

export default jwt;
