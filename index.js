/** @typedef {string} publicKey */
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

// https://github.com/discord/discord-interactions-js/blob/main/src/index.ts
// https://github.com/discord/discord-interactions-js/blob/main/src/index.ts
/**
 * Merge two arrays.
 *
 * @param {Uint8Array} arr1 - First array
 * @param {Uint8Array} arr2 - Second array
 * @returns {Uint8Array} Concatenated arrays
 */
function concatUint8Arrays(arr1, arr2) {
    const merged = new Uint8Array(arr1.length + arr2.length);
    merged.set(arr1);
    merged.set(arr2, arr1.length);
    return merged;
}

/**
 * Validates a payload from Discord against its signature and key.
 *
 * @param {string} body - The raw payload data
 * @param {string} signature - The signature from the `X-Signature-Ed25519` header
 * @param {string} timestamp - The timestamp from the `X-Signature-Timestamp` header
 * @param {string} clientPublicKey - The public key from the Discord developer dashboard
 * @returns {Promise<boolean>} Whether or not validation was successful
 */
async function verifyKey(
    body,
    signature,
    timestamp,
    clientPublicKey,
) {
    try {
        const timestampData = new TextEncoder().encode(timestamp);
        const bodyData = new TextEncoder().encode(body);
        const message = concatUint8Arrays(timestampData, bodyData);

        const signatureData = new Uint8Array(signature.match(/.{2}/g).map((byte) => parseInt(byte, 16)));
        const publicKeyData = new Uint8Array(clientPublicKey.match(/.{2}/g).map((byte) => parseInt(byte, 16)));
        const algorithm = {name: 'NODE-ED25519', namedCurve: 'NODE-ED25519'};
        const publicKey = await crypto.subtle.importKey("raw", publicKeyData, algorithm, true, ["verify"]);
        return await crypto.subtle.verify(algorithm, publicKey, signatureData, message);
        // return nacl.sign.detached.verify(message, signatureData, publicKeyData);
    } catch (ex) {
        return false;
    }
}

/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
    const signature = request.headers.get("X-Signature-Ed25519") ?? "";
    const timestamp = request.headers.get("X-Signature-Timestamp") ?? "";

    const bodyText = await request.text()
    if(!await verifyKey(bodyText, signature, timestamp, publicKey)) {
        return new Response("", {
            status: 400
        });
    }
    const body = JSON.parse(bodyText)
    if(body.type === 1) {
        return new Response(JSON.stringify({
            "type": 1
        }), {
            headers: {
                "Content-Type": "application/json"
            }
        })
    }
    return new Response(JSON.stringify({
        "type": 4,
        "data": {
            "content": handleBody(body),
            "allowed_mentions": {"parse": []}
        }
    }), {
        headers: {
            "Content-Type": "application/json"
        }
    })
}
// https://stackoverflow.com/a/2450976
/**
 *
 * @param {string[]} array
 * @return {string[]}
 */
function shuffle(array) {
    let currentIndex = array.length,  randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex !== 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}
/** @returns {string} */
function handleBody(body) {
    let people = (body.data.options??[]).filter(x => /person_./.test(x.name)).map(x => x.value);
    const i = (body.data.options??[]).filter(x => x.name === "debug").map(x => x.value)[0];
    if(i === undefined) people=shuffle(people);
    const quotesOfLength = quotes[people.length - 1]
    return quotesOfLength[i ?? Math.floor(Math.random()*quotesOfLength.length)]
        .replaceAll(/{([A-G])}/g, (_, l) => people["ABCDEFG".indexOf(l)]);
}