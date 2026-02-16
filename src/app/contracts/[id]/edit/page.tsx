import { ContractService } from '@/lib/services/contractService'

import { createNewVersion } from '@/app/actions'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function EditContractPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const contract = await ContractService.getContractById(id)


    if (!contract) return notFound()

    const currentContent = contract.versions?.[0]?.content || ''

    const versionAction = createNewVersion.bind(null, contract.id)

    return (
        <div>
            <div style={{ marginBottom: 'var(--space-4)' }}>
                <Link href={`/contracts/${id}`} style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>← Volver al contrato</Link>
            </div>

            <div className="page-header">
                <div>
                    <h1>Editar: {contract.title}</h1>
                    <p>Creando nueva versión (v{(contract.versions?.[0]?.versionNumber || 0) + 1})</p>

                </div>
            </div>

            <form action={versionAction} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: '800px' }}>
                <div style={{
                    padding: 'var(--space-5)',
                    border: '2px dashed var(--border-default)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--bg-secondary)'
                }}>
                    <label htmlFor="file" style={{ fontWeight: '600', color: 'var(--text-primary)' }}>📎 Subir nueva versión como Word (.docx)</label>
                    <input type="file" id="file" name="file" accept=".docx,.doc" style={{ marginTop: 'var(--space-2)' }} />
                </div>

                <div>
                    <label htmlFor="content">O edita el contenido actual</label>
                    <textarea
                        name="content"
                        defaultValue={currentContent}
                        rows={20}
                        style={{ fontFamily: 'monospace' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    <button type="submit" className="btn">Guardar Nueva Versión</button>
                    <Link href={`/contracts/${id}`} className="btn btn-secondary">Cancelar</Link>
                </div>
            </form>
        </div>
    )
}
