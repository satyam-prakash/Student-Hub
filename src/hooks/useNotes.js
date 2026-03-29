import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function useNotes() {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [trendingNotes, setTrendingNotes] = useState([]);

    // Fetch all notes
    const fetchNotes = async (filters = {}) => {
        setLoading(true);
        setError(null);
        try {
            let query = supabase
                .from('notes')
                .select('*')
                .order('created_at', { ascending: false });

            // Apply filters
            if (filters.courseCode) {
                query = query.eq('course_code', filters.courseCode);
            }
            if (filters.semester) {
                query = query.eq('semester', filters.semester);
            }
            if (filters.search) {
                query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,course_code.ilike.%${filters.search}%`);
            }

            const { data, error } = await query;

            if (error) throw error;
            setNotes(data || []);
        } catch (err) {
            console.error('Error fetching notes:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch trending notes (top 5 by downloads)
    const fetchTrendingNotes = async () => {
        try {
            const { data, error } = await supabase
                .from('notes')
                .select('*')
                .order('downloads', { ascending: false })
                .limit(5);

            if (error) throw error;
            setTrendingNotes(data || []);
        } catch (err) {
            console.error('Error fetching trending notes:', err);
        }
    };

    // Delete note
    const deleteNote = async (noteId) => {
        try {
            const { error } = await supabase
                .from('notes')
                .delete()
                .eq('id', noteId);

            if (error) throw error;

            // Refresh notes list
            fetchNotes();
            return true;
        } catch (err) {
            console.error('Error deleting note:', err);
            setError(err.message);
            return false;
        }
    };

    // Increment download count
    const incrementDownloads = async (noteId) => {
        try {
            const note = notes.find(n => n.id === noteId);
            if (!note) return;

            const { error } = await supabase
                .from('notes')
                .update({ downloads: (note.downloads || 0) + 1 })
                .eq('id', noteId);

            if (error) throw error;

            // Update local state
            setNotes(notes.map(n =>
                n.id === noteId ? { ...n, downloads: (n.downloads || 0) + 1 } : n
            ));
        } catch (err) {
            console.error('Error incrementing downloads:', err);
        }
    };

    // Create note (metadata only, file upload handled separately)
    const createNote = async (noteData) => {
        try {
            const { data, error } = await supabase
                .from('notes')
                .insert([noteData])
                .select()
                .single();

            if (error) throw error;

            // Refresh notes list
            fetchNotes();
            return data;
        } catch (err) {
            console.error('Error creating note:', err);
            setError(err.message);
            throw err;
        }
    };

    return {
        notes,
        loading,
        error,
        fetchNotes,
        deleteNote,
        incrementDownloads,
        createNote,
        trendingNotes,
        fetchTrendingNotes
    };
}
