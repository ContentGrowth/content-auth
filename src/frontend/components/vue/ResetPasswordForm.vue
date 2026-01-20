<script setup lang="ts">
import { ref, computed } from 'vue';
import { createClient } from '../../clients/vue-client';

interface Props {
    token?: string | null;
    baseUrl?: string;
    backToLoginUrl?: string;
    title?: string;
    width?: 'default' | 'compact' | 'wide';
}

const props = withDefaults(defineProps<Props>(), {
    title: 'Set New Password',
    width: 'default',
});

const emit = defineEmits<{
    (e: 'success'): void;
    (e: 'error', error: string): void;
}>();

const client = computed(() => createClient(props.baseUrl));

const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const error = ref<string | null>(null);
const success = ref(false);

const widthClass = computed(() => {
    if (props.width === 'compact') return 'ca-width-compact';
    if (props.width === 'wide') return 'ca-width-wide';
    return 'ca-width-default';
});

const hasToken = computed(() => !!props.token);

const handleSubmit = async () => {
    if (password.value !== confirmPassword.value) {
        error.value = 'Passwords do not match';
        return;
    }

    if (password.value.length < 8) {
        error.value = 'Password must be at least 8 characters';
        return;
    }

    loading.value = true;
    error.value = null;

    try {
        const { error: err } = await client.value.resetPassword({
            token: props.token!,
            newPassword: password.value
        });
        if (err) throw err;
        success.value = true;
        emit('success');
    } catch (err: any) {
        error.value = err.message || 'Failed to reset password';
        emit('error', error.value);
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div :class="`ca-container ${widthClass}`">
        <h2 class="ca-title">{{ title }}</h2>

        <!-- Missing Token State -->
        <template v-if="!hasToken">
            <div class="ca-error-message">
                <svg class="ca-error-icon" viewBox="0 0 24 24" width="48" height="48">
                    <circle cx="12" cy="12" r="10" fill="#EF4444" />
                    <path d="M12 8v4M12 16h.01" stroke="white" stroke-width="2" stroke-linecap="round" />
                </svg>
                <h3 class="ca-error-title">Invalid or Missing Token</h3>
                <p class="ca-error-text">
                    The password reset link is invalid or has expired.
                    Please request a new password reset.
                </p>
            </div>
            <div v-if="backToLoginUrl" class="ca-footer">
                <a :href="backToLoginUrl" class="ca-link">Back to Sign In</a>
            </div>
        </template>

        <!-- Success State -->
        <template v-else-if="success">
            <div class="ca-success-message">
                <svg class="ca-success-icon" viewBox="0 0 24 24" width="48" height="48">
                    <circle cx="12" cy="12" r="10" fill="#10B981" />
                    <path d="M8 12l2.5 2.5L16 9" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <h3 class="ca-success-title">Password Reset Successful</h3>
                <p class="ca-success-text">
                    Your password has been successfully reset. You can now sign in with your new password.
                </p>
            </div>
            <div v-if="backToLoginUrl" class="ca-footer">
                <a :href="backToLoginUrl" class="ca-link">Sign In</a>
            </div>
        </template>

        <!-- Form State -->
        <template v-else>
            <p class="ca-subtitle">Enter your new password below.</p>
            <form class="ca-form" @submit.prevent="handleSubmit">
                <div class="ca-input-group">
                    <label class="ca-label" for="password">New Password</label>
                    <input
                        id="password"
                        v-model="password"
                        type="password"
                        class="ca-input"
                        placeholder="At least 8 characters"
                        minlength="8"
                        required
                    />
                </div>

                <div class="ca-input-group">
                    <label class="ca-label" for="confirmPassword">Confirm Password</label>
                    <input
                        id="confirmPassword"
                        v-model="confirmPassword"
                        type="password"
                        class="ca-input"
                        placeholder="Confirm your password"
                        required
                    />
                </div>

                <div v-if="error" class="ca-error">{{ error }}</div>

                <button type="submit" class="ca-button" :disabled="loading">
                    {{ loading ? 'Resetting...' : 'Reset Password' }}
                </button>
            </form>

            <div v-if="backToLoginUrl" class="ca-footer">
                <a :href="backToLoginUrl" class="ca-link">Back to Sign In</a>
            </div>
        </template>
    </div>
</template>
