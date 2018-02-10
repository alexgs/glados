// @flow

interface GladosError extends Error {
    source?:string|number;
}

export function errorFactory( message:string, sourceID:string|number ) {
    const error = (new Error( message ):GladosError);
    error.source = sourceID;
    return error;
}
