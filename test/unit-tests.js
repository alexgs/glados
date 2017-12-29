import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import _ from 'lodash';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import url from 'url';

import GladosFactory, { messagesFactory } from '../index';

chai.use( sinonChai );
chai.use( dirtyChai );

describe( 'Glados', function() {
    context( 'is created from a Glados Factory that', function() {
        context( 'has an `initialize` method. This method', function() {
            context( 'throws an error if the `options` object is missing a required field:', function() {
                let options = null;

                before( function() {
                    GladosFactory._reset();
                } );

                beforeEach( function() {
                    options = {
                        domain: 'example.com',
                        clientId: 'abcdefghijklmnopqrstuvwxyz',
                        clientSecret: 'setec astronomy',
                        callbackUrl: 'http://callback.url/hello'
                    };
                } );

                it( 'the `domain` field must be a string', function() {
                    delete options.domain;
                    expect( function() {
                        GladosFactory.initialize( options );
                    } ).to.throw( Error, messagesFactory.optionsObjectNotCorrect() );
                } );

                it( 'the `clientId` field must be a string', function() {
                    delete options.clientId;
                    expect( function() {
                        GladosFactory.initialize( options );
                    } ).to.throw( Error, messagesFactory.optionsObjectNotCorrect() );
                } );

                it( 'the `clientSecret` field must be a string', function() {
                    delete options.clientSecret;
                    expect( function() {
                        GladosFactory.initialize( options );
                    } ).to.throw( Error, messagesFactory.optionsObjectNotCorrect() );
                } );

                it( 'the `callbackUrl` field must be a string', function() {
                    delete options.callbackUrl;
                    expect( function() {
                        GladosFactory.initialize( options );
                    } ).to.throw( Error, messagesFactory.optionsObjectNotCorrect() );
                } );
            } );

            it( 'throws an error if called more than once', function() {
                const options = {
                    domain: 'example.com',
                    clientId: 'abcdefghijklmnopqrstuvwxyz',
                    clientSecret: 'setec astronomy',
                    callbackUrl: 'http://callback.url/hello'
                };

                expect( function() {
                    GladosFactory.initialize( options );
                    GladosFactory.initialize( options );
                } ).to.throw( Error, messagesFactory.factoryAlreadyInitialized() );
            } );
        } );

        context( 'has a `create` method. This method', function() {
            it( 'throws an error if `initialize` is not called first', function() {
                GladosFactory._reset();
                expect( function() {
                    const glados = GladosFactory.create();
                } ).to.throw( Error, messagesFactory.factoryNotInitialized() );
            } );

            context( 'returns a `glados` object with the following functions:', function() {
                let glados = null;

                before( function() {
                    GladosFactory._reset();
                    GladosFactory.initialize( {
                        domain: 'example.com',
                        clientId: 'abcdefghijklmnopqrstuvwxyz',
                        clientSecret: 'setec astronomy',
                        callbackUrl: 'http://callback.url/hello'
                    } );
                } );

                beforeEach( function() {
                    glados = GladosFactory.create();
                } );

                it( 'completeOAuth2', function() {
                    expect( _.isFunction( glados.completeOAuth2 ) ).to.be.true();
                } );

                it( 'ensureAuthenticated', function() {
                    expect( _.isFunction( glados.ensureAuthenticated ) ).to.be.true();
                } );
                
                it( 'getLoginHandler', function() {
                    expect( _.isFunction( glados.getLoginHandler ) ).to.be.true();
                } );
                
                it( 'logout', function() {
                    expect( _.isFunction( glados.logout ) ).to.be.true();
                } );
                
                it( 'startOAuth2', function() {
                    expect( _.isFunction( glados.startOAuth2 ) ).to.be.true();
                } );
            } );
        } );
    } );

    context( 'has a `startOAuth2` function that', function() {
        let glados = null;
        const gladosOptions = {
            domain: 'rush.auth0.com',
            clientId: 'tom-sawyer',
            clientSecret: 'a-brilliant-red-barchetta-from-a-better-vanished-time',
            callbackUrl: 'https://moving-pictures.yyz/login/auth-complete'
        };

        beforeEach( function() {
            GladosFactory._reset();
            GladosFactory.initialize( gladosOptions );
            glados = GladosFactory.create();
        } );

        it( 'throws an error if the factory is not initialized', function() {
            GladosFactory._reset();
            expect( function() {
                glados.startOAuth2();
            } ).to.throw( Error, messagesFactory.illegalState() );
        } );

        context( 'returns a function that', function() {
            it( 'has two parameters: `request` and `response`', function() {
                const func = glados.startOAuth2();
                expect( _.isFunction( func ) ).to.be.true();
                expect( func.length ).to.equal( 2 );
            } );

            it( 'calls a `redirect` method on the `response` argument with a URL', function() {
                const stub = sinon.stub();
                const request = {};
                const response = {
                    redirect: stub
                };

                const func = glados.startOAuth2();
                func( request, response );
                expect( stub ).to.have.been.calledOnce();

                const redirectUri = stub.args[0][0];
                const redirectUriParts = url.parse( redirectUri, true );

                // If host and protocol are set, assume it is a valid URL
                expect( _.isString( redirectUriParts.host ) ).to.be.true();
                expect( redirectUriParts.host ).to.equal( gladosOptions.domain );
                expect( _.trimEnd( redirectUriParts.protocol, ':' ) ).to.equal( 'https' );
            } );

            context( 'calls `redirect` with a URL having the following query parameters:', function() {
                let queryParams = null;

                beforeEach( function() {
                    queryParams = null;

                    const stub = sinon.stub();
                    const request = {};
                    const response = {
                        redirect: stub
                    };

                    const func = glados.startOAuth2();
                    func( request, response );
                    const redirectUriParts = url.parse( stub.args[0][0], true );
                    queryParams = redirectUriParts.query;
                } );

                it( '[optional] audience', function() {
                    if ( queryParams.audience ) {
                        expect( queryParams.audience ).to.equal( `https://${gladosOptions.domain}/userinfo` );
                    } else {
                        expect( queryParams.audience ).to.equal( undefined );
                    }
                } );

                it( 'client_id', function() {
                    expect( queryParams.client_id ).to.equal( gladosOptions.clientId );
                } );

                it( 'redirect_uri', function() {
                    expect( queryParams.redirect_uri ).to.equal( gladosOptions.callbackUrl );
                } );

                it( 'response_type', function() {
                    expect( queryParams.response_type ).to.equal( 'code' );
                } );

                it( 'scope', function() {
                    expect( queryParams.scope ).to.equal( 'openid email' );
                } );

                it( 'state', function() {
                    expect( _.isString( queryParams.state ) ).to.be.true();
                    expect( queryParams.state ).to.have.lengthOf.at.least( 12 );   // CSRF token must be at 12 chars long
                } );
            } );
        } );

    } );
} );
