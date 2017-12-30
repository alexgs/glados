import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import _ from 'lodash';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import url from 'url';
import defaultCsrfStore from '../../lib/csrf-token-store';

import GladosFactory, { messagesFactory } from '../../lib/oauth2';

chai.use( sinonChai );
chai.use( dirtyChai );

describe( 'Glados includes an OAuth2 module that', function() {
    context.only( 'has a `initialize` method. This method', function() {
        let app = null;
        let options = null;

        beforeEach( function() {
            GladosFactory._reset();
            app = {
                locals: {
                    placeholder: 'ok'
                }
            };
            options = {
                callbackUrl: 'http://callback.url/hello',
                clientId: 'abcdefghijklmnopqrstuvwxyz',
                clientSecret: 'setec astronomy',
                domain: 'example.com'
            };
        } );

        it( 'throws an error if the `app` argument is missing a `locals` field', function() {
            expect( function() {
                GladosFactory.initialize( options, {} );
            } ).to.throw( Error, messagesFactory.appIsNotValid() );
        } );

        context( 'throws an error if the `options` argument is missing a required field:', function() {
            it( 'the `callbackUrl` field must be a string', function() {
                delete options.callbackUrl;
                expect( function() {
                    GladosFactory.initialize( options, app );
                } ).to.throw( Error, messagesFactory.optionsObjectNotCorrect() );
            } );

            it( 'the `clientId` field must be a string', function() {
                delete options.clientId;
                expect( function() {
                    GladosFactory.initialize( options, app );
                } ).to.throw( Error, messagesFactory.optionsObjectNotCorrect() );
            } );

            it( 'the `clientSecret` field must be a string', function() {
                delete options.clientSecret;
                expect( function() {
                    GladosFactory.initialize( options, app );
                } ).to.throw( Error, messagesFactory.optionsObjectNotCorrect() );
            } );

            it( 'the `domain` field must be a string', function() {
                delete options.domain;
                expect( function() {
                    GladosFactory.initialize( options, app );
                } ).to.throw( Error, messagesFactory.optionsObjectNotCorrect() );
            } );
        } );

        it( 'throws an error if called more than once', function() {
            expect( function() {
                GladosFactory.initialize( options, app );
                GladosFactory.initialize( options, app );
            } ).to.throw( Error, messagesFactory.factoryAlreadyInitialized() );

        } );

        it( 'initializes a CSRF token store', function() {
            const spy = sinon.spy();
            const csrfStore = {
                initialize: spy,
                _reset: () => { /* no op */ }
            };

            GladosFactory.initialize( options, app, csrfStore );
            expect( spy ).to.have.been.calledOnce();
        } );
    } );

    context( 'has a `startOAuth2` function that returns a middleware function, which', function() {
        let expressApp = {
            locals: { }
        };
        let glados = null;
        const gladosOptions = {
            callbackUrl: 'https://moving-pictures.yyz/login/auth-complete',
            clientId: 'tom-sawyer',
            clientSecret: 'a-brilliant-red-barchetta-from-a-better-vanished-time',
            domain: 'rush.auth0.com'
        };

        beforeEach( function() {
            GladosFactory._reset();
            GladosFactory.initialize( gladosOptions, expressApp );
            glados = GladosFactory.create();
        } );

        it( 'throws an error if the factory is not initialized', function() {
            GladosFactory._reset();
            const routeMiddleware = glados.startOAuth2();
            expect( function() {
                routeMiddleware();
            } ).to.throw( Error, messagesFactory.factoryNotInitialized( 'startOAuth2' ) );
        } );

        it( 'has two parameters: `request` and `response`', function() {
            const routeMiddleware = glados.startOAuth2();
            expect( _.isFunction( routeMiddleware ) ).to.be.true();
            expect( routeMiddleware.length ).to.equal( 2 );
        } );

        it( 'calls a `redirect` method on the `response` argument with a URL', function() {
            const stub = sinon.stub();
            const request = {};
            const response = {
                redirect: stub
            };

            const routeMiddleware = glados.startOAuth2();
            routeMiddleware( request, response );
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

                const routeMiddleware = glados.startOAuth2();
                routeMiddleware( request, response );
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

    context( 'has a `completeOAuth2` function that returns a middleware function, which', function() {
        let expressApp = {
            locals: { }
        };
        let glados = null;
        const gladosOptions = {
            callbackUrl: 'https://moving-pictures.yyz/login/auth-complete',
            clientId: 'tom-sawyer',
            clientSecret: 'a-brilliant-red-barchetta-from-a-better-vanished-time',
            domain: 'rush.auth0.com'
        };
        let request = null;
        let token = null;

        beforeEach( function() {
            GladosFactory._reset();
            defaultCsrfStore._reset();
            GladosFactory.initialize( gladosOptions, expressApp, defaultCsrfStore );

            glados = GladosFactory.create();
            request = {
                hostname: 'moving-pictures.yyz',
                protocol: 'https',
                query: {
                    code: 'jaWcnFTvfS00SfSA',
                    state: token
                }
            };
            token = defaultCsrfStore.generateToken();
        } );

        it( 'throws an error if the factory is not initialized', function() {
            GladosFactory._reset();
            const routeMiddleware = glados.completeOAuth2();
            expect( function() {
                routeMiddleware();
            } ).to.throw( Error, messagesFactory.factoryNotInitialized( 'completeOAuth2' ) );
        } );
    } );
} );
