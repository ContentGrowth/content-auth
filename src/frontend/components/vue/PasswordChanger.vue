<script setup lang="ts">
import { ref, computed } from 'vue';
import { createClient } from '../../clients/vue-client';

interface Props {
    baseUrl?: string;
    className?: string;
}

const props = withDefaults(defineProps<Props>(), {
    className: '',
});

const emit = defineEmits<{
    (e: 'success', data?: any): void;
    (e: 'error', error: string): void;
}>();

const client = computed(() => createClient(props.baseUrl));

const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const error = ref<string | null>(null);
const success = ref(false);

const handleSubmit = async () => {
    if (newPassword.value !== confirmPassword.value) {
        error.value = "New passwords don't match";
        emit('error', error.value);
        return;
    }

    loading.value = true;
    error.value = null;
    success.value = false;

    try {
        const res = await client.value.changePassword({
            currentPassword: currentPassword.value,
            newPassword: newPassword.value
        });

        if (res?.error) {
            throw new Error(res.error.message);
        }

        // Clear form on success
        currentPassword.value = '';
        newPassword.value = '';
        confirmPassword.value = '';
        success.value = true;

        emit('success', res?.data);
    } catch (err: any) {
        if (err?.code === 'CREDENTIAL_ACCOUNT_NOT_FOUND' || err?.message?.includes('Credential account not found')) {
            error.value = "You are logged in via a social provider (e.g. GitHub, Google) and do not have a password set.";
        } else {
            error.value = err.message || 'Failed to change password';
        }
        emit('error', error.value);
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <form :class="`ca-form ${className}`" @submit.prevent="handleSubmit">
        <div class="ca-input-group">
            <label class="ca-label" for="current-password">Current Password</label>
            <input
                id="current-password"
                v-model="currentPassword"
                type="password"
                class="ca-input"
                required
            />
        </div>

        <div class="ca-input-group">
            <label class="ca-label" for="new-password">New Password</label>
            <input
                id="new-password"
                v-model="newPassword"
                type="password"
                class="ca-input"
                minlength="8"
                required
            />
        </div>

        <div class="ca-input-group">
            <label class="ca-label" for="confirm-password">Confirm New Password</label>
            <input
                id="confirm-password"
                v-model="confirmPassword"
                type="password"
                class="ca-input"
                minlength="8"
                required
            />
        </div>

        <div v-if="error" class="ca-error">{{ error }}</div>
        <div v-if="success" class="ca-success-message" style="padding: 0.75rem; background: #d1fae5; border-radius: 6px; color: #065f46; text-align: center;">
            Password updated successfully!
        </div>

        <button type="submit" class="ca-button" :disabled="loading">
            {{ loading ? 'Updating...' : 'Update Password' }}
        </button>
    </form>
</template>
