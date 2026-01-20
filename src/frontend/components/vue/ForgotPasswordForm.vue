<script setup lang="ts">
import { ref, computed } from 'vue';
import { createClient } from '../../clients/vue-client';

interface Props {
    baseUrl?: string;
    backToLoginUrl?: string;
    title?: string;
    width?: 'default' | 'compact' | 'wide';
}

const props = withDefaults(defineProps<Props>(), {
    title: 'Reset Password',
    width: 'default',
});

const emit = defineEmits<{
    (e: 'success'): void;
    (e: 'error', error: string): void;
}>();

const client = computed(() => createClient(props.baseUrl));

const email = ref('');
const loading = ref(false);
const error = ref<string | null>(null);
const success = ref(false);

const widthClass = computed(() => {
    if (props.width === 'compact') return 'ca-width-compact';
    if (props.width === 'wide') return 'ca-width-wide';
    return 'ca-width-default';
});

const handleSubmit = async () => {
    loading.value = true;
    error.value = null;

    try {
        const { error: err } = await client.value.requestPasswordReset({
            email: email.value,
            redirectTo: window.location.origin + '/auth/reset-password'
        });
        if (err) throw err;
        success.value = true;
        emit('success');
    } catch (err: any) {
        error.value = err.message || 'Failed to send reset email';
        emit('error', error.value);
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div :class="`ca-container ${widthClass}`">
        <h2 class="ca-title">{{ title }}</h2>
        
        <!-- Success State -->
        <template v-if="success">
            <div class="ca-success-message">
                <svg class="ca-success-icon" viewBox="0 0 24 24" width="48" height="48">
                    <circle cx="12" cy="12" r="10" fill="#10B981" />
                    <path d="M8 12l2.5 2.5L16 9" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <h3 class="ca-success-title">Check your email</h3>
                <p class="ca-success-text">
                    We've sent a password reset link to <strong>{{ email }}</strong>.
                    Please check your inbox and click the link to reset your password.
                </p>
            </div>
            <div v-if="backToLoginUrl" class="ca-footer">
                <a :href="backToLoginUrl" class="ca-link">Back to Sign In</a>
            </div>
        </template>

        <!-- Form State -->
        <template v-else>
            <p class="ca-subtitle">
                Enter your email address and we'll send you a link to reset your password.
            </p>
            <form class="ca-form" @submit.prevent="handleSubmit">
                <div class="ca-input-group">
                    <label class="ca-label" for="email">Email</label>
                    <input
                        id="email"
                        v-model="email"
                        type="email"
                        class="ca-input"
                        placeholder="you@example.com"
                        required
                    />
                </div>

                <div v-if="error" class="ca-error">{{ error }}</div>

                <button type="submit" class="ca-button" :disabled="loading">
                    {{ loading ? 'Sending...' : 'Send Reset Link' }}
                </button>
            </form>

            <div v-if="backToLoginUrl" class="ca-footer">
                <a :href="backToLoginUrl" class="ca-link">Back to Sign In</a>
            </div>
        </template>
    </div>
</template>
