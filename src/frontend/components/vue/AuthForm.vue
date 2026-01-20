<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { createClient } from '../../clients/vue-client';

interface Props {
    view?: 'signin' | 'signup';
    baseUrl?: string;
    socialProviders?: string[];
    socialLayout?: 'row' | 'column';
    title?: string;
    width?: 'default' | 'compact' | 'wide';
    layout?: 'default' | 'split';
    socialPosition?: 'top' | 'bottom';
    defaultEmail?: string;
    lockEmail?: boolean;
    forgotPasswordUrl?: string;
    turnstileSiteKey?: string;
    redirectUrl?: string;
}

const props = withDefaults(defineProps<Props>(), {
    view: 'signin',
    socialProviders: () => [],
    socialLayout: 'row',
    width: 'default',
    layout: 'default',
    socialPosition: 'top',
    defaultEmail: '',
    lockEmail: false,
});

const emit = defineEmits<{
    (e: 'success', data?: any): void;
    (e: 'error', error: string): void;
    (e: 'switchMode'): void;
}>();

const client = computed(() => createClient(props.baseUrl));

const isLogin = ref(props.view !== 'signup');
const email = ref(props.defaultEmail);
const password = ref('');
const name = ref('');
const loading = ref(false);
const error = ref<string | null>(null);
const turnstileToken = ref<string | null>(null);
const mounted = ref(false);

const widthClass = computed(() => {
    if (props.width === 'compact') return 'ca-width-compact';
    if (props.width === 'wide') return 'ca-width-wide';
    return 'ca-width-default';
});

const containerClass = computed(() => 
    `ca-container ${props.layout === 'split' ? 'ca-layout-split' : ''} ${widthClass.value}`
);

const socialClass = computed(() => 
    props.socialLayout === 'column' ? 'ca-social-column' : 'ca-social-grid'
);

const displayTitle = computed(() => 
    props.title || (isLogin.value ? 'Welcome Back' : 'Create Account')
);

const turnstileEnabled = computed(() => !!props.turnstileSiteKey);
const turnstileRequired = computed(() => turnstileEnabled.value && !isLogin.value);
const canSubmit = computed(() => !turnstileRequired.value || !!turnstileToken.value);

watch(() => props.view, (newView) => {
    isLogin.value = newView !== 'signup';
});

onMounted(() => {
    mounted.value = true;
});

const handleSubmit = async () => {
    if (turnstileRequired.value && !turnstileToken.value) {
        error.value = 'Please complete the security challenge';
        return;
    }

    loading.value = true;
    error.value = null;

    try {
        let response: any;
        if (isLogin.value) {
            response = await client.value.signIn.email({
                email: email.value,
                password: password.value,
            });
            if (response.error) throw response.error;
        } else {
            const signupData: any = {
                email: email.value,
                password: password.value,
                name: name.value,
            };
            if (turnstileToken.value) {
                signupData.turnstileToken = turnstileToken.value;
            }
            response = await client.value.signUp.email(signupData);
            if (response.error) throw response.error;
        }
        
        emit('success', response.data);
        
        if (props.redirectUrl) {
            window.location.href = props.redirectUrl;
        }
    } catch (err: any) {
        const errorMessage = err.message || '';
        let friendlyMessage = 'An error occurred. Please try again.';

        if (errorMessage.includes('TURNSTILE') || errorMessage.includes('security challenge')) {
            friendlyMessage = 'Security verification failed. Please complete the challenge and try again.';
        } else if (errorMessage.includes('EMAIL_EXISTS') || errorMessage.includes('already exists')) {
            friendlyMessage = 'An account with this email already exists. Try signing in instead.';
        } else if (errorMessage.includes('Invalid email') || errorMessage.includes('invalid email')) {
            friendlyMessage = 'Please enter a valid email address.';
        } else if (errorMessage.includes('Invalid password') || errorMessage.includes('incorrect')) {
            friendlyMessage = 'Invalid email or password. Please check your credentials.';
        } else if (errorMessage.includes('User not found')) {
            friendlyMessage = 'No account found with this email. Try signing up instead.';
        } else if (errorMessage.includes('too short') || errorMessage.includes('password')) {
            friendlyMessage = 'Password must be at least 8 characters long.';
        } else if (err.message) {
            friendlyMessage = err.message;
        }

        error.value = friendlyMessage;
        emit('error', friendlyMessage);
        turnstileToken.value = null;
    } finally {
        loading.value = false;
    }
};

const handleSocialLogin = async (provider: string) => {
    loading.value = true;
    try {
        await client.value.signIn.social({
            provider: provider as any,
            callbackURL: props.redirectUrl || window.location.href
        });
    } catch (err: any) {
        error.value = err.message || `Failed to sign in with ${provider}`;
        emit('error', error.value);
        loading.value = false;
    }
};

const switchMode = () => {
    isLogin.value = !isLogin.value;
    error.value = null;
    turnstileToken.value = null;
    emit('switchMode');
};

const handleTurnstileSuccess = (token: string) => {
    turnstileToken.value = token;
};

const handleTurnstileError = () => {
    turnstileToken.value = null;
    error.value = 'Security verification failed. Please try again.';
};
</script>

<template>
    <div :class="containerClass">
        <h2 class="ca-title">{{ displayTitle }}</h2>

        <!-- Default Layout -->
        <template v-if="layout !== 'split'">
            <!-- Social buttons at top -->
            <template v-if="socialPosition === 'top' && socialProviders.length > 0 && !lockEmail">
                <div :class="socialClass">
                    <button
                        v-for="provider in socialProviders"
                        :key="provider"
                        type="button"
                        :class="`ca-button ca-button-social ca-button-${provider}`"
                        :disabled="loading"
                        @click="handleSocialLogin(provider)"
                    >
                        <svg v-if="provider === 'google'" class="ca-icon" viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" /><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" /><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.734 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" /><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.424 44.599 -10.174 45.789 L -6.744 42.359 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" /></g></svg>
                        <svg v-else-if="provider === 'github'" class="ca-icon" viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12c0-5.523-4.477-10-10-10z" fill="currentColor" /></svg>
                        <span class="ca-btn-text">{{ provider === 'github' ? 'GitHub' : 'Google' }}</span>
                    </button>
                </div>
                <div class="ca-divider">
                    <span class="ca-divider-text">Or continue with</span>
                </div>
            </template>

            <!-- Form -->
            <form class="ca-form" @submit.prevent="handleSubmit">
                <div v-if="!isLogin" class="ca-input-group">
                    <label class="ca-label" for="name">Name</label>
                    <input
                        id="name"
                        v-model="name"
                        type="text"
                        class="ca-input"
                        required
                    />
                </div>

                <div class="ca-input-group">
                    <label class="ca-label" for="email">Email</label>
                    <input
                        id="email"
                        v-model="email"
                        type="email"
                        :class="['ca-input', { 'ca-input-locked': lockEmail }]"
                        :readonly="lockEmail"
                        required
                    />
                </div>

                <div class="ca-input-group">
                    <div class="ca-label-row">
                        <label class="ca-label" for="password">Password</label>
                        <a v-if="isLogin && forgotPasswordUrl" :href="forgotPasswordUrl" class="ca-forgot-link">
                            Forgot password?
                        </a>
                    </div>
                    <input
                        id="password"
                        v-model="password"
                        type="password"
                        class="ca-input"
                        required
                    />
                </div>

                <!-- Turnstile placeholder - implement with vue-turnstile if needed -->
                <div v-if="turnstileSiteKey && !isLogin" class="ca-turnstile">
                    <p class="ca-turnstile-hint">Please complete the security check above</p>
                </div>

                <div v-if="error" class="ca-error">{{ error }}</div>

                <button
                    type="submit"
                    class="ca-button"
                    :disabled="loading || !canSubmit"
                >
                    {{ loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Sign Up') }}
                </button>
            </form>

            <!-- Social buttons at bottom -->
            <template v-if="socialPosition === 'bottom' && socialProviders.length > 0 && !lockEmail">
                <div class="ca-divider">
                    <span class="ca-divider-text">Or continue with</span>
                </div>
                <div :class="socialClass">
                    <button
                        v-for="provider in socialProviders"
                        :key="provider"
                        type="button"
                        :class="`ca-button ca-button-social ca-button-${provider}`"
                        :disabled="loading"
                        @click="handleSocialLogin(provider)"
                    >
                        <svg v-if="provider === 'google'" class="ca-icon" viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" /><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" /><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.734 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" /><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.424 44.599 -10.174 45.789 L -6.744 42.359 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" /></g></svg>
                        <svg v-else-if="provider === 'github'" class="ca-icon" viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12c0-5.523-4.477-10-10-10z" fill="currentColor" /></svg>
                        <span class="ca-btn-text">{{ provider === 'github' ? 'GitHub' : 'Google' }}</span>
                    </button>
                </div>
            </template>

            <!-- Footer -->
            <div class="ca-footer">
                {{ isLogin ? "Don't have an account? " : "Already have an account? " }}
                <button class="ca-link" type="button" @click="switchMode">
                    {{ isLogin ? 'Sign up' : 'Sign in' }}
                </button>
            </div>
        </template>

        <!-- Split Layout -->
        <template v-else>
            <div class="ca-split-body">
                <div class="ca-split-main">
                    <form class="ca-form" @submit.prevent="handleSubmit">
                        <div v-if="!isLogin" class="ca-input-group">
                            <label class="ca-label" for="name">Name</label>
                            <input id="name" v-model="name" type="text" class="ca-input" required />
                        </div>
                        <div class="ca-input-group">
                            <label class="ca-label" for="email">Email</label>
                            <input id="email" v-model="email" type="email" :class="['ca-input', { 'ca-input-locked': lockEmail }]" :readonly="lockEmail" required />
                        </div>
                        <div class="ca-input-group">
                            <div class="ca-label-row">
                                <label class="ca-label" for="password">Password</label>
                                <a v-if="isLogin && forgotPasswordUrl" :href="forgotPasswordUrl" class="ca-forgot-link">Forgot password?</a>
                            </div>
                            <input id="password" v-model="password" type="password" class="ca-input" required />
                        </div>
                        <div v-if="error" class="ca-error">{{ error }}</div>
                        <button type="submit" class="ca-button" :disabled="loading || !canSubmit">
                            {{ loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Sign Up') }}
                        </button>
                    </form>
                    <div class="ca-footer">
                        {{ isLogin ? "Don't have an account? " : "Already have an account? " }}
                        <button class="ca-link" type="button" @click="switchMode">
                            {{ isLogin ? 'Sign up' : 'Sign in' }}
                        </button>
                    </div>
                </div>
                <template v-if="socialProviders.length > 0 && !lockEmail">
                    <div class="ca-split-divider">
                        <span class="ca-split-divider-text">Or</span>
                    </div>
                    <div class="ca-split-social">
                        <h3 class="ca-social-header">{{ isLogin ? 'Sign In With' : 'Sign Up With' }}</h3>
                        <div :class="socialClass">
                            <button v-for="provider in socialProviders" :key="provider" type="button" :class="`ca-button ca-button-social ca-button-${provider}`" :disabled="loading" @click="handleSocialLogin(provider)">
                                <svg v-if="provider === 'google'" class="ca-icon" viewBox="0 0 24 24" width="20" height="20"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" /><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" /><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.734 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" /><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.424 44.599 -10.174 45.789 L -6.744 42.359 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" /></g></svg>
                                <svg v-else-if="provider === 'github'" class="ca-icon" viewBox="0 0 24 24" width="20" height="20"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12c0-5.523-4.477-10-10-10z" fill="currentColor" /></svg>
                                <span class="ca-btn-text">{{ provider === 'github' ? 'GitHub' : 'Google' }}</span>
                            </button>
                        </div>
                    </div>
                </template>
            </div>
        </template>
    </div>
</template>
