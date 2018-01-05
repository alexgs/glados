
export const ERROR_SOURCE = {
    ANON_SESSION: {
        INVALID: 'error-source.anonymous-session.invalid-session',
        MISSING: 'error-source.anonymous-session.missing-session'
    },
    JWT: {
        CLAIMS: 'error-source.jwt-claims',
        SIGNATURE: 'error-source.jwt-signature'
    },
    MISSING_SESSION: 'error-source.no-session',
    SECURE_SESSION: {
        INVALID: 'error-source.secure-session.invalid-session',
        MISSING: 'error-source.secure-session.missing-session'
    }
};
