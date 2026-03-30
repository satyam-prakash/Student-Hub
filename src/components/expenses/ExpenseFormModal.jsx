import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
    X, Mic, MicOff, Camera, Coffee, Car, Receipt, 
    ShoppingBag, Heart, Shield, Plane, Book, Zap, Plus, CheckSquare, Edit2,
    Wallet, CreditCard, Landmark
} from 'lucide-react';

const CATEGORIES = [
    { name: 'Food', icon: Coffee },
    { name: 'Transportation', icon: Car },
    { name: 'Bills', icon: Receipt },
    { name: 'Shopping', icon: ShoppingBag },
    { name: 'Health', icon: Heart },
    { name: 'Entertainment', icon: Shield },
    { name: 'Travel', icon: Plane },
    { name: 'Education', icon: Book },
    { name: 'Utilities', icon: Zap },
    { name: 'Other', icon: Plus }
];

const WALLETS = ['Cash', 'Bank', 'Card', 'UPI'];

const WALLET_ICONS = {
    'Cash': Wallet,
    'Card': CreditCard,
    'Bank': Landmark,
    'UPI': Zap
};

/* ─── wallet pattern learning helpers ─── */
const WALLET_COUNTS_KEY = 'sh_wallet_counts';

function getWalletCounts() {
    try { return JSON.parse(localStorage.getItem(WALLET_COUNTS_KEY) || '{}'); }
    catch { return {}; }
}

function getMostUsedWallet() {
    const counts = getWalletCounts();
    let best = WALLETS[0], bestCount = -1;
    WALLETS.forEach(w => { if ((counts[w] || 0) > bestCount) { best = w; bestCount = counts[w] || 0; } });
    return best;
}

export function recordWalletUse(wallet) {
    const counts = getWalletCounts();
    counts[wallet] = (counts[wallet] || 0) + 1;
    localStorage.setItem(WALLET_COUNTS_KEY, JSON.stringify(counts));
}

export default function ExpenseFormModal({ isOpen, onClose, onSubmit, initialData }) {
    const smartDefault = getMostUsedWallet();

    const [formData, setFormData] = useState({
        amount: '',
        category: CATEGORIES[0].name,
        wallet: smartDefault,
        date: new Date().toISOString().split('T')[0],
        description: '',
        notes: '',
        receiptFile: null
    });
    
    const [isListening, setIsListening] = useState(false);
    const [isEditMode, setIsEditMode] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    
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
            setIsEditMode(false);
        } else {
            // Re-read smart default each time modal opens for a new expense
            setFormData({
                amount: '',
                category: CATEGORIES[0].name,
                wallet: getMostUsedWallet(),
                date: new Date().toISOString().split('T')[0],
                description: '',
                notes: '',
                receiptFile: null
            });
            setIsEditMode(true);
        }
        setIsListening(false);
    }, [initialData, isOpen]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize(); // set initial state
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        // Record wallet usage for smart defaults
        recordWalletUse(formData.wallet);
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

    const modalContent = (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 9999,
            display: 'flex',
            alignItems: isMobile ? 'stretch' : 'center',
            justifyContent: 'center',
            padding: isMobile ? '0' : '1rem',
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <style>{`
                .expense-input:focus {
                    outline: none !important;
                    box-shadow: none !important;
                    border: none !important;
                }
                .expense-text-input {
                    border-radius: 8px !important;
                    padding: 0.75rem 0.75rem !important;
                    background-color: var(--input-bg) !important;
                }
                .expense-text-input:focus {
                    outline: none !important;
                    box-shadow: none !important;
                    border: none !important;
                }
            `}</style>
            <div style={{
                width: '100%',
                flex: isMobile ? 1 : 'unset',
                maxWidth: isMobile ? 'none' : '500px',
                maxHeight: isMobile ? 'none' : '90vh',
                backgroundColor: 'var(--background)',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
                borderRadius: isMobile ? '0' : '1.5rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
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
                <div style={{ padding: isMobile ? '0.75rem 1rem' : '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ color: 'var(--text)', margin: 0, fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 'bold' }}>{getHeaderTitle()}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}>
                        <X size={isMobile ? 24 : 28} />
                    </button>
                </div>

                {/* Top Amount Section */}
                <div style={{ padding: isMobile ? '0 1rem' : '0 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isMobile ? '0.5rem' : '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '0.25rem' }}>AMOUNT</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: isMobile ? '2.5rem' : '3rem', color: 'var(--text)', fontWeight: 500 }}>₹</span>
                            <input 
                                className="expense-input"
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
                                    fontSize: isMobile ? '3rem' : '4.5rem',
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                            <button 
                                onClick={toggleListening}
                                style={{ 
                                    width: isMobile ? '38px' : '48px', height: isMobile ? '38px' : '48px', borderRadius: '12px', 
                                    backgroundColor: isListening ? 'var(--primary)' : 'var(--input-bg)', 
                                    color: isListening ? '#fff' : 'var(--text-secondary)', 
                                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {isListening ? <Mic size={isMobile ? 20 : 24} /> : <MicOff size={isMobile ? 20 : 24} />}
                            </button>
                            <button 
                                onClick={triggerCamera}
                                style={{ 
                                    width: isMobile ? '38px' : '48px', height: isMobile ? '38px' : '48px', borderRadius: '12px', 
                                    backgroundColor: formData.receiptFile ? 'var(--primary)' : 'var(--input-bg)', 
                                    color: formData.receiptFile ? '#fff' : 'var(--text-secondary)', 
                                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Camera size={isMobile ? 20 : 24} />
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
                    padding: isMobile ? '1rem' : '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: isMobile ? '0.75rem' : '1rem'
                }}>
                    {/* What was this for */}
                    <div>
                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '0.25rem', display: 'block' }}>WHAT WAS THIS FOR?</label>
                        <input 
                            className="expense-text-input"
                            type="text" 
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            placeholder={isEditMode ? "e.g. Coffee at Starbucks" : "-"}
                            disabled={!isEditMode}
                            style={{
                                width: '100%',
                                border: 'none',
                                color: 'var(--text)',
                                fontSize: '1rem',
                                outline: 'none',
                                opacity: isEditMode ? 1 : 0.9
                            }}
                        />
                    </div>

                    {/* Category Grid */}
                    <div>
                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            CATEGORY {isEditMode && <span style={{ color: 'var(--primary)', textTransform: 'lowercase', fontWeight: 400 }}>(auto-detecting)</span>}
                        </label>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(5, 1fr)',
                            gap: isMobile ? '0.25rem' : '0.5rem',
                            rowGap: isMobile ? '0.5rem' : '0.75rem'
                        }}>
                            {CATEGORIES.map(cat => {
                                const isSelected = formData.category === cat.name;
                                // In read-only mode, slightly dim non-selected categories
                                const opacity = !isEditMode && !isSelected ? 0.3 : 1;
                                const IconComponent = cat.icon;
                                
                                return (
                                    <div 
                                        key={cat.name}
                                        onClick={() => isEditMode && setFormData({...formData, category: cat.name})}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                            cursor: isEditMode ? 'pointer' : 'default',
                                            opacity: opacity
                                        }}
                                    >
                                        <div style={{
                                            width: isMobile ? '40px' : '56px', height: isMobile ? '40px' : '56px', borderRadius: isMobile ? '12px' : '16px',
                                            backgroundColor: isSelected ? 'rgba(255, 102, 0, 0.1)' : 'transparent',
                                            color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                                            border: isSelected ? '2px solid var(--primary)' : 'none',
                                            boxShadow: isSelected ? '0 0 10px rgba(255, 102, 0, 0.2)' : 'none',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'all 0.2s'
                                        }}>
                                            <IconComponent size={isMobile ? 18 : 24} />
                                        </div>
                                        <span style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', color: isSelected ? 'var(--primary)' : 'var(--text-secondary)', textAlign: 'center' }}>
                                            {cat.name}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Wallet Options */}
                    <div>
                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '0.25rem', display: 'block' }}>Payment Method (Wallet)</label>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {WALLETS.map(w => {
                                const isSelected = formData.wallet === w;
                                if (!isEditMode && !isSelected) return null; // In read-only, hide unselected wallets to save space
                                const IconComp = WALLET_ICONS[w] || Wallet;
                                
                                return (
                                    <button
                                        key={w}
                                        type="button"
                                        onClick={() => isEditMode && setFormData({...formData, wallet: w})}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.4rem',
                                            background: isSelected ? 'var(--primary)' : 'var(--input-bg)',
                                            color: isSelected ? '#fff' : 'var(--text-secondary)',
                                            border: 'none',
                                            padding: isMobile ? '0.4rem 1rem' : '0.6rem 1.25rem',
                                            borderRadius: '9999px',
                                            fontWeight: 500,
                                            cursor: isEditMode ? 'pointer' : 'default',
                                            fontSize: isMobile ? '0.8rem' : '0.9rem',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <IconComp size={16} />
                                        {w}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Date */}
                    <div>
                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '0.25rem', display: 'block' }}>DATE</label>
                        <input 
                            className="expense-text-input"
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                            disabled={!isEditMode}
                            style={{
                                border: 'none',
                                color: 'var(--text)',
                                fontSize: '1rem',
                                outline: 'none',
                                fontFamily: 'inherit',
                                cursor: isEditMode ? 'pointer' : 'default',
                                opacity: isEditMode ? 1 : 0.9
                            }}
                        />
                    </div>

                    {/* Notes */}
                    {(formData.notes || isEditMode) && ( // Hide notes field entirely in read-only if it's empty
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '0.25rem', display: 'block' }}>NOTES</label>
                            <textarea 
                                className="expense-text-input"
                                rows="1"
                                value={formData.notes}
                                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                placeholder={isEditMode ? "Any extra details..." : "-"}
                                disabled={!isEditMode}
                                style={{
                                    width: '100%',
                                    border: 'none',
                                    color: 'var(--text)',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    resize: 'none',
                                    fontFamily: 'inherit',
                                    opacity: isEditMode ? 1 : 0.9
                                }}
                            />
                        </div>
                    )}

                    {/* Bottom Action Button */}
                    {!isEditMode ? (
                        <button 
                            onClick={() => setIsEditMode(true)} 
                            className="btn-primary"
                            style={{
                                width: '100%',
                                padding: isMobile ? '0.75rem' : '1rem',
                                fontSize: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                cursor: 'pointer',
                                marginTop: '1rem'
                            }}
                        >
                            <Edit2 size={18} />
                            Edit Transaction
                        </button>
                    ) : (
                        <button 
                            onClick={handleSubmit} 
                            disabled={!formData.amount}
                            className="btn-primary"
                            style={{
                                width: '100%',
                                padding: isMobile ? '0.75rem' : '1rem',
                                fontSize: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                cursor: formData.amount ? 'pointer' : 'not-allowed',
                                opacity: formData.amount ? 1 : 0.5,
                                marginTop: '1rem'
                            }}
                        >
                            <CheckSquare size={18} />
                            {initialData ? 'Update Expense' : 'Save Expense'}
                        </button>
                    )}

                </div>
            </div>
        </div>
    );

    if (typeof document !== 'undefined') {
        return createPortal(modalContent, document.body);
    }
    return modalContent;
}
