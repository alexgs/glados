import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import jwtLibrary from 'jsonwebtoken';
import _ from 'lodash';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import jwt from '../../lib/json-web-tokens';

chai.use( sinonChai );
chai.use( dirtyChai );

describe( 'Glados includes a JWT module that', function() {
    context( 'has a `validateClaims` function, which returns a Promise that', function() {
        context( 'throws an error if the token', function() {
            it( 'has expired' );

            it( 'has an invalid issuer' );

            it( 'has an invalid audience' );
        } );
    } );

    context( 'has a `verifySignature` function, which returns a Promise that', function() {
        it( 'rejects with an Error if verification fails' );

        it( 'resolves with a decoded token if verification succeeds' );
    } );
} );
