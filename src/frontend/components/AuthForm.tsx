import React, { useState } from 'react';
import { authClient } from '../client';

interface AuthFormProps {
    client?: typeof authClient;
    onSuccess?: () => void;
    className?: string;
    socialProviders?: string[];
    socialLayout?: 'row' | 'column';
    title?: React.ReactNode;
    width?: 'default' | 'compact' | 'wide';
    layout?: 'default' | 'split';
    socialPosition?: 'top' | 'bottom';
    view?: 'signin' | 'signup';
}

export const AuthForm: React.FC<AuthFormProps> = ({
    client = authClient,
    onSuccess,
    className,
    socialProviders = [],
    socialLayout = 'row',
    title,
    width = 'default',
    layout = 'default',
    socialPosition = 'top',
    view
}) => {
    const [isLogin, setIsLogin] = useState(view !== 'signup');
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
                callbackURL: window.location.href
            });
        } catch (err: any) {
            setError(err.message || `Failed to sign in with ${provider}`);
            setLoading(false);
        }
    };

    const socialClass = socialLayout === 'column' ? 'ca-social-column' : 'ca-social-grid';

    // Map width prop to class. 'default' and 'wide' mapped to new system or kept as fallbacks if needed.
    // Assuming 'wide' mapped to 'max' logic or just keeping 'ca-container-wide' separation if legacy.
    // For split layout, strictly use the new classes.
    let widthClass = '';
    if (width === 'compact') widthClass = 'ca-width-compact';
    else if (width === 'wide') widthClass = 'ca-width-wide';
    else widthClass = 'ca-width-default'; // default for split

    const containerClass = `ca-container ${layout === 'split' ? 'ca-layout-split' : ''} ${widthClass} ${className || ''}`;

    const renderSocials = () => (
        socialProviders.length > 0 && (
            <div className={socialClass}>
                {socialProviders.map(provider => (
                    <button
                        key={provider}
                        type="button"
                        className={`ca-button ca-button-social ca-button-${provider}`}
                        onClick={() => handleSocialLogin(provider)}
                        disabled={loading}
                    >
                        {provider === 'google' && (
                            <svg className="ca-icon" viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" /><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" /><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.734 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" /><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.424 44.599 -10.174 45.789 L -6.744 42.359 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" /></g></svg>
                        )}
                        {provider === 'github' && (
                            <svg className="ca-icon" viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12c0-5.523-4.477-10-10-10z" fill="currentColor" /></svg>
                        )}
                        <span className="ca-btn-text">
                            {provider === 'github' ? 'GitHub' : 'Google'}
                        </span>
                    </button>
                ))}
            </div>
        )
    );

    const renderForm = () => (
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
    );

    const renderFooter = () => (
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
    );

    const titleContent = title ? (
        typeof title === 'string' ? <h2 className="ca-title">{title}</h2> : title
    ) : (
        <h2 className="ca-title">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
    );

    if (layout === 'split') {
        return (
            <div className={containerClass}>
                {titleContent}
                <div className="ca-split-body">
                    <div className="ca-split-main">
                        {renderForm()}
                        {renderFooter()}
                    </div>
                    {socialProviders.length > 0 && (
                        <>
                            <div className="ca-split-divider">
                                <span className="ca-split-divider-text">Or</span>
                            </div>
                            <div className="ca-split-social">
                                {renderSocials()}
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={containerClass}>
            {titleContent}

            {socialPosition === 'top' && socialProviders.length > 0 && (
                <>
                    {renderSocials()}
                    <div className="ca-divider">
                        <span className="ca-divider-text">Or continue with</span>
                    </div>
                </>
            )}

            {renderForm()}

            {socialPosition === 'bottom' && socialProviders.length > 0 && (
                <>
                    <div className="ca-divider">
                        <span className="ca-divider-text">Or continue with</span>
                    </div>
                    {renderSocials()}
                </>
            )}

            {renderFooter()}
        </div>
    );
};
