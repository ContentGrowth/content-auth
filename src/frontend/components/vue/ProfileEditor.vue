<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { createClient } from '../../clients/vue-client';

interface Props {
    baseUrl?: string;
    defaultName?: string;
    defaultImage?: string;
    className?: string;
}

const props = withDefaults(defineProps<Props>(), {
    defaultName: '',
    defaultImage: '',
    className: '',
});

const emit = defineEmits<{
    (e: 'success', data?: any): void;
    (e: 'error', error: string): void;
}>();

const client = computed(() => createClient(props.baseUrl));

const name = ref(props.defaultName);
const image = ref(props.defaultImage);
const loading = ref(false);
const error = ref<string | null>(null);
const success = ref(false);
const imageError = ref(false);

watch(() => props.defaultName, (val) => { if (val) name.value = val; });
watch(() => props.defaultImage, (val) => { if (val) image.value = val; });

const handleSubmit = async () => {
    loading.value = true;
    error.value = null;
    success.value = false;

    try {
        await client.value.updateUser({
            name: name.value,
            image: image.value
        });
        success.value = true;
        emit('success');
    } catch (err: any) {
        error.value = err.message || 'Failed to update profile';
        emit('error', error.value);
    } finally {
        loading.value = false;
    }
};

const handleImageError = () => {
    imageError.value = true;
};

const handleImageInput = () => {
    imageError.value = false;
};
</script>

<template>
    <form :class="`ca-form ${className}`" @submit.prevent="handleSubmit">
        <div class="ca-input-group">
            <label class="ca-label" for="profile-name">Name</label>
            <input
                id="profile-name"
                v-model="name"
                type="text"
                class="ca-input"
                placeholder="Your Name"
            />
        </div>

        <div class="ca-input-group">
            <label class="ca-label" for="profile-image">Avatar URL</label>
            <div style="display: flex; gap: 10px; align-items: center;">
                <input
                    id="profile-image"
                    v-model="image"
                    type="url"
                    class="ca-input"
                    placeholder="https://example.com/avatar.jpg"
                    style="flex: 1;"
                    @input="handleImageInput"
                />
                <div 
                    v-if="image && !imageError"
                    style="width: 40px; height: 40px; border-radius: 50%; overflow: hidden; flex-shrink: 0; border: 1px solid #eee;"
                >
                    <img
                        :src="image"
                        alt="Preview"
                        style="width: 100%; height: 100%; object-fit: cover;"
                        @error="handleImageError"
                    />
                </div>
            </div>
        </div>

        <div v-if="error" class="ca-error">{{ error }}</div>
        <div v-if="success" class="ca-success-message" style="padding: 0.75rem; background: #d1fae5; border-radius: 6px; color: #065f46; text-align: center;">
            Profile updated successfully!
        </div>

        <button type="submit" class="ca-button" :disabled="loading">
            {{ loading ? 'Saving...' : 'Save Profile' }}
        </button>
    </form>
</template>
