import React, { useState } from 'react';
import { authClient } from '../client';

interface ForgotPasswordFormProps {
    client?: typeof authClient;
    onSuccess?: () => void;
    onBackToLogin?: () => void;
    className?: string;
    title?: React.ReactNode;
    width?: 'default' | 'compact' | 'wide';
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
    client = authClient,
    onSuccess,
    onBackToLogin,
    className,
    title,
    width = 'default'
}) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    let widthClass = '';
    if (width === 'compact') widthClass = 'ca-width-compact';
    else if (width === 'wide') widthClass = 'ca-width-wide';
    else widthClass = 'ca-width-default';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await client.requestPasswordReset({
                email,
                redirectTo: window.location.origin + '/auth/reset-password'
            });
            if (error) throw error;
            setSuccess(true);
            onSuccess?.();
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    const titleContent = title ? (
        typeof title === 'string' ? <h2 className="ca-title">{title}</h2> : title
    ) : (
        <h2 className="ca-title">Reset Password</h2>
    );

    if (success) {
        return (
            <div className={`ca-container ${widthClass} ${className || ''}`}>
                {titleContent}
                <div className="ca-success-message">
                    <svg className="ca-success-icon" viewBox="0 0 24 24" width="48" height="48">
                        <circle cx="12" cy="12" r="10" fill="#10B981" />
                        <path d="M8 12l2.5 2.5L16 9" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <h3 className="ca-success-title">Check your email</h3>
                    <p className="ca-success-text">
                        We've sent a password reset link to <strong>{email}</strong>.
                        Please check your inbox and click the link to reset your password.
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

    return (
        <div className={`ca-container ${widthClass} ${className || ''}`}>
            {titleContent}
            <p className="ca-subtitle">
                Enter your email address and we'll send you a link to reset your password.
            </p>
            <form onSubmit={handleSubmit} className="ca-form">
                <div className="ca-input-group">
                    <label className="ca-label" htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        className="ca-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                    />
                </div>

                {error && <div className="ca-error">{error}</div>}

                <button type="submit" className="ca-button" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Reset Link'}
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
