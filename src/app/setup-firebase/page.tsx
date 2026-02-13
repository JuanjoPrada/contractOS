'use client'

import React, { useState } from 'react'
import { saveFirebaseConfig } from '@/app/actions'
import { Check, Flame, Key, ShieldCheck, AlertCircle } from 'lucide-react'

export default function SetupFirebasePage() {
    const [webConfig, setWebConfig] = useState('')
    const [serviceAccount, setServiceAccount] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [error, setError] = useState('')

    const handleSetup = async () => {
        setStatus('loading')
        try {
            // Extracción mágica del objeto config
            const jsonMatch = webConfig.match(/\{[\s\S]*\}/)
            const configObj = jsonMatch ? JSON.parse(jsonMatch[0].replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":').replace(/'/g, '"')) : {}

            const saObj = JSON.parse(serviceAccount)

            const result = await saveFirebaseConfig(configObj, saObj)
            if (result.success) {
                setStatus('success')
            } else {
                setStatus('error')
                setError(result.error || 'Error desconocido')
            }
        } catch (e: any) {
            setStatus('error')
            setError('Formato inválido: Asegúrate de pegar los JSON correctamente.')
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px'
        }}>
            <div className="card" style={{ maxWidth: '800px', width: '100%', padding: '40px' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: '#fff7ed',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        color: '#ea580c',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                        <Flame size={32} />
                    </div>
                    <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>Bienvenido a la Configuración Enterprise</h1>
                    <p style={{ color: '#64748b', fontSize: '16px' }}>Conecta ContractOS con tu infraestructura de Firebase</p>
                </div>

                {status === 'success' ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <div style={{ color: '#059669', marginBottom: '20px' }}>
                            <ShieldCheck size={64} style={{ margin: '0 auto' }} />
                        </div>
                        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1e293b' }}>¡Entorno Configurado!</h2>
                        <p style={{ color: '#64748b', margin: '16px 0 24px' }}>
                            El archivo `.env.local` ha sido generado. Reinicia el servidor para aplicar los cambios.
                        </p>
                        <button onClick={() => window.location.href = '/'} className="btn">Ir al Dashboard</button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '24px' }}>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, marginBottom: '8px', color: '#334155' }}>
                                <Key size={16} /> 1. Firebase Web Config
                            </label>
                            <textarea
                                placeholder="Pega aquí el objeto firebaseConfig de la consola..."
                                value={webConfig}
                                onChange={(e) => setWebConfig(e.target.value)}
                                style={{
                                    width: '100%',
                                    height: '120px',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    fontFamily: 'monospace',
                                    fontSize: '13px'
                                }}
                            />
                            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                                Encuéntralo en Project Settings {' > '} General {' > '} Web Apps.
                            </p>
                        </div>

                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, marginBottom: '8px', color: '#334155' }}>
                                <ShieldCheck size={16} /> 2. Service Account JSON
                            </label>
                            <textarea
                                placeholder='{"type": "service_account", ...}'
                                value={serviceAccount}
                                onChange={(e) => setServiceAccount(e.target.value)}
                                style={{
                                    width: '100%',
                                    height: '120px',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    fontFamily: 'monospace',
                                    fontSize: '13px'
                                }}
                            />
                            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                                Genéralo en Project Settings {' > '} Service accounts {' > '} Generate new private key.
                            </p>
                        </div>

                        {status === 'error' && (
                            <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', color: '#b91c1c', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <AlertCircle size={18} />
                                <span style={{ fontSize: '14px' }}>{error}</span>
                            </div>
                        )}

                        <button
                            className="btn"
                            style={{ padding: '16px', fontSize: '16px' }}
                            onClick={handleSetup}
                            disabled={status === 'loading'}
                        >
                            {status === 'loading' ? 'Configurando...' : 'Finalizar Configuración Enterprise'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
