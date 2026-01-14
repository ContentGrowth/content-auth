import React, { useState } from 'react';
import { authClient } from '../client';

export interface PasswordChangerProps {
    client?: typeof authClient;
    onSuccess?: (data?: any) => void;
    onError?: (error: string) => void;
    className?: string;
    revokeSessionsByDefault?: boolean;
}

export const PasswordChanger: React.FC<PasswordChangerProps> = ({
    client = authClient,
    onSuccess,
    onError,
    className,
    revokeSessionsByDefault = true
}) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            onError?.("New passwords don't match");
            return;
        }

        setLoading(true);

        try {
            const res = await client.changePassword({
                currentPassword,
                newPassword
            });

            if (res?.error) {
                throw new Error(res.error.message);
            }

            // Clear form on success
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

            onSuccess?.(res?.data);
        } catch (err: any) {
            onError?.(err.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={`ca-form ${className || ''}`}>
            <div className="ca-input-group">
                <label className="ca-label" htmlFor="current-password">Current Password</label>
                <input
                    id="current-password"
                    type="password"
                    className="ca-input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                />
            </div>

            <div className="ca-input-group">
                <label className="ca-label" htmlFor="new-password">New Password</label>
                <input
                    id="new-password"
                    type="password"
                    className="ca-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                />
            </div>

            <div className="ca-input-group">
                <label className="ca-label" htmlFor="confirm-password">Confirm New Password</label>
                <input
                    id="confirm-password"
                    type="password"
                    className="ca-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                />
            </div>

            <button type="submit" className="ca-button" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
            </button>
        </form>
    );
};
