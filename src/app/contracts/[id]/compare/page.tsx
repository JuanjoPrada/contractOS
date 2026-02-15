import { ContractService } from '@/lib/services/contractService'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import * as Diff from 'diff'

export default async function ComparePage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ v1: string, v2: string }> }) {
    const { id } = await params
    const { v1, v2 } = await searchParams

    const contract = await ContractService.getContractById(id)

    if (!contract || (contract.versions?.length || 0) < 2) return notFound()


    const version1 = v1
        ? contract.versions?.find((v: any) => v.id === v1)
        : contract.versions?.[1]


    const version2 = v2
        ? contract.versions?.find((v: any) => v.id === v2)
        : contract.versions?.[0]


    if (!version1 || !version2) return <div>Versiones no encontradas</div>

    const diff = Diff.diffLines(version1.content || '', version2.content || '')

    return (
        <div>
            <div style={{ marginBottom: 'var(--space-4)' }}>
                <Link href={`/contracts/${id}`} style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>← Volver al contrato</Link>
            </div>
            <div className="page-header">
                <div>
                    <h1>Comparar Versiones</h1>
                    <p>v{version1.versionNumber} → v{version2.versionNumber}</p>
                </div>
            </div>
            <div className="card" style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', fontSize: 'var(--text-sm)' }}>
                {diff.map((part, index) => {
                    const bg = part.added ? 'var(--accent-success-light)' : part.removed ? 'var(--accent-danger-light)' : 'transparent';
                    const color = part.added ? 'var(--accent-success)' : part.removed ? 'var(--accent-danger)' : 'var(--text-primary)';
                    const prefix = part.added ? '+ ' : part.removed ? '- ' : '  ';
                    return (
                        <div key={index} style={{ backgroundColor: bg, color, padding: '2px var(--space-3)', borderRadius: 'var(--radius-sm)' }}>
                            {prefix}{part.value}
                        </div>
                    )
                })}
            </div>
            <div style={{ marginTop: 'var(--space-6)' }}>
                <Link href={`/contracts/${id}`} className="btn btn-secondary">Volver al Contrato</Link>
            </div>
        </div>
    )
}
