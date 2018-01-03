import chai, { expect } from 'chai';
import debugAgent from 'debug';
import dirtyChai from 'dirty-chai';
import _ from 'lodash';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import sessionStore from '../../lib/session-store';

import session, { getAnonSessionName, getSecureSessionName } from '../../lib/session';

const debug = debugAgent( 'glados:unit-test' );

chai.use( sinonChai );
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

                expect( request.session.isAuthenticated( request ) ).to.equal( true );
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

                expect( request.session.isAuthenticated( request ) ).to.equal( false );
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

                expect( request.session.isAuthenticated( request ) ).to.equal( false );
                storeStub.restore();
            } );
        } );
    } );

    context( 'has a `getRequireAuthMiddleware` function, which returns a middleware function that', function() {
        context( 'can upgrade an "anonymous session" to a "secure session" with the following rules:', function() {
            const anonTokenValue = 'Help me, Obi-wan. You\'re my only hope';
            const loginPage = '/login';
            let middleware = null;
            let request = null;
            let response = null;
            const secureTokenValue = 'Many years ago, you served my father in the clone wars.';

            beforeEach( function() {
                middleware = null;
                request = null;
                response = null;
            } );

            it( '(valid anonymous session): success', function( done ) {
                function runTests() {
                    expect( storeStub ).to.have.been.calledOnce();
                    expect( storeStub ).to.have.been.calledWith( anonTokenValue );

                    expect( request.cookies[ getSecureSessionName() ] ).to.equal( anonTokenValue );

                    expect( response.clearCookie ).to.have.been.calledOnce();
                    const clearCookieArgs = response.clearCookie.args[0];
                    expect( clearCookieArgs[0] ).to.equal( getAnonSessionName() );

                    expect( response.cookie ).to.have.been.calledOnce();
                    const setCookieArgs = response.cookie.args[0];
                    expect( setCookieArgs[0] ).to.equal( getSecureSessionName() );
                    expect( setCookieArgs[1] ).to.equal( anonTokenValue );

                    storeStub.restore();
                    done();
                }

                request = {
                    cookies: { [ getAnonSessionName() ]: anonTokenValue }
                };
                response = {
                    clearCookie: sinon.stub(),
                    cookie: sinon.stub(),
                    redirect: runTests
                };
                const storeStub = sinon.stub( sessionStore, 'get' ).returns( true );

                middleware = session.getRequireAuthMiddleware( loginPage );
                middleware( request, response, runTests );
            } );

            it( '(invalid anonymous session): failure', function( done ) {
                function runTests() {
                    expect( storeStub ).to.have.been.calledOnce();
                    expect( storeStub ).to.have.been.calledWith( anonTokenValue );
                    expect( response.redirect ).to.have.been.calledOnce();
                    expect( response.redirect ).to.have.been.calledWith( loginPage );
                    expect( response.clearCookie.notCalled ).to.equal( true );
                    expect( response.cookie.notCalled ).to.equal( true );
                    storeStub.restore();
                    done();
                }

                request = {
                    cookies: { [ getAnonSessionName() ]: anonTokenValue }
                };
                response = {
                    clearCookie: sinon.stub(),
                    cookie: sinon.stub(),
                    redirect: sinon.stub().callsFake( runTests )
                };
                const storeStub = sinon.stub( sessionStore, 'get' ).returns( false );

                middleware = session.getRequireAuthMiddleware( loginPage );
                middleware( request, response, runTests );
            } );

            it( '(missing anonymous session): failure', function( done ) {
                function runTests() {
                    expect( storeStub.notCalled ).to.equal( true );
                    expect( response.redirect ).to.have.been.calledOnce();
                    expect( response.redirect ).to.have.been.calledWith( loginPage );
                    expect( response.clearCookie.notCalled ).to.equal( true );
                    expect( response.cookie.notCalled ).to.equal( true );
                    storeStub.restore();
                    done();
                }

                request = {};
                response = {
                    clearCookie: sinon.stub(),
                    cookie: sinon.stub(),
                    redirect: sinon.stub().callsFake( runTests )
                };
                const storeStub = sinon.stub( sessionStore, 'get' ).returns( false );

                middleware = session.getRequireAuthMiddleware( loginPage );
                middleware( request, response, runTests );
            } );

            it( '(valid secure session): no change', function( done ) {
                function runTests() {
                    expect( request.session.isAuthenticated ).to.be.calledOnce();
                    expect( request.session.isAuthenticated ).to.be.calledWith( request );
                    expect( response.redirect.notCalled ).to.equal( true );
                    done();
                }

                request = {
                    cookies: { [ getSecureSessionName() ]: secureTokenValue },
                    session: { isAuthenticated: sinon.stub().returns( true ) }
                };
                response = {
                    redirect: sinon.stub().callsFake( runTests )
                };

                const middleware = session.getRequireAuthMiddleware( loginPage );
                middleware( request, response, runTests );
            } );
        } );

        context( 'redirects to a login page if the session', function() {
            const loginPage = '/login';
            let middleware = null;
            let request = null;
            let response = null;

            beforeEach( function() {
                middleware = null;
                request = null;
                response = null;
            } );

            it( 'is missing', function( done ) {
                function runTests() {
                    expect( response.redirect ).to.have.been.calledOnce();
                    expect( response.redirect ).to.have.been.calledWith( loginPage );
                    done();
                }
                request = {};
                response = {
                    redirect: sinon.stub().callsFake( runTests )
                };

                middleware = session.getRequireAuthMiddleware( loginPage );
                middleware( request, response, runTests );
            } );

            it( 'does not authenticate the user', function( done ) {
                function runTests() {
                    expect( response.redirect ).to.have.been.calledOnce();
                    expect( response.redirect ).to.have.been.calledWith( loginPage );
                    done();
                }
                request = {
                    session: { isAuthenticated: sinon.stub().returns( false ) }
                };
                response = {
                    redirect: sinon.stub().callsFake( runTests )
                };

                middleware = session.getRequireAuthMiddleware( loginPage );
                middleware( request, response, runTests );
            } );
        } );

        it( 'calls `next` if the user is authenticated in a "secure session"', function( done ) {
            function runTests() {
                expect( request.session.isAuthenticated ).to.be.calledOnce();
                expect( request.session.isAuthenticated ).to.be.calledWith( request );
                expect( response.redirect.notCalled ).to.equal( true );
                done();
            }

            const loginPage = '/login';
            const secureTokenValue = 'Many years ago, you served my father in the clone wars.';
            const request = {
                cookies: { [ getSecureSessionName() ]: secureTokenValue },
                session: { isAuthenticated: sinon.stub().returns( true ) }
            };
            const response = {
                redirect: sinon.stub().callsFake( runTests )
            };

            const middleware = session.getRequireAuthMiddleware( loginPage );
            middleware( request, response, runTests );
        } );

    } );

    context( 'has a `getSessionKey` function, which', function() {
        it( 'throws an error if the session key path has not been set' );

        it( 'reads a text file and returns its contents' );
    } );

    context( 'has a `storeJwtToken` function, which', function() {
        it( 'stores the session ID and token in the session store', function( done ) {
            const sessionId = 'What in the Wide Wide World of Sports';
            const jwtIdToken = {
                email: 'slim@pickens.com',
                iss: 'https://blazing.saddl.es',
                aud: 'Mel Brooks'
            };
            const storeStub = sinon.stub( sessionStore, 'upsert' );

            session.storeJwtToken( sessionId, jwtIdToken )
                .then( () => {
                    expect( storeStub ).to.have.been.calledOnce();
                    expect( storeStub ).to.have.been.calledWith( sessionId, jwtIdToken );
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
