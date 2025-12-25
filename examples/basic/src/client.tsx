import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthForm, CreateOrganizationForm, OrganizationSwitcher, InviteMemberForm, authClient } from '@contentgrowth/content-auth/frontend';
import '@contentgrowth/content-auth/styles.css';

const App = () => {
    const [session, setSession] = useState<any>(null);
    const [activeOrg, setActiveOrg] = useState<string | null>(null);

    // Initial check
    React.useEffect(() => {
        authClient.getSession().then(({ data }) => setSession(data));
        authClient.organization.list().then(({ data }) => {
            if (data && data.length > 0) setActiveOrg(data[0].id);
        });
    }, []);

    if (!session) {
        return (
            <div style={{ maxWidth: 400, margin: '40px auto' }}>
                <AuthForm
                    onSuccess={() => {
                        authClient.getSession().then(({ data }) => setSession(data));
                    }}
                    socialProviders={['github', 'google']}
                />
            </div>
        );
    }

    return (
        <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
                <h1>Welcome, {session.user.name}</h1>
                <button
                    onClick={async () => {
                        await authClient.signOut();
                        setSession(null);
                    }}
                    className="ca-button ca-button-outline"
                >
                    Sign Out
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                <div className="card">
                    <h2>Organizations</h2>
                    <OrganizationSwitcher
                        currentOrgId={activeOrg || undefined}
                        onSuccess={(orgId) => setActiveOrg(orgId)}
                        className="mb-6"
                    />

                    <div style={{ marginTop: 20 }}>
                        <CreateOrganizationForm
                            onSuccess={(org) => {
                                alert(`Created ${org.name}!`);
                                setActiveOrg(org.id);
                            }}
                        />
                    </div>
                </div>

                {activeOrg && (
                    <div className="card">
                        <h2>Team Management</h2>
                        <InviteMemberForm
                            organizationId={activeOrg}
                            onSuccess={(invitation) => alert(`Invited ${invitation.email}`)}
                        />
                    </div>
                )}
            </div>

            <style>{`
                .card {
                    background: white;
                    padding: 24px;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .mb-6 { margin-bottom: 24px; }
            `}</style>
        </div>
    );
};

const root = createRoot(document.getElementById('auth-container')!);
root.render(<App />);
