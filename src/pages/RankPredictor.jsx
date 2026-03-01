import React from 'react';
import DCETCalculator from '../components/DCETCalculator';
import Footer from '../components/Footer';
import './Notes.css';

export default function RankPredictor() {
    return (
        <div className="notes-page-wrapper" style={{ 
            height: 'calc(100vh - 70px)', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center',
            overflow: 'hidden',
            padding: '0 1rem'
        }}>
            <div className="notes-search-center" style={{ padding: '0', marginBottom: '1rem' }}>
                <div className="workspace-selectors search-only-global" style={{ textAlign: 'center', border: 'none', background: 'transparent', backdropFilter: 'none', boxShadow: 'none', marginBottom: '0', padding: '0' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--accent-color)', marginBottom: '0.25rem' }}>
                        D-CET Rank Predictor
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto' }}>
                        Calculate your expected DCET rank based on your Diploma.
                    </p>
                </div>
            </div>

            <div className="container" style={{ maxWidth: '750px', width: '100%', padding: '0' }}>
                <DCETCalculator />
            </div>
        </div>
    );
}
