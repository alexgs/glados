import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import _ from 'lodash';

import glados, { messages } from '../../index';

chai.use( dirtyChai );

describe.only( 'The Glados core has a `configure` function that', function() {
    context( 'throws an error', function() {
        const goodOptions = {
            expressApp: { locals: {} },
            oauth: {
                callbackUrl: 'https://moving-pictures.yyz/login/auth-complete',
                clientId: 'tom-sawyer',
                clientSecret: 'a-brilliant-red-barchetta-from-a-better-vanished-time',
                domain: 'rush.auth0.com'
            },
            userStore: {}
        };

        context( 'if the `options` argument', function() {
            it( 'does not have an `expressApp` property', function() {
                const badOptions = _.cloneDeep( goodOptions );
                delete badOptions.expressApp;
                expect( function() {
                    glados.configure( badOptions );
                } ).to.throw( Error, messages.optionsMustHaveField( 'an "expressApp"' ) );
            } );

            it( 'does not have an `oauth` property', function() {
                const badOptions = _.cloneDeep( goodOptions );
                delete badOptions.oauth;
                expect( function() {
                    glados.configure( badOptions );
                } ).to.throw( Error, messages.optionsMustHaveField( 'an "oauth"' ) );
            } );

            it( 'does not have a `userStore` property', function() {
                const badOptions = _.cloneDeep( goodOptions );
                delete badOptions.userStore;
                expect( function() {
                    glados.configure( badOptions );
                } ).to.throw( Error, messages.optionsMustHaveField( 'a "userStore"' ) );
            } );
        } );

        context( 'if the `expressApp` value', function() {
            it( 'does not have a `locals` property that is a plain object', function() {
                const badOptions = _.cloneDeep( goodOptions );
                delete badOptions.expressApp.locals;
                expect( function() {
                    glados.configure( badOptions );
                } ).to.throw(
                    Error, messages.fieldMustHaveProperty( 'expressApp', 'locals', 'Plain Object', badOptions.expressApp.locals )
                );

                badOptions.expressApp.locals = 'some local value';
                expect( function() {
                    glados.configure( badOptions );
                } ).to.throw(
                    Error, messages.fieldMustHaveProperty( 'expressApp', 'locals', 'Plain Object', badOptions.expressApp.locals )
                );
            } );
        } );

        context( 'if the `oauth` value', function() {
            it( 'does not have a `callbackUrl` property that is a string', function() {
                const badOptions = _.cloneDeep( goodOptions );
                delete badOptions.oauth.callbackUrl;
                expect( function() {
                    glados.configure( badOptions );
                } ).to.throw(
                    Error,
                    messages.fieldMustHaveProperty( 'oauth', 'callbackUrl', 'string', badOptions.oauth.callbackUrl )
                );

                badOptions.oauth.callbackUrl = 99;
                expect( function() {
                    glados.configure( badOptions );
                } ).to.throw(
                    Error,
                    messages.fieldMustHaveProperty( 'oauth', 'callbackUrl', 'string', badOptions.oauth.callbackUrl )
                );
            } );

            it( 'does not have a `clientId` property that is a string', function() {
                const badOptions = _.cloneDeep( goodOptions );
                delete badOptions.oauth.clientId;
                expect( function() {
                    glados.configure( badOptions );
                } ).to.throw(
                    Error,
                    messages.fieldMustHaveProperty( 'oauth', 'clientId', 'string', badOptions.oauth.clientId )
                );

                badOptions.oauth.clientId = 99;
                expect( function() {
                    glados.configure( badOptions );
                } ).to.throw(
                    Error,
                    messages.fieldMustHaveProperty( 'oauth', 'clientId', 'string', badOptions.oauth.clientId )
                );
            } );

            it( 'does not have a `clientSecret` property that is a string', function() {
                const badOptions = _.cloneDeep( goodOptions );
                delete badOptions.oauth.clientSecret;
                expect( function() {
                    glados.configure( badOptions );
                } ).to.throw(
                    Error,
                    messages.fieldMustHaveProperty( 'oauth', 'clientSecret', 'string', badOptions.oauth.clientSecret )
                );

                badOptions.oauth.clientSecret = 99;
                expect( function() {
                    glados.configure( badOptions );
                } ).to.throw(
                    Error,
                    messages.fieldMustHaveProperty( 'oauth', 'clientSecret', 'string', badOptions.oauth.clientSecret )
                );
            } );

            it( 'does not have a `domain` property that is a string', function() {
                const badOptions = _.cloneDeep( goodOptions );
                delete badOptions.oauth.domain;
                expect( function() {
                    glados.configure( badOptions );
                } ).to.throw(
                    Error,
                    messages.fieldMustHaveProperty( 'oauth', 'domain', 'string', badOptions.oauth.domain )
                );

                badOptions.oauth.domain = 99;
                expect( function() {
                    glados.configure( badOptions );
                } ).to.throw(
                    Error,
                    messages.fieldMustHaveProperty( 'oauth', 'domain', 'string', badOptions.oauth.domain )
                );
            } );
        } );

        context( 'if the `userStore` value', function() {
            it( 'does not have a `getOrCreate` property that is a function' );
        } );
    } );
} );