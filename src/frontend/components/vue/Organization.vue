<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { createClient } from '../../clients/vue-client';

// CreateOrganizationForm Props
interface CreateOrgProps {
    component: 'create';
    baseUrl?: string;
    className?: string;
}

// OrganizationSwitcher Props
interface SwitcherProps {
    component: 'switcher';
    baseUrl?: string;
    currentOrgId?: string;
    className?: string;
}

// InviteMemberForm Props
interface InviteProps {
    component: 'invite';
    baseUrl?: string;
    className?: string;
}

type Props = CreateOrgProps | SwitcherProps | InviteProps;

const props = defineProps<Props>();

const emit = defineEmits<{
    (e: 'success', data?: any): void;
    (e: 'error', error: string): void;
}>();

const client = computed(() => createClient(props.baseUrl));

// Create Organization Form State
const orgName = ref('');
const orgSlug = ref('');
const createLoading = ref(false);
const createError = ref<string | null>(null);
const createSuccess = ref(false);

// Organization Switcher State
const orgs = ref<any[]>([]);
const switcherLoading = ref(true);
const selectedOrgId = ref('');

// Invite Member Form State
const inviteEmail = ref('');
const inviteRole = ref('member');
const inviteLoading = ref(false);
const inviteError = ref<string | null>(null);
const inviteSuccess = ref(false);

// Auto-slugify for create form
watch(orgName, (val) => {
    if (props.component === 'create' && !orgSlug.value) {
        orgSlug.value = val.toLowerCase().replace(/\s+/g, '-');
    }
});

// Load orgs for switcher
onMounted(async () => {
    if (props.component === 'switcher') {
        try {
            const { data } = await client.value.organization.list({});
            if (data) orgs.value = data;
            if ((props as SwitcherProps).currentOrgId) {
                selectedOrgId.value = (props as SwitcherProps).currentOrgId!;
            }
        } catch (err) {
            console.error('Failed to load organizations', err);
        } finally {
            switcherLoading.value = false;
        }
    }
});

const handleCreateOrg = async () => {
    createLoading.value = true;
    createError.value = null;
    createSuccess.value = false;

    try {
        const result = await client.value.organization.create({
            name: orgName.value,
            slug: orgSlug.value,
        });
        if (result.error) throw result.error;
        orgName.value = '';
        orgSlug.value = '';
        createSuccess.value = true;
        emit('success', result.data);
    } catch (err: any) {
        createError.value = err.message || 'Failed to create organization';
        emit('error', createError.value);
    } finally {
        createLoading.value = false;
    }
};

const handleSwitchOrg = async () => {
    if (!selectedOrgId.value) return;
    await client.value.organization.setActive({ organizationId: selectedOrgId.value });
    emit('success', selectedOrgId.value);
};

const handleInvite = async () => {
    inviteLoading.value = true;
    inviteError.value = null;
    inviteSuccess.value = false;

    try {
        const result = await client.value.organization.inviteMember({
            email: inviteEmail.value,
            role: inviteRole.value as any,
        });
        if (result.error) throw result.error;
        inviteEmail.value = '';
        inviteSuccess.value = true;
        emit('success', result.data);
    } catch (err: any) {
        inviteError.value = err.message || 'Invitation failed';
        emit('error', inviteError.value);
    } finally {
        inviteLoading.value = false;
    }
};
</script>

<template>
    <!-- Create Organization Form -->
    <form v-if="component === 'create'" :class="`ca-form ${(props as CreateOrgProps).className || ''}`" @submit.prevent="handleCreateOrg">
        <h3 class="ca-subtitle">Create Organization</h3>
        <div class="ca-input-group">
            <label class="ca-label">Organization Name</label>
            <input
                v-model="orgName"
                type="text"
                class="ca-input"
                required
                placeholder="Acme Corp"
            />
        </div>
        <div class="ca-input-group">
            <label class="ca-label">Slug</label>
            <input
                v-model="orgSlug"
                type="text"
                class="ca-input"
                required
                placeholder="acme-corp"
            />
        </div>
        <div v-if="createError" class="ca-error">{{ createError }}</div>
        <div v-if="createSuccess" class="ca-success-message" style="padding: 0.75rem; background: #d1fae5; border-radius: 6px; color: #065f46; text-align: center;">
            Organization created!
        </div>
        <button type="submit" class="ca-button" :disabled="createLoading">
            {{ createLoading ? 'Creating...' : 'Create Organization' }}
        </button>
    </form>

    <!-- Organization Switcher -->
    <div v-else-if="component === 'switcher'" :class="`ca-org-switcher ${(props as SwitcherProps).className || ''}`">
        <label class="ca-label">Select Organization</label>
        <select 
            v-model="selectedOrgId" 
            class="ca-select" 
            :disabled="switcherLoading"
            @change="handleSwitchOrg"
        >
            <option v-if="switcherLoading" value="" disabled>Loading...</option>
            <option v-else-if="orgs.length === 0" value="" disabled>No organizations</option>
            <template v-else>
                <option value="" disabled>Select an organization</option>
                <option v-for="org in orgs" :key="org.id" :value="org.id">
                    {{ org.name }}
                </option>
            </template>
        </select>
    </div>

    <!-- Invite Member Form -->
    <form v-else-if="component === 'invite'" :class="`ca-form ${(props as InviteProps).className || ''}`" @submit.prevent="handleInvite">
        <h3 class="ca-subtitle">Invite Member</h3>
        <div class="ca-input-group">
            <label class="ca-label">Email Address</label>
            <input
                v-model="inviteEmail"
                type="email"
                class="ca-input"
                required
                placeholder="colleague@example.com"
            />
        </div>
        <div class="ca-input-group">
            <label class="ca-label">Role</label>
            <select v-model="inviteRole" class="ca-select">
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
            </select>
        </div>
        <div v-if="inviteError" class="ca-error">{{ inviteError }}</div>
        <div v-if="inviteSuccess" class="ca-success-message" style="padding: 0.75rem; background: #d1fae5; border-radius: 6px; color: #065f46; text-align: center;">
            Invitation sent!
        </div>
        <button type="submit" class="ca-button" :disabled="inviteLoading">
            {{ inviteLoading ? 'Sending Invite...' : 'Send Invite' }}
        </button>
    </form>
</template>
