import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import debugAgent from 'debug';
import dirtyChai from 'dirty-chai';
import _ from 'lodash';
import ms from 'ms';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import sodium from '@philgs/sodium';

import gladosCookies from '../../lib/cookies';

const debug = debugAgent( 'glados:unit-test' );

chai.use( sinonChai );
chai.use( chaiAsPromised );
chai.use( dirtyChai );

describe.only( 'Glados includes a Cookie module that', function() {
    context( 'has a `configure` function, which', function() {

        beforeEach( function() {
            gladosCookies._reset();
        } );

        it( 'accepts a `sessionKey` parameter that is used for encrypting session cookies', function() {
            const sessionKey = sodium.key();
            gladosCookies.configure( sessionKey );
            expect( gladosCookies.getSessionKey() ).to.equal( sessionKey );
        } );

        it( 'accepts a `cookieCrypto` parameter that provides a library of cryptographic functions', function() {
            const sessionKey = sodium.key();
            gladosCookies.configure( sessionKey, sodium );
            expect( gladosCookies.getCrypto() ).to.equal( sodium );
        } );

        it( 'throws an error if the `sessionKey` is the wrong length', function() {
            const sessionKey = Buffer.from( 'I am a bad key.' );
            expect( function() {
                gladosCookies.configure( sessionKey );
            } ).to.throw( Error, gladosCookies.messages.incorrectKeySize( sessionKey ) );
        } );
    } );

    context( 'provides a middleware function that', function() {
        it( 'parses an http `Cookie` header and stores cookies on the Express Request object', function( done ) {
            const cookieName = 'my-awesome-cookie';
            const cookieValue = 'chocolate-chip';
            const request = {
                headers: {
                    cookie: `${cookieName}=${cookieValue}; foo=bar; equation=E%3Dmc%5E2`
                }
            };
            const response = {};

            const middleware = gladosCookies.getMiddleware();
            middleware( request, response, () => {
                expect( _.isPlainObject( request.cookies ) ).to.equal( true );
                expect( _.has( request.cookies, cookieName ) ).to.equal( true );
                expect( request.cookies[ cookieName ] ).to.equal( cookieValue );
                done();
            } );
        } );

        it( 'parses a JSON string from a cookie\'s value into an object', function( done ) {
            const jsonCookieName = 'json-cookie';
            const jsonCookieData = {
                type: 'chocolate chip',
                nomNomNom: true,
                rating: 5
            };
            const jsonCookieValue = JSON.stringify( jsonCookieData );
            const stringCookieName = 'my-awesome-cookie';
            const stringCookieValue = 'chocolate-chip';
            const request = {
                headers: {
                    cookie: `${stringCookieName}=${stringCookieValue}; ${jsonCookieName}=${jsonCookieValue}`
                }
            };
            const response = {};

            const middleware = gladosCookies.getMiddleware();
            middleware( request, response, () => {
                expect( _.isPlainObject( request.cookies ) ).to.equal( true );
                expect( _.has( request.cookies, stringCookieName ) ).to.equal( true );
                expect( request.cookies[ stringCookieName ] ).to.equal( stringCookieValue );
                expect( _.has( request.cookies, jsonCookieName ) ).to.equal( true );
                expect( request.cookies[ jsonCookieName ] ).to.deep.equal( jsonCookieData );
                done();
            } );
        } );

        it( 'decrypts data received from the client' );
        it( 'verifies data received from the client' );
    } );

    it( 'has a function `hasAnonSessionCookie` that' );
    it( 'has a function `getAnonSessionCookie` that' );
    it( 'has a function `removeAnonSessionCookie` that' );
    context( 'has a function `setAnonSessionCookie` that', function() {
        it( 'encrypts data before sending to the client' );
        it( 'signs data before sending to the client' );
    } );

    it( 'has a function `hasSecureSessionCookie` that' );
    it( 'has a function `getSecureSessionCookie` that' );
    it( 'has a function `removeSecureSessionCookie` that' );
    context( 'has a function `setSecureSessionCookie` that', function() {
        it( 'encrypts data before sending to the client' );
        it( 'signs data before sending to the client' );
    } );
} );
