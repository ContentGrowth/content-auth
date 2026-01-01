export async function hashPassword(password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    );
    const hashBuffer = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        256 // 32 bytes
    );

    // Format: algorithm:iterations:salt(b64):hash(b64)
    const saltB64 = btoa(String.fromCharCode(...new Uint8Array(salt)));
    const hashB64 = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
    return `pbkdf2:100000:${saltB64}:${hashB64}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const parts = storedHash.split(':');
    if (parts.length !== 4) return false;

    const [alg, iterationsStr, saltB64, hashB64] = parts;
    if (alg !== 'pbkdf2') return false; // Fallback handling would go here

    const iterations = parseInt(iterationsStr, 10);
    const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
    const originalHash = Uint8Array.from(atob(hashB64), c => c.charCodeAt(0));

    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    );

    const hashBuffer = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: iterations,
            hash: "SHA-256"
        },
        keyMaterial,
        256
    );

    // Constant-time comparison
    const newHash = new Uint8Array(hashBuffer);
    if (newHash.length !== originalHash.length) return false;

    let result = 0;
    for (let i = 0; i < newHash.length; i++) {
        result |= newHash[i] ^ originalHash[i];
    }

    return result === 0;
}
