import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active sessions and sets the user
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setLoading(false);
        };

        getSession();

        // Listen for changes on auth state (logged in, signed out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Sync Profile Data (Email, Name, Avatar) with Auth Data
    useEffect(() => {
        const syncProfileData = async () => {
            if (!user) return;

            try {
                // Get current profile
                // Use maybeSingle() to avoid 406 error if row is missing
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .maybeSingle();

                const metadata = user.user_metadata || {};
                const googleName = metadata.full_name || metadata.name;

                // Case 1: Profile does not exist - INSERT
                if (!profile) {
                    console.log('Profile missing. Creating new profile from Google data...');
                    const newProfile = {
                        id: user.id,
                        email: user.email,
                        full_name: googleName || 'Student',
                        // Use PENDING prefix to trigger onboarding flow
                        registration_number: 'PENDING_' + user.id
                    };

                    const { error: insertError } = await supabase
                        .from('profiles')
                        .insert([newProfile]);

                    if (insertError) {
                        console.error('Error creating profile:', insertError);
                    } else {
                        console.log('Created new profile:', newProfile);
                    }
                    return;
                }

                // Case 2: Profile exists - UPDATE if needed
                const updates = {};

                // 2.1 Sync Email
                if (profile.email !== user.email) {
                    updates.email = user.email;
                }

                // 2.2 Sync Name from Google (if profile name is empty or default)
                const currentName = profile.full_name;
                if (googleName && (!currentName || currentName === 'Student')) {
                    updates.full_name = googleName;
                }

                // Apply updates if any
                if (Object.keys(updates).length > 0) {
                    const { error: updateError } = await supabase
                        .from('profiles')
                        .update(updates)
                        .eq('id', user.id);

                    if (updateError) console.error('Error updating profile:', updateError);
                    else console.log('Profile synced with Google data:', updates);
                }

            } catch (err) {
                console.error('Error syncing profile data:', err);
            }
        };

        syncProfileData();
    }, [user]);

    const value = {
        signUp: (data) => supabase.auth.signUp(data),
        signIn: (data) => supabase.auth.signInWithPassword(data),
        googleSignIn: () => {
            console.log('Google Sign In initiated.');
            console.log('RedirectTo Origin:', window.location.origin);
            return supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
        },
        signOut: async () => {
            setUser(null); // Optimistically clear user to trigger UI update
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
