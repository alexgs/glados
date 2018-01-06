import _ from 'lodash';

const userDataFields = {
    email: _.isString,
    providerId: _.isString
};

function getOrCreate( userData ) {
    if ( !_.conformsTo( userData, userDataFields ) ) {
        throw new Error( messages.userDataMissingFields() );
    }
}

export const messages = {
    userDataMissingFields: () => `The user data object is missing required fields.`
};

const userStore = {
    getOrCreate
};

export default userStore;
