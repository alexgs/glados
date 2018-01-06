import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import _ from 'lodash';

import glados, { messages } from '../../index';

chai.use( dirtyChai );

describe.only( 'The Glados core has a `configure` function that', function() {
    context( 'throws an error if the `options` argument', function() {
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

        it( 'does not have an `expressApp` property', function() {
            const badOptions = _.cloneDeep( goodOptions );
            delete badOptions.expressApp;
            expect( function() {
                glados.configure( badOptions )
            } ).to.throw( Error, messages.optionsMustHaveField( 'an "expressApp"' ) );
        } );

        it( 'does not have an `oauth` property', function() {
            const badOptions = _.cloneDeep( goodOptions );
            delete badOptions.oauth;
            expect( function() {
                glados.configure( badOptions )
            } ).to.throw( Error, messages.optionsMustHaveField( 'an "oauth"' ) );
        } );

        it( 'does not have a `userStore` property', function() {
            const badOptions = _.cloneDeep( goodOptions );
            delete badOptions.userStore;
            expect( function() {
                glados.configure( badOptions )
            } ).to.throw( Error, messages.optionsMustHaveField( 'a "userStore"' ) );
        } );
    } );
} );