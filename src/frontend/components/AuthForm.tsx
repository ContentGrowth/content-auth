import React, { useState } from 'react';
import { authClient } from '../client';

interface AuthFormProps {
    client?: typeof authClient;
    onSuccess?: () => void;
    className?: string;
}

export const AuthForm: React.FC<AuthFormProps & { socialProviders?: string[] }> = ({
    client = authClient,
    onSuccess,
    className,
    socialProviders = []
}) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error } = await client.signIn.email({
                    email,
                    password,
                });
                if (error) throw error;
            } else {
                const { error } = await client.signUp.email({
                    email,
                    password,
                    name,
                });
                if (error) throw error;
            }
            onSuccess?.();
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = async (provider: string) => {
        setLoading(true);
        try {
            await client.signIn.social({
                provider: provider as any,
                callbackURL: window.location.href // Redirect back to current page
            });
            // Note: Social login usually redirects, so onSuccess might not be hit immediately here
        } catch (err: any) {
            setError(err.message || `Failed to sign in with ${provider}`);
            setLoading(false);
        }
    };

    return (
        <div className={`ca-container ${className || ''}`}>
            <h2 className="ca-title">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>

            {socialProviders.length > 0 && (
                <div className="ca-social-buttons">
                    {socialProviders.map(provider => (
                        <button
                            key={provider}
                            type="button"
                            className="ca-button ca-button-outline"
                            onClick={() => handleSocialLogin(provider)}
                            disabled={loading}
                        >
                            Continue with {provider.charAt(0).toUpperCase() + provider.slice(1)}
                        </button>
                    ))}
                    <div className="ca-divider">
                        <span>Or continue with email</span>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="ca-form">
                {!isLogin && (
                    <div className="ca-input-group">
                        <label className="ca-label" htmlFor="name">Name</label>
                        <input
                            id="name"
                            type="text"
                            className="ca-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                )}

                <div className="ca-input-group">
                    <label className="ca-label" htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        className="ca-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="ca-input-group">
                    <label className="ca-label" htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        className="ca-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                {error && <div className="ca-error">{error}</div>}

                <button type="submit" className="ca-button" disabled={loading}>
                    {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Sign Up')}
                </button>
            </form>

            <div className="ca-footer">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                    className="ca-link"
                    onClick={() => setIsLogin(!isLogin)}
                    type="button"
                >
                    {isLogin ? 'Sign up' : 'Sign in'}
                </button>
            </div>
        </div>
    );
};
