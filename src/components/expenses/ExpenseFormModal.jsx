import { useState, useEffect, useRef } from 'react';
import { 
    X, Mic, MicOff, Camera, Coffee, Car, Receipt, 
    ShoppingBag, Heart, Shield, Plane, Book, Zap, Plus, CheckSquare, Edit2
} from 'lucide-react';

const CATEGORIES = [
    { name: 'Food', icon: <Coffee size={24} /> },
    { name: 'Transportation', icon: <Car size={24} /> },
    { name: 'Bills', icon: <Receipt size={24} /> },
    { name: 'Shopping', icon: <ShoppingBag size={24} /> },
    { name: 'Health', icon: <Heart size={24} /> },
    { name: 'Entertainment', icon: <Shield size={24} /> },
    { name: 'Travel', icon: <Plane size={24} /> },
    { name: 'Education', icon: <Book size={24} /> },
    { name: 'Utilities', icon: <Zap size={24} /> },
    { name: 'Other', icon: <Plus size={24} /> }
];

const WALLETS = ['Cash', 'Bank', 'Card', 'UPI'];

export default function ExpenseFormModal({ isOpen, onClose, onSubmit, initialData }) {
    const [formData, setFormData] = useState({
        amount: '',
        category: CATEGORIES[0].name,
        wallet: WALLETS[2],
        date: new Date().toISOString().split('T')[0],
        description: '',
        notes: '',
        receiptFile: null
    });
    
    const [isListening, setIsListening] = useState(false);
    const [isEditMode, setIsEditMode] = useState(true); // new view/edit mode state
    
    const recognitionRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
            const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRec();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            
            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                const possibleAmount = parseFloat(transcript.replace(/[^0-9.]/g, ''));
                if (!isNaN(possibleAmount) && possibleAmount > 0) {
                    setFormData(prev => ({ ...prev, amount: possibleAmount.toString() }));
                } else {
                    setFormData(prev => ({ ...prev, description: prev.description ? `${prev.description} ${transcript}` : transcript }));
                }
                setIsListening(false);
            };

            recognitionRef.current.onerror = () => setIsListening(false);
            recognitionRef.current.onend = () => setIsListening(false);
        }
    }, []);

    useEffect(() => {
        if (initialData) {
            const descStr = initialData.description || '';
            const parts = descStr.split(' | Note: ');
            setFormData({
                amount: initialData.amount,
                category: initialData.category,
                wallet: initialData.wallet,
                date: new Date(initialData.date).toISOString().split('T')[0],
                description: parts[0] || '',
                notes: parts[1] || '',
                receiptFile: null
            });
            setIsEditMode(false); // Viewing an existing transaction
        } else {
            setFormData({
                amount: '',
                category: CATEGORIES[0].name,
                wallet: WALLETS[2],
                date: new Date().toISOString().split('T')[0],
                description: '',
                notes: '',
                receiptFile: null
            });
            setIsEditMode(true); // Creating a new transaction
        }
        setIsListening(false);
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const submissionData = {
            ...formData,
            description: formData.notes ? `${formData.description} | Note: ${formData.notes}` : formData.description,
            date: new Date(formData.date).toISOString()
        };
        delete submissionData.notes;
        delete submissionData.receiptFile;
        onSubmit(submissionData);
    };

    const toggleListening = () => {
        if (!isEditMode) return;
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const triggerCamera = () => {
        if (!isEditMode) return;
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFormData(prev => ({ ...prev, receiptFile: e.target.files[0] }));
        }
    };

    const getHeaderTitle = () => {
        if (!initialData) return 'New Expense';
        return isEditMode ? 'Edit Expense' : 'Transaction Details';
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'var(--background)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            animation: 'fadeInUp 0.3s ease-out'
        }}>
            <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                style={{ display: 'none' }} 
            />

            {/* Header */}
            <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ color: 'var(--text)', margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{getHeaderTitle()}</h2>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <X size={28} />
                </button>
            </div>

            {/* Top Amount Section */}
            <div style={{ padding: '0 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div style={{ flex: 1 }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>AMOUNT</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '3rem', color: 'var(--text)', fontWeight: 500 }}>₹</span>
                        <input 
                            type="number" 
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                            placeholder="0"
                            disabled={!isEditMode}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text)',
                                fontSize: '4.5rem',
                                fontWeight: 'bold',
                                width: '100%',
                                outline: 'none',
                                padding: 0,
                                opacity: isEditMode ? 1 : 0.9 // slight difference for disabled
                            }}
                        />
                    </div>
                </div>
                
                {/* Tools - Only show if editing */}
                {isEditMode && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                        <button 
                            onClick={toggleListening}
                            style={{ 
                                width: '48px', height: '48px', borderRadius: '12px', 
                                backgroundColor: isListening ? 'var(--primary)' : 'var(--input-bg)', 
                                color: isListening ? '#fff' : 'var(--text-secondary)', 
                                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s'
                            }}
                        >
                            {isListening ? <Mic size={24} /> : <MicOff size={24} />}
                        </button>
                        <button 
                            onClick={triggerCamera}
                            style={{ 
                                width: '48px', height: '48px', borderRadius: '12px', 
                                backgroundColor: formData.receiptFile ? 'var(--primary)' : 'var(--input-bg)', 
                                color: formData.receiptFile ? '#fff' : 'var(--text-secondary)', 
                                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Camera size={24} />
                        </button>
                    </div>
                )}
            </div>

            {/* Bottom Card Area */}
            <div className="card" style={{ 
                borderTopLeftRadius: '2rem',
                borderTopRightRadius: '2rem',
                borderBottomLeftRadius: '0',
                borderBottomRightRadius: '0',
                border: 'none',
                borderTop: '1px solid var(--border)',
                flex: 1,
                padding: '2rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem'
            }}>
                {/* What was this for */}
                <div>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '1rem', display: 'block' }}>WHAT WAS THIS FOR?</label>
                    <input 
                        type="text" 
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder={isEditMode ? "e.g. Coffee at Starbucks" : "-"}
                        disabled={!isEditMode}
                        style={{
                            width: '100%',
                            background: 'none',
                            border: 'none',
                            color: 'var(--text)',
                            fontSize: '1.125rem',
                            outline: 'none',
                            padding: 0,
                            opacity: isEditMode ? 1 : 0.9
                        }}
                    />
                </div>

                {/* Category Grid */}
                <div>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        CATEGORY {isEditMode && <span style={{ color: 'var(--primary)', textTransform: 'lowercase', fontWeight: 400 }}>(auto-detecting)</span>}
                    </label>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: '1rem',
                        rowGap: '1.5rem'
                    }}>
                        {CATEGORIES.map(cat => {
                            const isSelected = formData.category === cat.name;
                            // In read-only mode, slightly dim non-selected categories
                            const opacity = !isEditMode && !isSelected ? 0.3 : 1;
                            
                            return (
                                <div 
                                    key={cat.name}
                                    onClick={() => isEditMode && setFormData({...formData, category: cat.name})}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        cursor: isEditMode ? 'pointer' : 'default',
                                        opacity: opacity
                                    }}
                                >
                                    <div style={{
                                        width: '56px', height: '56px', borderRadius: '16px',
                                        backgroundColor: isSelected ? 'rgba(255, 102, 0, 0.1)' : 'transparent',
                                        color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                                        border: isSelected ? '2px solid var(--primary)' : 'none',
                                        boxShadow: isSelected ? '0 0 15px rgba(255, 102, 0, 0.2)' : 'none',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all 0.2s'
                                    }}>
                                        {cat.icon}
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: isSelected ? 'var(--primary)' : 'var(--text-secondary)', textAlign: 'center' }}>
                                        {cat.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Wallet Options */}
                <div>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '1rem', display: 'block' }}>WALLET</label>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {WALLETS.map(w => {
                            const isSelected = formData.wallet === w;
                            if (!isEditMode && !isSelected) return null; // In read-only, hide unselected wallets to save space
                            
                            return (
                                <button
                                    key={w}
                                    type="button"
                                    onClick={() => isEditMode && setFormData({...formData, wallet: w})}
                                    style={{
                                        background: isSelected ? 'var(--primary)' : 'var(--input-bg)',
                                        color: isSelected ? '#fff' : 'var(--text-secondary)',
                                        border: isSelected ? '2px solid var(--primary)' : '2px solid transparent',
                                        boxShadow: isSelected ? '0 0 15px rgba(255, 102, 0, 0.3)' : 'none',
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '12px',
                                        fontWeight: 600,
                                        cursor: isEditMode ? 'pointer' : 'default',
                                        fontSize: '1rem',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {w}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Date */}
                <div>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '1rem', display: 'block' }}>DATE</label>
                    <input 
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        disabled={!isEditMode}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text)',
                            fontSize: '1.125rem',
                            outline: 'none',
                            padding: 0,
                            fontFamily: 'inherit',
                            cursor: isEditMode ? 'pointer' : 'default',
                            opacity: isEditMode ? 1 : 0.9
                        }}
                    />
                </div>

                {/* Notes */}
                {(formData.notes || isEditMode) && ( // Hide notes field entirely in read-only if it's empty
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '1rem', display: 'block' }}>NOTES (OPTIONAL)</label>
                        <textarea 
                            rows="2"
                            value={formData.notes}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            placeholder={isEditMode ? "Any extra details..." : "-"}
                            disabled={!isEditMode}
                            style={{
                                width: '100%',
                                background: 'none',
                                border: 'none',
                                color: 'var(--text)',
                                fontSize: '1.125rem',
                                outline: 'none',
                                padding: 0,
                                resize: 'none',
                                fontFamily: 'inherit',
                                opacity: isEditMode ? 1 : 0.9
                            }}
                        />
                    </div>
                )}

                {/* Spacer to push button to bottom if on very tall screen */}
                <div style={{ flex: 1 }}></div>

                {/* Bottom Action Button */}
                {!isEditMode ? (
                    <button 
                        onClick={() => setIsEditMode(true)} 
                        className="btn-primary"
                        style={{
                            width: '100%',
                            padding: '1.25rem',
                            fontSize: '1.125rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer',
                            marginBottom: '1rem'
                        }}
                    >
                        <Edit2 size={20} />
                        Edit Transaction
                    </button>
                ) : (
                    <button 
                        onClick={handleSubmit} 
                        disabled={!formData.amount}
                        className="btn-primary"
                        style={{
                            width: '100%',
                            padding: '1.25rem',
                            fontSize: '1.125rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            cursor: formData.amount ? 'pointer' : 'not-allowed',
                            opacity: formData.amount ? 1 : 0.5,
                            marginBottom: '1rem'
                        }}
                    >
                        <CheckSquare size={20} />
                        {initialData ? 'Update Expense' : 'Save Expense'}
                    </button>
                )}

            </div>
        </div>
    );
}
