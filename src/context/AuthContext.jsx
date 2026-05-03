import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for an active session on mount
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setLoading(false);
        };
        getSession();

        // Subscribe to auth state changes (login, logout, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    // After any login, ensure the profile row exists and is up-to-date
    useEffect(() => {
        if (!user) return;

        const syncProfile = async () => {
            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id, full_name, email, avatar_url')
                    .eq('id', user.id)
                    .maybeSingle();

                const meta = user.user_metadata || {};
                const googleName = meta.full_name || meta.name || null;
                const googleAvatar = meta.avatar_url || meta.picture || null;

                if (!profile) {
                    // Profile missing — create it (DB trigger should handle this,
                    // but this is a client-side safety net)
                    await supabase.from('profiles').insert([{
                        id: user.id,
                        email: user.email,
                        full_name: googleName || meta.full_name || 'Student',
                        avatar_url: googleAvatar,
                    }]);
                    return;
                }

                // Profile exists — sync any stale fields
                const updates = {};
                if (user.email && profile.email !== user.email) updates.email = user.email;
                if (googleName && (!profile.full_name || profile.full_name === 'Student')) updates.full_name = googleName;
                if (googleAvatar && !profile.avatar_url) updates.avatar_url = googleAvatar;

                if (Object.keys(updates).length > 0) {
                    await supabase.from('profiles').update({ ...updates, updated_at: new Date() }).eq('id', user.id);
                }
            } catch (err) {
                console.error('Profile sync error:', err);
            }
        };

        syncProfile();
    }, [user]);

    const value = {
        signUp: (data) => supabase.auth.signUp(data),
        signIn: (data) => supabase.auth.signInWithPassword(data),
        googleSignIn: () =>
            supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin },
            }),
        signOut: async () => {
            setUser(null);
            await supabase.auth.signOut();
        },
        user,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
