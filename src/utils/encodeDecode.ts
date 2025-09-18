function encodePayload(data : object) {
    return Buffer.from(JSON.stringify(data)).toString('base64');
}

function decodePayload(encoded : string) {
    return JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'));
}

export { encodePayload, decodePayload };
