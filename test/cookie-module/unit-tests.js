import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import debugAgent from 'debug';
import dirtyChai from 'dirty-chai';
import _ from 'lodash';
import ms from 'ms';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import sodium, * as crypto from '@philgs/sodium';

import gladosCookies from '../../lib/cookies';
import { COOKIE_NAME } from '../../lib/constants';

const debug = debugAgent( 'glados:unit-test' );

chai.use( sinonChai );
chai.use( chaiAsPromised );
chai.use( dirtyChai );

describe.only( 'Glados includes a Cookie module that', function() {

    afterEach( function() {
        gladosCookies._reset();
    } );

    context( 'provides a middleware function that', function() {
        const jsonCookieName = 'json-cookie';
        const jsonCookieData = {
            type: 'chocolate chip',
            nomNomNom: true,
            rating: 5
        };
        const jsonCookieValue = JSON.stringify( jsonCookieData );
        const sessionKey = sodium.newKey();
        const stringCookieName = 'my-awesome-cookie';
        const stringCookieValue = 'chocolate-chip';

        beforeEach( function() {
            gladosCookies.configure( sessionKey, sodium );
            // sandbox.spy( response, 'cookie' );
            // sandbox.spy( crypto, 'encrypt' );
        } );

        it( 'parses an http `Cookie` header and stores cookies on the Express Request object', function( done ) {
            const request = {
                headers: {
                    cookie: `${stringCookieName}=${stringCookieValue}; foo=bar; equation=E%3Dmc%5E2`
                }
            };
            const response = {};

            const middleware = gladosCookies.getMiddleware();
            middleware( request, response, () => {
                expect( _.isPlainObject( request.cookies ) ).to.equal( true );
                expect( _.has( request.cookies, stringCookieName ) ).to.equal( true );
                expect( request.cookies[ stringCookieName ] ).to.equal( stringCookieValue );
                done();
            } );
        } );

        it( 'parses a JSON string from a cookie\'s value into an object', function( done ) {
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

        it( 'decrypts anonymous session data received from the client', function( done ) {
            // Create an encrypted payload for the cookie
            const nonce = sodium.newNonce();
            const plainPayload = sodium.clearFromString( 'Remove the Stone of Shame. Attach the Stone of Triumph!' );
            const cipherPayload = plainPayload.encrypt( sessionKey, nonce );
            const request = {
                headers: {
                    cookie: [
                        `${stringCookieName}=${stringCookieValue}`,
                        `${COOKIE_NAME.NONCE}=${nonce.hex}`,
                        `${jsonCookieName}=${jsonCookieValue}`,
                        `${COOKIE_NAME.SESSION.ANONYMOUS}=${cipherPayload.hex}`
                        ].join(';')
                }
            };
            const response = {};

            const middleware = gladosCookies.getMiddleware();
            middleware( request, response, () => {
                // Test handling of other cookies
                expect( _.isPlainObject( request.cookies ) ).to.equal( true );
                expect( _.has( request.cookies, stringCookieName ) ).to.equal( true );
                expect( request.cookies[ stringCookieName ] ).to.equal( stringCookieValue );
                expect( _.has( request.cookies, jsonCookieName ) ).to.equal( true );
                expect( request.cookies[ jsonCookieName ] ).to.deep.equal( jsonCookieData );

                // Test handling of the anonymous session cookie
                const clearText = request.cookies[ COOKIE_NAME.SESSION.ANONYMOUS ];
                expect( clearText ).to.equal( plainPayload.string );
                done();
            } );
        } );
        
        it( 'decrypts secure session data received from the client', function( done ) {
            // Create an encrypted payload for the cookie
            const nonce = sodium.newNonce();
            const payloadObject = {
                fionaApple: 'Criminal',
                lit: 'My Own Worst Enemy',
                theSofties: 'Charms around Your Wrist',
                theSugarcubes: 'Hit'
            };
            const plainPayload = sodium.clearFromObject( payloadObject );
            const cipherPayload = plainPayload.encrypt( sessionKey, nonce );
            const request = {
                headers: {
                    cookie: [
                        `${stringCookieName}=${stringCookieValue}`,
                        `${COOKIE_NAME.NONCE}=${nonce.hex}`,
                        `${jsonCookieName}=${jsonCookieValue}`,
                        `${COOKIE_NAME.SESSION.SECURE}=${cipherPayload.hex}`
                    ].join(';')
                }
            };
            const response = {};

            const middleware = gladosCookies.getMiddleware();
            middleware( request, response, () => {
                // Test handling of other cookies
                expect( _.isPlainObject( request.cookies ) ).to.equal( true );
                expect( _.has( request.cookies, stringCookieName ) ).to.equal( true );
                expect( request.cookies[ stringCookieName ] ).to.equal( stringCookieValue );
                expect( _.has( request.cookies, jsonCookieName ) ).to.equal( true );
                expect( request.cookies[ jsonCookieName ] ).to.deep.equal( jsonCookieData );

                // Test handling of the anonymous session cookie
                const clearObject = request.cookies[ COOKIE_NAME.SESSION.SECURE ];
                expect( clearObject ).to.deep.equal( plainPayload.json );
                done();
            } );
        } );

        it( 'throws an error if the client sends *both* anonymous and secure session cookies', function( done ) {
            // Create an encrypted payload for the cookie
            const nonce = sodium.newNonce();
            const songs = {
                fionaApple: 'Criminal',
                lit: 'My Own Worst Enemy',
                theSofties: 'Charms around Your Wrist',
                theSugarcubes: 'Hit'
            };
            const objectPayload = sodium.clearFromObject( songs );
            const cipherObjectPayload = objectPayload.encrypt( sessionKey, nonce );
            const stringPayload = sodium.clearFromString( 'Remove the Stone of Shame. Attach the Stone of Triumph!' );
            // **WARNING:** Do **NOT** ever reuse a nonce like this in production!
            const cipherStringPayload = stringPayload.encrypt( sessionKey, nonce );
            const request = {
                headers: {
                    cookie: [
                        `${stringCookieName}=${stringCookieValue}`,
                        `${COOKIE_NAME.SESSION.ANONYMOUS}=${cipherStringPayload.hex}`,
                        `${COOKIE_NAME.NONCE}=${nonce.hex}`,
                        `${jsonCookieName}=${jsonCookieValue}`,
                        `${COOKIE_NAME.SESSION.SECURE}=${cipherObjectPayload.hex}`
                    ].join(';')
                }
            };
            const response = {};

            const middleware = gladosCookies.getMiddleware();
            expect( function() {
                middleware( request, response, () => {
                    // Test handling of other cookies
                    expect( _.isPlainObject( request.cookies ) ).to.equal( true );
                    expect( _.has( request.cookies, stringCookieName ) ).to.equal( true );
                    expect( request.cookies[ stringCookieName ] ).to.equal( stringCookieValue );
                    expect( _.has( request.cookies, jsonCookieName ) ).to.equal( true );
                    expect( request.cookies[ jsonCookieName ] ).to.deep.equal( jsonCookieData );

                    // Test handling of the anonymous session cookie
                    const clearObject = request.cookies[ COOKIE_NAME.SESSION.SECURE ];
                    expect( clearObject ).to.deep.equal( objectPayload.json );
                    done( 'Should not get here!' );
                } )
            } ).to.throw( Error, gladosCookies.messages.illegalCookies() );
            done();
        } );
    } );

    context( 'has a `configure` function that', function() {
        it( 'accepts a `sessionKey` parameter that is used for encrypting session cookies', function() {
            const sessionKey = sodium.newKey();
            gladosCookies.configure( sessionKey );
            expect( gladosCookies.getSessionKey() ).to.equal( sessionKey );
        } );

        it( 'accepts a `cookieCrypto` parameter that provides a library of cryptographic functions', function() {
            const sessionKey = sodium.newKey();
            gladosCookies.configure( sessionKey, sodium );
            expect( gladosCookies.getCrypto() ).to.equal( sodium );
        } );
    } );

    context( 'has a function `getAnonSessionCookie` that', function() {
        const sessionKey = sodium.newKey();

        it( 'returns the cookie payload if the Request object has an anonymous session cookie', function() {
            // Create an encrypted payload for the cookie
            const nonce = sodium.newNonce();
            const plainPayload = sodium.clearFromString( 'Remove the Stone of Shame. Attach the Stone of Triumph!' );
            const cipherPayload = plainPayload.encrypt( sessionKey, nonce );
            const request = {
                cookies: {
                    [COOKIE_NAME.NONCE]: nonce.hex,
                    [COOKIE_NAME.SESSION.ANONYMOUS]: cipherPayload.hex
                }
            };

            // Retrieve the clear payload
            gladosCookies.configure( sessionKey, sodium );
            const clearText = gladosCookies.getAnonSessionCookie( request );
            expect( clearText ).to.equal( plainPayload.string );
        } );

        it( 'returns an object if the payload is a JSON string', function() {
            // Create an encrypted payload for the cookie
            const nonce = sodium.newNonce();
            const payloadObject = {
                fionaApple: 'Criminal',
                lit: 'My Own Worst Enemy',
                theSofties: 'Charms around Your Wrist',
                theSugarcubes: 'Hit'
            };
            const plainPayload = sodium.clearFromObject( payloadObject );
            const cipherPayload = plainPayload.encrypt( sessionKey, nonce );
            const request = {
                cookies: {
                    [COOKIE_NAME.NONCE]: nonce.hex,
                    [COOKIE_NAME.SESSION.ANONYMOUS]: cipherPayload.hex
                }
            };

            // Retrieve the clear payload
            gladosCookies.configure( sessionKey, sodium );
            const clearPayload = gladosCookies.getAnonSessionCookie( request );
            expect( clearPayload ).to.deep.equal( plainPayload.json );
        } );

        it( 'throws an error if the Request object does not have an anonymous session cookie', function() {
            const request = { cookies: {} };

            gladosCookies.configure( sessionKey, sodium );
            expect( function() {
                gladosCookies.getAnonSessionCookie( request );
            } ).to.throw( Error, gladosCookies.messages.noSession( 'anonymous' ) );
        } );
    } );

    context( 'has a function `getSecureSessionCookie` that', function() {
        const sessionKey = sodium.newKey();

        it( 'returns the cookie payload if the Request object has an secure session cookie', function() {
            // Create an encrypted payload for the cookie
            const nonce = sodium.newNonce();
            const plainPayload = sodium.clearFromString( 'Remove the Stone of Shame. Attach the Stone of Triumph!' );
            const cipherPayload = plainPayload.encrypt( sessionKey, nonce );
            const request = {
                cookies: {
                    [COOKIE_NAME.NONCE]: nonce.hex,
                    [COOKIE_NAME.SESSION.SECURE]: cipherPayload.hex
                }
            };

            // Retrieve the clear payload
            gladosCookies.configure( sessionKey, sodium );
            const clearText = gladosCookies.getSecureSessionCookie( request );
            expect( clearText ).to.equal( plainPayload.string );
        } );

        it( 'returns an object if the payload is a JSON string', function() {
            // Create an encrypted payload for the cookie
            const nonce = sodium.newNonce();
            const payloadObject = {
                fionaApple: 'Criminal',
                lit: 'My Own Worst Enemy',
                theSofties: 'Charms around Your Wrist',
                theSugarcubes: 'Hit'
            };
            const plainPayload = sodium.clearFromObject( payloadObject );
            const cipherPayload = plainPayload.encrypt( sessionKey, nonce );
            const request = {
                cookies: {
                    [COOKIE_NAME.NONCE]: nonce.hex,
                    [COOKIE_NAME.SESSION.SECURE]: cipherPayload.hex
                }
            };

            // Retrieve the clear payload
            gladosCookies.configure( sessionKey, sodium );
            const clearPayload = gladosCookies.getSecureSessionCookie( request );
            expect( clearPayload ).to.deep.equal( plainPayload.json );
        } );

        it( 'throws an error if the Request object does not have an secure session cookie', function() {
            const request = { cookies: {} };

            gladosCookies.configure( sessionKey, sodium );
            expect( function() {
                gladosCookies.getSecureSessionCookie( request );
            } ).to.throw( Error, gladosCookies.messages.noSession( 'secure' ) );
        } );
    } );

    context( 'has a function `hasAnonSessionCookie` that', function() {
        it( 'returns `true` if the Request object has an anonymous session cookie and a nonce cookie', function() {
            const request = {
                cookies: {
                    [COOKIE_NAME.NONCE]: 'portmanteau',
                    [COOKIE_NAME.SESSION.ANONYMOUS]: 'jabberwocky'
                }
            };
            const result = gladosCookies.hasAnonSessionCookie( request );
            expect( result ).to.equal( true );
        } );

        it( 'returns `false` if the Request object is missing an anonymous session cookie or a nonce cookie', function() {
            const request = {};
            const noCookies = gladosCookies.hasAnonSessionCookie( request );
            expect( noCookies ).to.equal( false );

            request.cookies = {
                [COOKIE_NAME.SESSION.ANONYMOUS]: 'jabberwocky'
            };
            const missingNonceCookie = gladosCookies.hasAnonSessionCookie( request );
            expect( missingNonceCookie ).to.equal( false );

            request.cookies = {
                [COOKIE_NAME.NONCE]: 'portmanteau'
            };
            const missingSessionCookie = gladosCookies.hasAnonSessionCookie( request );
            expect( missingSessionCookie ).to.equal( false );
        } );
    } );

    context( 'has a function `hasSecureSessionCookie` that', function() {
        it( 'returns `true` if the Request object has a secure session cookie and a nonce cookie', function() {
            const request = {
                cookies: {
                    [COOKIE_NAME.NONCE]: 'portmanteau',
                    [COOKIE_NAME.SESSION.SECURE]: 'jabberwocky'
                }
            };
            const result = gladosCookies.hasSecureSessionCookie( request );
            expect( result ).to.equal( true );
        } );

        it( 'returns `false` if the Request object is missing a secure session cookie or a nonce cookie', function() {
            const request = {};
            const noCookies = gladosCookies.hasSecureSessionCookie( request );
            expect( noCookies ).to.equal( false );

            request.cookies = {
                [COOKIE_NAME.SESSION.SECURE]: 'jabberwocky'
            };
            const missingNonceCookie = gladosCookies.hasSecureSessionCookie( request );
            expect( missingNonceCookie ).to.equal( false );

            request.cookies = {
                [COOKIE_NAME.NONCE]: 'portmanteau'
            };
            const missingSessionCookie = gladosCookies.hasSecureSessionCookie( request );
            expect( missingSessionCookie ).to.equal( false );
        } );
    } );

    context( 'has a function `removeAnonSessionCookie` that', function() {
        let request = null;
        let response = null;
        const sandbox = sinon.createSandbox();
        const sessionKey = sodium.newKey();

        beforeEach( function(  ) {
            request = {
                cookies: {
                    [COOKIE_NAME.NONCE]: 'the next statement is true',
                    [COOKIE_NAME.SESSION.ANONYMOUS]: 'this is a false statement'
                }
            };
            response = {
                clearCookie: ( name, options ) => delete request.cookies[ name ]
            };
            sandbox.spy( response, 'clearCookie' );
        } );

        afterEach( function() {
            sandbox.restore();
        } );

        it( 'removes the anonymous session cookie from the client', function() {
            gladosCookies.configure( sessionKey, sodium );
            gladosCookies.removeAnonSessionCookie( request, response );

            expect( response.clearCookie ).to.have.been.calledTwice();
            expect( response.clearCookie.calledWithExactly(
                COOKIE_NAME.SESSION.ANONYMOUS,
                sinon.match( gladosCookies.COOKIE_OPTIONS.ANONYMOUS )
            ) ).to.equal( true );
            expect( response.clearCookie.calledWithExactly(
                COOKIE_NAME.NONCE,
                sinon.match( gladosCookies.COOKIE_OPTIONS.ANONYMOUS )
            ) ).to.equal( true );
        } );

        it( 'throws an error if the Request object does not have an anonymous session cookie', function() {
            request = { cookies: {} };
            gladosCookies.configure( sessionKey, sodium );

            expect( function() {
                gladosCookies.removeAnonSessionCookie( request, response );
            } ).to.throw( Error, gladosCookies.messages.noSession( 'anonymous' ) );
        } );
    } );

    context( 'has a function `removeSecureSessionCookie` that', function() {
        let request = null;
        let response = null;
        const sandbox = sinon.createSandbox();
        const sessionKey = sodium.newKey();

        beforeEach( function(  ) {
            request = {
                cookies: {
                    [COOKIE_NAME.NONCE]: 'the next statement is true',
                    [COOKIE_NAME.SESSION.SECURE]: 'this is a false statement'
                }
            };
            response = {
                clearCookie: ( name, options ) => delete request.cookies[ name ]
            };
            sandbox.spy( response, 'clearCookie' );
        } );

        afterEach( function() {
            sandbox.restore();
        } );

        it( 'removes the secure session cookie from the client', function() {
            gladosCookies.configure( sessionKey, sodium );
            gladosCookies.removeSecureSessionCookie( request, response );

            expect( response.clearCookie ).to.have.been.calledTwice();
            expect( response.clearCookie.calledWithExactly(
                COOKIE_NAME.SESSION.SECURE,
                sinon.match( gladosCookies.COOKIE_OPTIONS.SECURE )
            ) ).to.equal( true );
            expect( response.clearCookie.calledWithExactly(
                COOKIE_NAME.NONCE,
                sinon.match( gladosCookies.COOKIE_OPTIONS.SECURE )
            ) ).to.equal( true );
        } );

        it( 'throws an error if the Request object does not have an secure session cookie', function() {
            request = { cookies: {} };
            gladosCookies.configure( sessionKey, sodium );

            expect( function() {
                gladosCookies.removeSecureSessionCookie( request, response );
            } ).to.throw( Error, gladosCookies.messages.noSession( 'secure' ) );
        } );
    } );

    context( 'has a function `setAnonSessionCookie` that', function() {
        const payload = 'i-am-a-secret';
        const response = {
            cookie: ( name, value, options ) => undefined
        };
        const sessionKey = sodium.newKey();
        const sandbox = sinon.createSandbox();

        beforeEach( function() {
            gladosCookies.configure( sessionKey, sodium );
            sandbox.spy( response, 'cookie' );
            sandbox.spy( crypto, 'encrypt' );
        } );

        afterEach( function() {
            sandbox.restore();
        } );

        it( 'encrypts the cookie payload', function() {
            gladosCookies.setAnonSessionCookie( response, payload );
            expect( crypto.encrypt ).to.have.been.calledOnce();
        } );

        it( 'sends the payload to the client', function() {
            gladosCookies.setAnonSessionCookie( response, payload );

            expect( response.cookie ).to.have.been.calledTwice();
            expect( response.cookie.calledWithExactly(
                COOKIE_NAME.SESSION.ANONYMOUS,
                sinon.match.string,
                sinon.match( gladosCookies.COOKIE_OPTIONS.ANONYMOUS )
            ) ).to.equal( true );

            // Decrypt the message
            const cipher = sodium.cipherFromHex( response.cookie.args[0][1] );
            const nonce = sodium.nonceFromHex( response.cookie.args[1][1] );
            const clear = cipher.decrypt( sessionKey, nonce );
            expect( clear.string ).to.equal( payload );
        } );

        it( 'sends the encryption nonce to the client', function() {
            gladosCookies.setAnonSessionCookie( response, payload );

            expect( response.cookie ).to.have.been.calledTwice();
            expect( response.cookie.calledWithExactly(
                COOKIE_NAME.NONCE,
                sinon.match.string,
                sinon.match( gladosCookies.COOKIE_OPTIONS.ANONYMOUS )
            ) ).to.equal( true );
        } );
    } );

    context( 'has a function `setSecureSessionCookie` that', function() {
        const payload = {
            fionaApple: 'Criminal',
            lit: 'My Own Worst Enemy',
            theSofties: 'Charms around Your Wrist',
            theSugarcubes: 'Hit'
        };
        const response = {
            cookie: ( name, value, options ) => undefined
        };
        const sessionKey = sodium.newKey();
        const sandbox = sinon.createSandbox();

        beforeEach( function() {
            gladosCookies.configure( sessionKey, sodium );
            sandbox.spy( response, 'cookie' );
            sandbox.spy( crypto, 'encrypt' );
        } );

        afterEach( function() {
            sandbox.restore();
        } );

        it( 'encrypts the cookie payload', function() {
            gladosCookies.setSecureSessionCookie( response, payload );
            expect( crypto.encrypt ).to.have.been.calledOnce();
        } );

        it( 'sends the payload to the client', function() {
            gladosCookies.setSecureSessionCookie( response, payload );

            expect( response.cookie ).to.have.been.calledTwice();
            expect( response.cookie.calledWithExactly(
                COOKIE_NAME.SESSION.SECURE,
                sinon.match.string,
                sinon.match( gladosCookies.COOKIE_OPTIONS.SECURE )
            ) ).to.equal( true );

            // Decrypt the message
            const cipher = sodium.cipherFromHex( response.cookie.args[0][1] );
            const nonce = sodium.nonceFromHex( response.cookie.args[1][1] );
            const clear = cipher.decrypt( sessionKey, nonce );
            expect( clear.json ).to.deep.equal( payload );
        } );

        it( 'sends the encryption nonce to the client', function() {
            gladosCookies.setSecureSessionCookie( response, payload );

            expect( response.cookie ).to.have.been.calledTwice();
            expect( response.cookie.calledWithExactly(
                COOKIE_NAME.NONCE,
                sinon.match.string,
                sinon.match( gladosCookies.COOKIE_OPTIONS.SECURE )
            ) ).to.equal( true );
        } );
    } );
} );
