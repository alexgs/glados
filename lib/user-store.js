import _ from 'lodash';

const userDataFields = {
    email: _.isString,
    providerId: _.isString
};

// TODO >>> This should be in a module provided by the application; we should export a Flow interface for it

function getOrCreate( userData ) {
    if ( !_.conformsTo( userData, userDataFields ) ) {
        throw new Error( messages.userDataMissingFields() );
    }

    return {
        email: userData.email,
        providers: [ userData.providerId ],
        id: 27
    };
}

export const messages = {
    userDataMissingFields: () => `The user data object is missing required fields.`
};

const userStore = {
    getOrCreate
};

export default userStore;
