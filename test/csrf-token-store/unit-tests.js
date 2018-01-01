import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import dirtyChai from 'dirty-chai';
import _ from 'lodash';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import url from 'url';
import defaultCsrfStore from '../../lib/csrf-token-store';

import session from '../../lib/session';

chai.use( sinonChai );
chai.use( chaiAsPromised );
chai.use( dirtyChai );

// TODO >>> Add tests for `verifyToken` and other functions with failure modes <<<

describe( 'Glados includes a CRSF Token Store module that', function() {
    context( '(working with "Chai as Promised")', function() {
        it( 'passes one canary test', function() {
            return expect( Promise.resolve( 2 + 2 ) ).to.eventually.equal( 4 );
        } );

        it( 'passes another canary test', function( done ) {
            expect( Promise.resolve( 2 + 2 ) ).to.eventually.equal( 4 ).and.notify( done );
        } );
    } );

    context( 'has a function `initialize`, which', function() {
        // TODO >>> Add tests <<<
    } );

    context( 'has a function `storeToken`, which', function() {
        // TODO >>> Add tests <<<
    } );

    context( 'has a function `verifyToken`, which', function() {
        it( 'throws an error if the `token` argument is not a string' );

        context( '(if the token is in the store)', function() {
            it( 'returns true' );

            it( 'removes the token from the store' );
        } );

        it( '(if the token is not the store) returns false', function() {} );
    } );
} );
