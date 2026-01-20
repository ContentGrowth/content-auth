import React, { useState, useEffect } from 'react';
import { authClient } from '../../client';

interface BaseOrgProps {
    client?: typeof authClient;
    className?: string;
    onSuccess?: (data?: any) => void;
    onError?: (error: string) => void;
}

// --- Create Organization Form ---

export const CreateOrganizationForm: React.FC<BaseOrgProps> = ({
    client = authClient,
    className,
    onSuccess,
    onError
}) => {
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await client.organization.create({
                name,
                slug,
            });
            if (result.error) throw result.error;
            setName('');
            setSlug('');
            onSuccess?.(result.data);
        } catch (err: any) {
            onError?.(err.message || "Failed to create organization");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={`ca-form ${className || ''}`}>
            <h3 className="ca-subtitle">Create Organization</h3>
            <div className="ca-input-group">
                <label className="ca-label">Organization Name</label>
                <input
                    type="text"
                    className="ca-input"
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        // Auto-slugify
                        if (!slug) setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                    }}
                    required
                    placeholder="Acme Corp"
                />
            </div>
            <div className="ca-input-group">
                <label className="ca-label">Slug</label>
                <input
                    type="text"
                    className="ca-input"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    required
                    placeholder="acme-corp"
                />
            </div>
            <button type="submit" className="ca-button" disabled={loading}>
                {loading ? 'Creating...' : 'Create Organization'}
            </button>
        </form>
    );
};

// --- Organization Switcher ---

export const OrganizationSwitcher: React.FC<BaseOrgProps & { currentOrgId?: string }> = ({
    client = authClient,
    className,
    currentOrgId,
    onSuccess
}) => {
    const [orgs, setOrgs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrgs = async () => {
            const { data } = await client.organization.list({});
            if (data) setOrgs(data);
            setLoading(false);
        };
        fetchOrgs();
    }, [client]);

    const handleSwitch = async (orgId: string) => {
        await client.organization.setActive({ organizationId: orgId });
        onSuccess?.(orgId);
    };

    if (loading) return <div className="ca-loading">Loading...</div>;

    return (
        <div className={`ca-org-switcher ${className || ''}`}>
            <label className="ca-label">Select Organization</label>
            <select
                className="ca-select"
                value={currentOrgId || ''}
                onChange={(e) => handleSwitch(e.target.value)}
            >
                <option value="" disabled>Select an organization</option>
                {orgs.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                ))}
            </select>
        </div>
    );
};

// --- Invite Member Form ---

export const InviteMemberForm: React.FC<BaseOrgProps & { organizationId?: string }> = ({
    client = authClient,
    className,
    onSuccess,
    onError
}) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('member');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await client.organization.inviteMember({
                email,
                role: role as any,
            });
            if (result.error) throw result.error;
            setEmail('');
            onSuccess?.(result.data);
        } catch (err: any) {
            onError?.(err.message || 'Invitation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={`ca-form ${className || ''}`}>
            <h3 className="ca-subtitle">Invite Member</h3>
            <div className="ca-input-group">
                <label className="ca-label">Email Address</label>
                <input
                    type="email"
                    className="ca-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="colleague@example.com"
                />
            </div>
            <div className="ca-input-group">
                <label className="ca-label">Role</label>
                <select
                    className="ca-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    <option value="owner">Owner</option>
                </select>
            </div>
            <button type="submit" className="ca-button" disabled={loading}>
                {loading ? 'Sending Invite...' : 'Send Invite'}
            </button>
        </form>
    );
};
