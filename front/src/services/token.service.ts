let accessToken: string | null = null;

let onTokenChange:
    | ((token: string | null) => void)
    | null = null;

export function getAccessToken() {
    return accessToken;
}

export function setAccessToken(token: string | null) {
    accessToken = token;

    onTokenChange?.(token);
}

export function subscribeToTokenChange(
    callback: (token: string | null) => void
) {
    onTokenChange = callback;

    return () => {
        onTokenChange = null;
    };
}