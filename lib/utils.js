
export function errorFactory( message, sourceID ) {
    const error = new Error( message );
    error.source = sourceID;
    return error;
}