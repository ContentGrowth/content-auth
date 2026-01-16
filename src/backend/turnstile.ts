/**
 * Cloudflare Turnstile Verification Utility
 * 
 * Verifies Turnstile tokens on the server-side using Cloudflare's Siteverify API.
 * @see https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

interface TurnstileResponse {
    success: boolean;
    challenge_ts?: string;
    hostname?: string;
    'error-codes'?: string[];
    action?: string;
    cdata?: string;
}

interface VerifyResult {
    success: boolean;
    error?: string;
    hostname?: string;
}

/**
 * Verifies a Turnstile token with Cloudflare's Siteverify API.
 * 
 * @param secretKey - Your Turnstile secret key
 * @param token - The token from the client-side Turnstile widget (cf-turnstile-response)
 * @param remoteIp - Optional: The visitor's IP address for additional validation
 * @returns Verification result with success status and any error messages
 */
export async function verifyTurnstile(
    secretKey: string,
    token: string,
    remoteIp?: string
): Promise<VerifyResult> {
    if (!secretKey) {
        console.warn('[Turnstile] No secret key configured, skipping verification');
        return { success: true }; // Allow in development without key
    }

    if (!token) {
        return { success: false, error: 'Missing Turnstile token' };
    }

    try {
        const formData = new URLSearchParams();
        formData.append('secret', secretKey);
        formData.append('response', token);
        if (remoteIp) {
            formData.append('remoteip', remoteIp);
        }

        const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
        });

        if (!response.ok) {
            console.error(`[Turnstile] Siteverify API error: ${response.status}`);
            return { success: false, error: `API error: ${response.status}` };
        }

        const result: TurnstileResponse = await response.json();

        if (result.success) {
            return { success: true, hostname: result.hostname };
        } else {
            const errorCodes = result['error-codes'] || [];
            console.warn(`[Turnstile] Verification failed: ${errorCodes.join(', ')}`);
            return {
                success: false,
                error: mapTurnstileError(errorCodes)
            };
        }
    } catch (error: any) {
        console.error(`[Turnstile] Verification error: ${error.message}`);
        return { success: false, error: 'Verification service unavailable' };
    }
}

/**
 * Maps Turnstile error codes to user-friendly messages
 */
function mapTurnstileError(codes: string[]): string {
    if (codes.includes('timeout-or-duplicate')) {
        return 'Challenge expired or already used. Please try again.';
    }
    if (codes.includes('invalid-input-response')) {
        return 'Invalid challenge response. Please try again.';
    }
    if (codes.includes('bad-request')) {
        return 'Invalid request. Please refresh and try again.';
    }
    if (codes.includes('internal-error')) {
        return 'Verification service error. Please try again later.';
    }
    return 'Challenge verification failed. Please try again.';
}
