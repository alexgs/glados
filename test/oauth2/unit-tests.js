import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import _ from 'lodash';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import url from 'url';
import defaultCsrfStore from '../../lib/csrf-token-store';

import oauth2, { messagesFactory as oauth2MessageFactory, _reset as oauth2Reset } from '../../lib/oauth2';
const utils = {
    messagesFactory: oauth2MessageFactory,
    _reset: oauth2Reset
};

chai.use( sinonChai );
chai.use( dirtyChai );

describe( 'Glados includes an OAuth2 module that', function() {
    context( 'has a `configure` method. This method', function() {
        let app = null;
        let options = null;

        beforeEach( function() {
            utils._reset();
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
                oauth2.configure( options, {} );
            } ).to.throw( Error, utils.messagesFactory.appIsNotValid() );
        } );

        context( 'throws an error if the `options` argument is missing a required field:', function() {
            it( 'the `callbackUrl` field must be a string', function() {
                delete options.callbackUrl;
                expect( function() {
                    oauth2.configure( options, app );
                } ).to.throw( Error, utils.messagesFactory.optionsObjectNotCorrect() );
            } );

            it( 'the `clientId` field must be a string', function() {
                delete options.clientId;
                expect( function() {
                    oauth2.configure( options, app );
                } ).to.throw( Error, utils.messagesFactory.optionsObjectNotCorrect() );
            } );

            it( 'the `clientSecret` field must be a string', function() {
                delete options.clientSecret;
                expect( function() {
                    oauth2.configure( options, app );
                } ).to.throw( Error, utils.messagesFactory.optionsObjectNotCorrect() );
            } );

            it( 'the `domain` field must be a string', function() {
                delete options.domain;
                expect( function() {
                    oauth2.configure( options, app );
                } ).to.throw( Error, utils.messagesFactory.optionsObjectNotCorrect() );
            } );
        } );

        it( 'throws an error if called more than once', function() {
            expect( function() {
                oauth2.configure( options, app );
                oauth2.configure( options, app );
            } ).to.throw( Error, utils.messagesFactory.moduleAlreadyConfigured() );

        } );

        it( 'initializes a CSRF token store', function() {
            const spy = sinon.spy();
            const csrfStore = {
                initialize: spy,
                _reset: () => { /* no op */ }
            };

            oauth2.configure( options, app, csrfStore );
            expect( spy ).to.have.been.calledOnce();
        } );
    } );

    context( 'has a `startOAuth2` function that returns a middleware function, which', function() {
        let expressApp = {
            locals: { }
        };
        const gladosOptions = {
            callbackUrl: 'https://moving-pictures.yyz/login/auth-complete',
            clientId: 'tom-sawyer',
            clientSecret: 'a-brilliant-red-barchetta-from-a-better-vanished-time',
            domain: 'rush.auth0.com'
        };

        beforeEach( function() {
            utils._reset();
            oauth2.configure( gladosOptions, expressApp );
        } );

        it( 'throws an error if the module is not configured', function() {
            utils._reset();
            const routeMiddleware = oauth2.startOAuth2();
            expect( function() {
                routeMiddleware();
            } ).to.throw( Error, utils.messagesFactory.moduleNotInitialized( 'startOAuth2' ) );
        } );

        it( 'has two parameters: `request` and `response`', function() {
            const routeMiddleware = oauth2.startOAuth2();
            expect( _.isFunction( routeMiddleware ) ).to.be.true();
            expect( routeMiddleware.length ).to.equal( 2 );
        } );

        it( 'calls a `redirect` method on the `response` argument with a URL', function() {
            const stub = sinon.stub();
            const request = {};
            const response = {
                redirect: stub
            };

            const routeMiddleware = oauth2.startOAuth2();
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

                const routeMiddleware = oauth2.startOAuth2();
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
        const gladosOptions = {
            callbackUrl: 'https://moving-pictures.yyz/login/auth-complete',
            clientId: 'tom-sawyer',
            clientSecret: 'a-brilliant-red-barchetta-from-a-better-vanished-time',
            domain: 'rush.auth0.com'
        };
        let request = null;
        let token = null;

        beforeEach( function() {
            utils._reset();
            defaultCsrfStore._reset();
            oauth2.configure( gladosOptions, expressApp, defaultCsrfStore );

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

        it( 'throws an error if the module is not configured', function() {
            utils._reset();
            const routeMiddleware = oauth2.completeOAuth2();
            expect( function() {
                routeMiddleware();
            } ).to.throw( Error, utils.messagesFactory.moduleNotInitialized( 'completeOAuth2' ) );
        } );
    } );
} );
