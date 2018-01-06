import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import debugAgent from 'debug';
import dirtyChai from 'dirty-chai';
import _ from 'lodash';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { ERROR_SOURCE, SESSION_DOCUMENT } from '../../lib/constants';
import sessionStore from '../../lib/session-store';
import userStore from '../../lib/user-store';

import session, { getAnonSessionName, getSecureSessionName } from '../../lib/session';

const debug = debugAgent( 'glados:unit-test' );

chaiAsPromised.transferPromiseness = function( assertion, promise ) {
    // assertion.then = Promise.then.bind( promise );
    assertion.then = promise.then.bind( promise );
};

chai.use( sinonChai );
chai.use( chaiAsPromised );
chai.use( dirtyChai );

describe( 'Glados includes a Session module that', function() {
    context( 'adds a `session` object to the the Express Request object, which', function() {
        it( 'can be accessed on the `request` object', function() {
            const sessionObject = session.generateSessionObject();
            const request = {
                session: session.generateSessionObject()
            };
            expect( request.session ).to.deep.equal( sessionObject );

        } );

        context( 'has a function `isAuthenticated` that', function() {
            let request = null;
            let secureTokenValue = 'Many years ago, you served my father in the clone wars.';

            beforeEach( function() {
                request = null;
            } );

            it( 'returns true if the request includes a valid secure cookie', function() {
                request = {
                    cookies: {
                        [ getSecureSessionName() ]: secureTokenValue
                    },
                    session: session.generateSessionObject()
                };
                const storeStub = sinon.stub( sessionStore, 'get' ).returns( 'Death Star Schematics' );

                expect( request.session.isAuthenticated( request ).value ).to.equal( true );
                storeStub.restore();
            } );

            it( 'returns false if the request includes an invalid secure cookie', function() {
                request = {
                    cookies: {
                        [ getSecureSessionName() ]: secureTokenValue
                    },
                    session: session.generateSessionObject()
                };
                const storeStub = sinon.stub( sessionStore, 'get' ).returns( false );

                expect( request.session.isAuthenticated( request ).value ).to.equal( false );
                storeStub.restore();
            } );

            it( 'returns false if the request does not include a secure cookie', function() {
                request = {
                    cookies: {
                        'bad-cookie-name' : secureTokenValue
                    },
                    session: session.generateSessionObject()
                };
                const storeStub = sinon.stub( sessionStore, 'get' ).returns( 'Death Star Schematics' );

                expect( request.session.isAuthenticated( request ).value ).to.equal( false );
                storeStub.restore();
            } );
        } );
    } );

    context( 'has a `getRequireAuthMiddleware` function, which returns a middleware function that', function() {
        const authFailureResult = {
            value: false,
            reason: ERROR_SOURCE.SECURE_SESSION.INVALID
        };
        const authSuccessResult = {
            value: true,
            reason: null
        };
        let fakeUserRecord = {
            email: 'me@me.me',
            providers: [ 'google|987fed654cba000' ],
            id: 'asdf-qwerty'
        };

        context( 'can upgrade an "anonymous session" to a "secure session" with the following rules:', function() {
            const anonTokenValue = 'Help me, Obi-wan. You\'re my only hope';
            const loginPage = '/login';
            let middleware = null;
            let request = null;
            let response = null;
            const sandbox = sinon.createSandbox();
            const secureTokenValue = 'Many years ago, you served my father in the clone wars.';

            beforeEach( function() {
                // Restore original functions
                sandbox.restore();

                middleware = null;
                request = {
                    cookies: { [ getAnonSessionName() ]: anonTokenValue },
                    session: { isAuthenticated: sandbox.stub().returns( authSuccessResult ) }
                };
                response = {
                    clearCookie: sandbox.stub(),
                    cookie: sandbox.stub(),
                    redirect: sandbox.stub()
                };
            } );

            after( function() {
                sandbox.restore();
            } );

            it( 'valid anonymous session   --> success', function( done ) {
                function runTests() {
                    expect( sessionStore.get ).to.have.been.calledOnce();
                    expect( sessionStore.get ).to.have.been.calledWith( anonTokenValue );

                    expect( request.cookies[ getSecureSessionName() ] ).to.equal( anonTokenValue );

                    expect( response.clearCookie ).to.have.been.calledOnce();
                    const clearCookieArgs = response.clearCookie.args[0];
                    expect( clearCookieArgs[0] ).to.equal( getAnonSessionName() );

                    expect( response.cookie ).to.have.been.calledOnce();
                    const setCookieArgs = response.cookie.args[0];
                    expect( setCookieArgs[0] ).to.equal( getSecureSessionName() );
                    expect( setCookieArgs[1] ).to.equal( anonTokenValue );

                    expect( response.redirect.notCalled ).to.equal( true );
                    done();
                }
                response.redirect = sandbox.stub().callsFake( runTests );
                sandbox.stub( sessionStore, 'get' ).returns( {
                    jwtToken: 'fake-token',
                    type: SESSION_DOCUMENT.TYPE.ANONYMOUS
                } );
                sandbox.stub( userStore, 'getOrCreate' ).returns( fakeUserRecord );

                middleware = session.getRequireAuthMiddleware( loginPage );
                middleware( request, response, runTests );
            } );

            it( 'invalid anonymous session --> failure', function( done ) {
                function runTests() {
                    expect( sessionStore.get ).to.have.been.calledOnce();
                    expect( sessionStore.get ).to.have.been.calledWith( anonTokenValue );
                    expect( response.redirect ).to.have.been.calledOnce();
                    expect( response.redirect ).to.have.been.calledWith( loginPage );
                    expect( response.clearCookie.notCalled ).to.equal( true );
                    expect( response.cookie.notCalled ).to.equal( true );
                    done();
                }
                response.redirect = sandbox.stub().callsFake( runTests );
                sandbox.stub( sessionStore, 'get' ).returns( false );

                middleware = session.getRequireAuthMiddleware( loginPage );
                middleware( request, response, runTests );
            } );

            it( 'missing anonymous session --> failure', function( done ) {
                function runTests() {
                    expect( sessionStore.get.notCalled ).to.equal( true );
                    expect( response.redirect ).to.have.been.calledOnce();
                    expect( response.redirect ).to.have.been.calledWith( loginPage );
                    expect( response.clearCookie.notCalled ).to.equal( true );
                    expect( response.cookie.notCalled ).to.equal( true );
                    done();
                }
                delete request.cookies[ getAnonSessionName() ];
                response.redirect = sandbox.stub().callsFake( runTests );
                sandbox.stub( sessionStore, 'get' );

                middleware = session.getRequireAuthMiddleware( loginPage );
                middleware( request, response, runTests );
            } );

            it( 'valid secure session      --> no change', function( done ) {
                function runTests() {
                    expect( request.session.isAuthenticated ).to.be.calledOnce();
                    expect( request.session.isAuthenticated ).to.be.calledWith( request );
                    expect( response.redirect.notCalled ).to.equal( true );
                    done();
                }
                delete request.cookies[ getAnonSessionName() ];
                request.cookies[ getSecureSessionName() ] = secureTokenValue;

                const middleware = session.getRequireAuthMiddleware( loginPage );
                middleware( request, response, runTests );
            } );
        } );

        it( '(if successfully upgrading an "anonymous session") stores customized user data in the Session Store', function( done ) {
            // Initialize a first round of variables
            const jwtToken = {
                email: 'slim@pickens.com',
                iss: 'https://blazing.saddl.es',
                aud: 'Mel Brooks',
                sub: 'auth0|123abc456def7890'
            };
            const sandbox = sinon.createSandbox();
            const sessionId = 'What in the Wide Wide World of Sports';
            const userId = 'strangelove';

            // Initialize a second round of variables
            const anonSession = getAnonSessionName();
            const anonSessionDocument = {
                jwtToken,
                type: SESSION_DOCUMENT.TYPE.ANONYMOUS
            };
            fakeUserRecord = {
                email: jwtToken.email,
                providers: [ jwtToken.sub ],
                id: userId
            };
            const loginPage = '/login';
            const request = {
                cookies: { [ anonSession ]: sessionId },
                session: session.generateSessionObject()
            };
            const response = {
                clearCookie: sandbox.stub(),
                cookie: sandbox.stub()
            };
            const secureSession = getSecureSessionName();
            const secureSessionDocument = {
                email: jwtToken.email,
                id: sessionId,
                providers: [ jwtToken.sub ],
                type: SESSION_DOCUMENT.TYPE.SECURE,
                userId
            };

            // Store the anonymous session
            sessionStore.upsert( sessionId, anonSessionDocument );

            // Setup spies and stubs
            sandbox.spy( sessionStore, 'delete' );
            // sandbox.stub( sessionStore, 'get' ).returns( anonSessionDocument );
            sandbox.spy( sessionStore, 'get' );
            sandbox.spy( sessionStore, 'upsert' );
            sandbox.stub( userStore, 'getOrCreate' ).returns( fakeUserRecord );

            function runTests() {
                // Test spies and stubs
                // expect( sessionStore.get ).to.have.been.calledTwice();
                expect( sessionStore.get.callCount ).to.be.at.least( 1 );
                expect( sessionStore.get.callCount ).to.be.at.most( 2 );
                expect( sessionStore.get ).to.have.been.calledWith( sessionId );
                expect( sessionStore.get ).to.have.returned( anonSessionDocument );
                expect( sessionStore.delete ).to.have.been.calledOnce();
                expect( sessionStore.delete ).to.have.been.calledWith( sessionId );
                expect( userStore.getOrCreate ).to.have.been.calledOnce();
                expect( userStore.getOrCreate ).to.have.been.calledWith( {
                    email: jwtToken.email,
                    providerId: jwtToken.sub
                } );
                expect( userStore.getOrCreate ).to.have.returned( fakeUserRecord );
                expect( sessionStore.upsert ).to.have.been.calledOnce();
                expect( sessionStore.upsert ).to.have.been.calledWith( sessionId, secureSessionDocument );

                // Test cookies
                expect( _.has( request.cookies, anonSession ) ).to.equal( false );
                expect( _.has( request.cookies, secureSession ) ).to.equal( true );

                // Test session
                const actualSessionDoc = sessionStore.get( sessionId );
                expect( actualSessionDoc ).to.be.ok();
                expect( _.has( actualSessionDoc, 'type' ) ).to.equal( true );
                expect( actualSessionDoc.type ).to.equal( SESSION_DOCUMENT.TYPE.SECURE );

                sandbox.restore();
                done();
            }

            const middleware = session.getRequireAuthMiddleware( loginPage );
            middleware( request, response, runTests );
        } );

        context( 'redirects to a login page if', function() {
            const anonTokenValue = 'Help me, Obi-wan. You\'re my only hope';
            const loginPage = '/login';
            let middleware = null;
            let request = null;
            let response = null;
            const sandbox = sinon.createSandbox();
            const secureTokenValue = 'Many years ago, you served my father in the clone wars.';

            beforeEach( function() {
                // Start with a pristine sandbox
                sandbox.restore();

                middleware = null;
                request = {
                    cookies: { [ getAnonSessionName() ]: anonTokenValue },
                    session: { isAuthenticated: sandbox.stub().returns( authFailureResult ) }
                };
                response = {
                    redirect: sandbox.stub()
                };
            } );

            after( function() {
                sandbox.restore();
            } );

            it( 'the anonymous session is invalid', function( done ) {
                function runTests() {
                    expect( sessionStore.get ).to.have.been.calledOnce();
                    expect( sessionStore.get ).to.have.been.calledWith( anonTokenValue );
                    expect( response.redirect ).to.have.been.calledOnce();
                    expect( response.redirect ).to.have.been.calledWith( loginPage );
                    expect( request.session.isAuthenticated.notCalled ).to.equal( true );
                    done();
                }
                response.redirect = sandbox.stub().callsFake( runTests );
                sandbox.stub( sessionStore, 'get' ).returns( false );

                middleware = session.getRequireAuthMiddleware( loginPage );
                middleware( request, response, runTests );
            } );

            it( 'the anonymous session is missing', function( done ) {
                function runTests() {
                    expect( sessionStore.get.notCalled ).to.equal( true );
                    expect( response.redirect ).to.have.been.calledOnce();
                    expect( response.redirect ).to.have.been.calledWith( loginPage );
                    expect( request.session.isAuthenticated.notCalled ).to.equal( true );
                    done();
                }
                request.cookies = {};
                response.redirect = sandbox.stub().callsFake( runTests );
                sandbox.stub( sessionStore, 'get' ).returns( false );

                middleware = session.getRequireAuthMiddleware( loginPage );
                middleware( request, response, runTests );
            } );

            it( 'the secure session is invalid', function( done ) {
                function runTests() {
                    expect( request.session.isAuthenticated ).to.have.been.calledOnce();
                    expect( request.session.isAuthenticated ).to.have.been.calledWith( request );
                    expect( request.session.isAuthenticated ).to.have.returned( authFailureResult );
                    expect( sessionStore.get ).to.have.been.calledOnce();
                    expect( sessionStore.get ).to.have.been.calledWith( secureTokenValue );
                    expect( response.redirect ).to.have.been.calledOnce();
                    expect( response.redirect ).to.have.been.calledWith( loginPage );
                    done();
                }
                request.session = session.generateSessionObject();
                sandbox.spy( request.session, 'isAuthenticated' );

                request.cookies = { [ getSecureSessionName() ]: secureTokenValue };
                response.redirect = sandbox.stub().callsFake( runTests );
                sandbox.stub( sessionStore, 'get' ).returns( false );

                middleware = session.getRequireAuthMiddleware( loginPage );
                middleware( request, response, runTests );
            } );

            it.skip( 'the secure session is missing', function() {
                // There is currently no way to test this. The request must have a valid secure session to exit from
                // `upgradeAnonSession` without an error. At this point, the request definitely contains a secure
                // session cookie. Somehow, the secure session cookie would have to be deleted from `request.cookies`
                // **before** `isAuthenticated` is invoked.
                //
                // With the current control flow, there is no way to do this.
            } );

            it( 'there is no session whatsoever', function( done ) {
                function runTests() {
                    expect( response.redirect ).to.have.been.calledOnce();
                    expect( response.redirect ).to.have.been.calledWith( loginPage );
                    done();
                }
                request.cookies = {};
                response.redirect = sandbox.stub().callsFake( runTests );

                middleware = session.getRequireAuthMiddleware( loginPage );
                middleware( request, response, runTests );
            } );

        } );

        context( 'can authenticate a user in a "secure session" according to the following rules:', function() {
            const loginPage = '/login';
            let middleware = null;
            let request = null;
            let response = null;
            const sandbox = sinon.createSandbox();
            const secureTokenValue = 'Many years ago, you served my father in the clone wars.';

            beforeEach( function() {
                // Start with a pristine sandbox
                sandbox.restore();

                middleware = null;
                request = {
                    cookies: { [ getSecureSessionName() ]: secureTokenValue },
                    session: session.generateSessionObject()
                };
                response = {
                    redirect: sinon.stub()
                };
            } );

            after( function() {
                sandbox.restore();
            } );

            it( 'valid secure session   --> success', function( done ) {
                function runTests() {
                    expect( request.session.isAuthenticated ).to.have.been.calledOnce();
                    expect( request.session.isAuthenticated ).to.have.been.calledWith( request );
                    expect( request.session.isAuthenticated ).to.have.returned( authSuccessResult );
                    expect( response.redirect.notCalled ).to.equal( true );
                    done();
                }
                sandbox.stub( sessionStore, 'get' ).returns( true );
                sandbox.spy( request.session, 'isAuthenticated' );

                response = {
                    redirect: sinon.stub().callsFake( runTests )
                };

                const middleware = session.getRequireAuthMiddleware( loginPage );
                middleware( request, response, runTests );
            } );

            it( 'invalid secure session --> failure', function( done ) {
                function runTests() {
                    expect( request.session.isAuthenticated ).to.have.been.calledOnce();
                    expect( request.session.isAuthenticated ).to.have.been.calledWith( request );
                    expect( request.session.isAuthenticated ).to.have.returned( authFailureResult );
                    expect( response.redirect ).to.have.been.calledOnce();
                    expect( response.redirect ).to.have.been.calledWith( loginPage );
                    expect( sessionStore.get ).to.have.been.calledOnce();
                    expect( sessionStore.get ).to.have.been.calledWith( secureTokenValue );
                    done();
                }
                sandbox.stub( sessionStore, 'get' ).returns( false );
                sandbox.spy( request.session, 'isAuthenticated' );
                response = {
                    redirect: sandbox.stub().callsFake( runTests )
                };

                middleware = session.getRequireAuthMiddleware( loginPage );
                middleware( request, response, runTests );
            } );

            it( 'missing secure session --> failure', function( done ) {
                // For this case, both the anonymous session and the secure session are missing
                function runTests() {
                    expect( request.session.isAuthenticated.notCalled ).to.equal( true );
                    expect( response.redirect ).to.have.been.calledOnce();
                    expect( response.redirect ).to.have.been.calledWith( loginPage );
                    expect( sessionStore.get.notCalled ).to.equal( true );
                    done();
                }
                sandbox.stub( sessionStore, 'get' ).returns( false );
                sandbox.spy( request.session, 'isAuthenticated' );
                request.cookies = {};
                response = {
                    redirect: sandbox.stub().callsFake( runTests )
                };

                middleware = session.getRequireAuthMiddleware( loginPage );
                middleware( request, response, runTests );
            } );
        } );
    } );

    context( 'has a `getSessionKey` function, which', function() {
        it( 'throws an error if the session key path has not been set' );

        it( 'reads a text file and returns its contents' );
    } );

    context( 'has a `storeJwtToken` function, which', function() {
        it( 'stores the session ID and JWT token in the session store', function( done ) {
            const sessionId = 'What in the Wide Wide World of Sports';
            const jwtIdToken = {
                email: 'slim@pickens.com',
                iss: 'https://blazing.saddl.es',
                aud: 'Mel Brooks'
            };
            const storeDocument = {
                jwtToken: jwtIdToken,
                type: SESSION_DOCUMENT.TYPE.ANONYMOUS
            };
            const storeStub = sinon.stub( sessionStore, 'upsert' );

            session.storeJwtToken( sessionId, jwtIdToken )
                .then( () => {
                    expect( storeStub ).to.have.been.calledOnce();
                    expect( storeStub ).to.have.been.calledWith( sessionId, storeDocument );
                    storeStub.restore();
                    done();
                } );
        } );

        it( 'returns a Promise that resolves to an object with `jwtToken` and `sessionId` fields', function( done ) {
            const sessionId = 'What in the Wide Wide World of Sports';
            const jwtIdToken = {
                email: 'slim@pickens.com',
                iss: 'https://blazing.saddl.es',
                aud: 'Mel Brooks'
            };

            session.storeJwtToken( sessionId, jwtIdToken )
                .then( result => {
                    expect( result.jwtToken ).to.deep.equal( jwtIdToken );
                    expect( result.sessionId ).to.equal( sessionId );
                    done();
                } );
        } );
    } );

    context( 'has a `setAnonymousSession` function, which', function() {
        let cookieStub = null;
        let jwtToken = null;
        let request = null;
        let response = null;
        let sessionId = null;

        beforeEach( function() {
            sessionId = 'a-really-unique-session-id-1-2-3';
            jwtToken = 'thats-the-combination-to-my-luggage';
            cookieStub = sinon.stub();

            request = {
                cookies: {
                    [ getAnonSessionName() ]: sessionId
                }
            };
            response = {
                cookie: cookieStub
            };
        } );

        context( 'returns a Promise that', function() {
            it( '(if the cookie is sent from the client) resolves with the session ID and JWT token', function( done ) {
                session.setAnonymousSession( request, response, jwtToken )
                    .then( ( result ) => {
                        expect( result.jwtToken ).to.equal( jwtToken );
                        expect( result.sessionId ).to.equal( request.cookies[ getAnonSessionName() ] );
                        done();
                    } );
            } );

            context( '(if the cookie is not sent by the client)', function() {
                it( 'sends a cookie to the client', function( done ) {
                    cookieStub = sinon.stub().callsFake( ( cookieName, cookieData, cookieOptions ) => {
                        expect( cookieName ).to.equal( getAnonSessionName() );
                        expect( typeof cookieData ).to.equal( 'string' );
                    } );
                    request = {};
                    response = {
                        cookie: cookieStub
                    };

                    session.setAnonymousSession( request, response, jwtToken )
                        .then( result => {
                            expect( cookieStub ).to.have.been.calledOnce();
                            done();
                        } );
                } );

                it( 'resolves with the session ID and JWT token', function( done ) {
                    cookieStub = sinon.stub().callsFake( ( cookieName, cookieData, cookieOptions ) => {
                        debug( 'Cookie Name: %s', cookieName );
                        debug( 'Cookie Data: %s', cookieData );
                        expect( cookieName ).to.equal( getAnonSessionName() );
                        expect( typeof cookieData ).to.equal( 'string' );
                        sessionId = cookieData;
                    } );
                    request = {};
                    response = {
                        cookie: cookieStub
                    };

                    session.setAnonymousSession( request, response, jwtToken )
                        .then( ( result ) => {
                            expect( result.jwtToken ).to.equal( jwtToken );
                            expect( result.sessionId ).to.equal( sessionId );
                            done();
                        } );
                } );
            } );
        } );

        it( 'accepts an undefined JWT token', function( done ) {
            expect( function() {
                session.setAnonymousSession( request, response, undefined )
                    .then( () => {
                        done();
                    } );
            } ).to.not.throw();
        } );
    } );
} );
