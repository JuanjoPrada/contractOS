'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { updateContractContent } from '@/app/actions'
import { Edit3 } from 'lucide-react'

const DocumentEditor = dynamic(
    () => import('@/components/editor/DocumentEditor').then(mod => mod.DocumentEditor),
    { ssr: false }
)

interface EditorWrapperProps {
    contractId: string
    initialContent: string
    isFinalized: boolean
    isLatest: boolean
    children: React.ReactNode
}

export function EditorWrapper({
    contractId,
    initialContent,
    isFinalized,
    isLatest,
    children
}: EditorWrapperProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (isEditing) {
        return (
            <DocumentEditor
                initialContent={initialContent}
                onCancel={() => setIsEditing(false)}
                onSave={async (content) => {
                    await updateContractContent(contractId, content)
                    setIsEditing(false)
                }}
            />
        )
    }

    if (!mounted) return <div style={{ position: 'relative' }}>{children}</div>

    return (
        <div style={{ position: 'relative' }}>
            {isLatest && !isFinalized && (
                <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => setIsEditing(true)}
                    style={{
                        position: 'absolute',
                        top: 'var(--space-2)',
                        right: 'var(--space-2)',
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <Edit3 size={16} />
                    Editar Modo Word
                </button>
            )}
            {children}
        </div>
    )
}
