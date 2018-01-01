import chai, { expect } from 'chai';
import debugAgent from 'debug';
import dirtyChai from 'dirty-chai';
import _ from 'lodash';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import session, { getAnonSessionName, getSecureSessionName } from '../../lib/session';

const debug = debugAgent( 'glados:unit-test' );

chai.use( sinonChai );
chai.use( dirtyChai );

describe( 'Glados includes a Session module that', function() {
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

    context( 'has a `setAnonymousSession` function, which', function() {
        context( 'returns a Promise that', function() {
            it( '(if the cookie is sent from the client) resolves with the session ID and JWT token', function( done ) {
                session.setAnonymousSession( request, response, jwtToken )
                    .then( ( result ) => {
                        expect( result.idToken ).to.equal( jwtToken );
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
                            expect( result.idToken ).to.equal( jwtToken );
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
