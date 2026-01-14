import React, { useState, useEffect } from 'react';
import { authClient } from '../client';

export interface ProfileEditorProps {
    client?: typeof authClient;
    onSuccess?: (data?: any) => void;
    onError?: (error: string) => void;
    defaultName?: string;
    defaultImage?: string;
    className?: string;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({
    client = authClient,
    onSuccess,
    onError,
    defaultName = '',
    defaultImage = '',
    className
}) => {
    const [name, setName] = useState(defaultName);
    const [image, setImage] = useState(defaultImage);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (defaultName) setName(defaultName);
        if (defaultImage) setImage(defaultImage);
    }, [defaultName, defaultImage]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await client.updateUser({
                name,
                image
            });
            onSuccess?.();
        } catch (err: any) {
            onError?.(err.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={`ca-form ${className || ''}`}>
            <div className="ca-input-group">
                <label className="ca-label" htmlFor="profile-name">Name</label>
                <input
                    id="profile-name"
                    type="text"
                    className="ca-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                />
            </div>

            <div className="ca-input-group">
                <label className="ca-label" htmlFor="profile-image">Avatar URL</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                        id="profile-image"
                        type="url"
                        className="ca-input"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        placeholder="https://example.com/avatar.jpg"
                        style={{ flex: 1 }}
                    />
                    {image && (
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            flexShrink: 0,
                            border: '1px solid #eee'
                        }}>
                            <img
                                src={image}
                                alt="Preview"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                        </div>
                    )}
                </div>
            </div>

            <button type="submit" className="ca-button" disabled={loading}>
                {loading ? 'Saving...' : 'Save Profile'}
            </button>
        </form>
    );
};
