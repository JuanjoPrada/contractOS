'use client'

import React, { useState } from 'react'
import SignaturePanel from './SignaturePanel'
import { signContract } from '@/app/actions'

interface ClientSignatureSectionProps {
    contractId: string
    status: string
}

export default function ClientSignatureSection({ contractId, status }: ClientSignatureSectionProps) {
    const [showSignature, setShowSignature] = useState(false)
    const [isSigning, setIsSigning] = useState(false)

    if (status === 'EXECUTED') {
        return (
            <div style={{
                padding: '12px 20px',
                background: '#ecfdf5',
                color: '#059669',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 600,
                marginBottom: '20px'
            }}>
                ✅ Contrato firmado y ejecutado legalmente
            </div>
        )
    }

    if (status !== 'FINALIZED') return null

    return (
        <>
            <div style={{ marginBottom: '20px', display: 'flex', gap: '12px' }}>
                {!showSignature && (
                    <button
                        onClick={() => setShowSignature(true)}
                        className="btn"
                        style={{ background: '#059669', color: 'white' }}
                    >
                        ✍️ Firmar Contrato
                    </button>
                )}
            </div>

            {showSignature && (
                <div style={{ marginBottom: '40px' }}>
                    <SignaturePanel
                        onSign={async (data) => {
                            setIsSigning(true)
                            try {
                                await signContract(contractId, data)
                                setShowSignature(false)
                            } catch (error) {
                                console.error('Error signing contract:', error)
                            } finally {
                                setIsSigning(false)
                            }
                        }}
                        onCancel={() => setShowSignature(false)}
                        isSubmitting={isSigning}
                    />
                </div>
            )}
        </>
    )
}
