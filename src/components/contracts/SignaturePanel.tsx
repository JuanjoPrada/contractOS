'use client'

import React, { useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Check, X, RefreshCw, Lock } from 'lucide-react'

interface SignaturePanelProps {
    onSign: (signatureDataUrl: string) => void
    onCancel: () => void
    isSubmitting?: boolean
}

export default function SignaturePanel({ onSign, onCancel, isSubmitting }: SignaturePanelProps) {
    const sigPad = useRef<SignatureCanvas>(null)
    const [isEmpty, setIsEmpty] = useState(true)

    const clear = () => {
        sigPad.current?.clear()
        setIsEmpty(true)
    }

    const handleEnd = () => {
        setIsEmpty(false)
    }

    const save = () => {
        if (sigPad.current && !sigPad.current.isEmpty()) {
            onSign(sigPad.current.getTrimmedCanvas().toDataURL('image/png'))
        }
    }

    return (
        <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e2e8f0',
            maxWidth: '500px',
            width: '100%',
            margin: '20px auto'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#1e293b' }}>
                <Lock size={18} className="text-blue-600" />
                <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Firma Electrónica Segura</h3>
            </div>

            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
                Por favor, firme dentro del cuadro para validar este contrato. Esta firma quedará vinculada al registro criptográfico del documento.
            </p>

            <div style={{
                border: '2px dashed #cbd5e1',
                borderRadius: '8px',
                background: '#f8fafc',
                marginBottom: '16px',
                overflow: 'hidden'
            }}>
                <SignatureCanvas
                    ref={sigPad}
                    penColor="#0f172a"
                    canvasProps={{
                        width: 450,
                        height: 200,
                        className: 'sigCanvas'
                    }}
                    onEnd={handleEnd}
                />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <button
                    onClick={clear}
                    className="btn btn-secondary"
                    style={{ flex: 1, gap: '6px' }}
                    disabled={isSubmitting}
                >
                    <RefreshCw size={16} /> Limpiar
                </button>

                <div style={{ display: 'flex', gap: '12px', flex: 2 }}>
                    <button
                        onClick={onCancel}
                        className="btn btn-secondary"
                        style={{ flex: 1, backgroundColor: '#fef2f2', color: '#ef4444', borderColor: '#fee2e2' }}
                        disabled={isSubmitting}
                    >
                        <X size={16} /> Cancelar
                    </button>

                    <button
                        onClick={save}
                        className="btn"
                        style={{ flex: 1, gap: '6px' }}
                        disabled={isEmpty || isSubmitting}
                    >
                        {isSubmitting ? 'Procesando...' : <><Check size={16} /> Firmar Contrato</>}
                    </button>
                </div>
            </div>
        </div>
    )
}
