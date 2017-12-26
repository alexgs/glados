import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import _ from 'lodash';

import GladosFactory, { messagesFactory } from '../index';

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

    } );
} );
