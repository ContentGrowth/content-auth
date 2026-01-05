import React, { useState } from 'react';
import { authClient } from '../client';

interface ResetPasswordFormProps {
    /** The reset token from the URL query parameter */
    token: string | null;
    client?: typeof authClient;
    onSuccess?: () => void;
    onBackToLogin?: () => void;
    className?: string;
    title?: React.ReactNode;
    width?: 'default' | 'compact' | 'wide';
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
    token,
    client = authClient,
    onSuccess,
    onBackToLogin,
    className,
    title,
    width = 'default'
}) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    let widthClass = '';
    if (width === 'compact') widthClass = 'ca-width-compact';
    else if (width === 'wide') widthClass = 'ca-width-wide';
    else widthClass = 'ca-width-default';

    const titleContent = title ? (
        typeof title === 'string' ? <h2 className="ca-title">{title}</h2> : title
    ) : (
        <h2 className="ca-title">Set New Password</h2>
    );

    // Handle missing token
    if (!token) {
        return (
            <div className={`ca-container ${widthClass} ${className || ''}`}>
                {titleContent}
                <div className="ca-error-message">
                    <svg className="ca-error-icon" viewBox="0 0 24 24" width="48" height="48">
                        <circle cx="12" cy="12" r="10" fill="#EF4444" />
                        <path d="M12 8v4M12 16h.01" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <h3 className="ca-error-title">Invalid or Missing Token</h3>
                    <p className="ca-error-text">
                        The password reset link is invalid or has expired.
                        Please request a new password reset.
                    </p>
                </div>
                {onBackToLogin && (
                    <div className="ca-footer">
                        <button className="ca-link" onClick={onBackToLogin} type="button">
                            Back to Sign In
                        </button>
                    </div>
                )}
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error } = await client.resetPassword({
                token,
                newPassword: password
            });
            if (error) throw error;
            setSuccess(true);
            onSuccess?.();
        } catch (err: any) {
            setError(err.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className={`ca-container ${widthClass} ${className || ''}`}>
                {titleContent}
                <div className="ca-success-message">
                    <svg className="ca-success-icon" viewBox="0 0 24 24" width="48" height="48">
                        <circle cx="12" cy="12" r="10" fill="#10B981" />
                        <path d="M8 12l2.5 2.5L16 9" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <h3 className="ca-success-title">Password Reset Successful</h3>
                    <p className="ca-success-text">
                        Your password has been successfully reset. You can now sign in with your new password.
                    </p>
                </div>
                {onBackToLogin && (
                    <div className="ca-footer">
                        <button className="ca-link" onClick={onBackToLogin} type="button">
                            Sign In
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`ca-container ${widthClass} ${className || ''}`}>
            {titleContent}
            <p className="ca-subtitle">
                Enter your new password below.
            </p>
            <form onSubmit={handleSubmit} className="ca-form">
                <div className="ca-input-group">
                    <label className="ca-label" htmlFor="password">New Password</label>
                    <input
                        id="password"
                        type="password"
                        className="ca-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        minLength={8}
                        required
                    />
                </div>

                <div className="ca-input-group">
                    <label className="ca-label" htmlFor="confirmPassword">Confirm Password</label>
                    <input
                        id="confirmPassword"
                        type="password"
                        className="ca-input"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        required
                    />
                </div>

                {error && <div className="ca-error">{error}</div>}

                <button type="submit" className="ca-button" disabled={loading}>
                    {loading ? 'Resetting...' : 'Reset Password'}
                </button>
            </form>

            {onBackToLogin && (
                <div className="ca-footer">
                    <button className="ca-link" onClick={onBackToLogin} type="button">
                        Back to Sign In
                    </button>
                </div>
            )}
        </div>
    );
};
