import Link from 'next/link'
import { notFound } from 'next/navigation'
import mammoth from 'mammoth'
import path from 'path'
import fs from 'fs-extra'
import { finalizeContract, updateStatus } from '@/app/actions'
import { EditorWrapper } from '@/components/editor/EditorWrapper'
import ClientSignatureSection from '@/components/contracts/ClientSignatureSection'
import { ContractService } from '@/lib/services/contractService'


async function renderDocx(fileUrl: string) {
    try {
        const absolutePath = path.join(process.cwd(), 'public', fileUrl)
        const buffer = await fs.readFile(absolutePath)
        const result = await mammoth.convertToHtml({ buffer })
        return result.value
    } catch (error) {
        console.error('Error rendering docx:', error)
        return '<p>Error al renderizar el archivo Word.</p>'
    }
}

function getStatusBadge(status: string) {
    const map: Record<string, string> = {
        DRAFT: 'badge badge-draft',
        REVIEW: 'badge badge-review',
        APPROVED: 'badge badge-approved',
        REJECTED: 'badge badge-rejected',
        FINALIZED: 'badge badge-finalized',
    }
    return map[status] || 'badge badge-draft'
}

export default async function ContractPage({ params, searchParams }: any) {
    const { id } = await params
    const { versionId } = await searchParams

    const contract = await ContractService.getContractById(id)

    if (!contract) return notFound()

    // Activity logs are now fetched separately or processed in Service
    const activityLogs = await ContractService.getActivityLogs(id)


    const currentVersion = versionId
        ? contract.versions?.find((v: any) => v.id === versionId)
        : contract.versions?.[0]

    if (!currentVersion) return notFound()

    const isLatest = currentVersion.id === contract.versions?.[0].id


    // Lógica de Renderizado: Preferir contenido editado sobre el archivo original
    let renderedContent = currentVersion.content
    let isEditingRealFile = !!currentVersion.fileUrl

    // Si el contenido está vacío pero hay un archivo, lo renderizamos
    if (!renderedContent && currentVersion.fileUrl) {
        renderedContent = await renderDocx(currentVersion.fileUrl)
    }

    const users = await ContractService.getUsers()


    return (
        <div>
            {/* Breadcrumb */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
                <Link href="/contracts" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>← Volver a contratos</Link>
            </div>

            {/* Header */}
            <div className="page-header">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <h1>{contract.title}</h1>
                        <span className="badge badge-primary">{contract.category}</span>
                        <span className={getStatusBadge(contract.status)}>{contract.status}</span>
                    </div>
                    {!isLatest && (
                        <div style={{
                            background: 'var(--accent-warning-light)',
                            color: 'var(--accent-warning)',
                            padding: 'var(--space-2) var(--space-4)',
                            borderRadius: 'var(--radius-md)',
                            marginTop: 'var(--space-3)',
                            fontSize: 'var(--text-sm)',
                            display: 'inline-block'
                        }}>
                            👀 Viendo versión antigua (v{currentVersion.versionNumber}) —
                            <Link href={`/ contracts / ${id} `} style={{ fontWeight: 'bold', marginLeft: 'var(--space-2)' }}>
                                Ir a la última versión
                            </Link>
                        </div>
                    )}
                </div>
                <div className="page-header-actions">
                    {isLatest && contract.status !== 'FINALIZED' && (
                        <>
                            {contract.status === 'APPROVED' && (
                                <form action={async () => {
                                    'use server'
                                    const { finalizeContract } = await import('@/app/actions')
                                    await finalizeContract(id)
                                }}>
                                    <button type="submit" className="btn" style={{ background: 'var(--accent-info)' }}>🔒 Finalizar</button>
                                </form>
                            )}
                            <form action={async () => {
                                'use server'
                                const { updateStatus } = await import('@/app/actions')
                                await updateStatus(id, 'APPROVED')
                            }}>
                                <button type="submit" className="btn" style={{ background: 'var(--accent-success)' }}>✅ Aprobar</button>
                            </form>
                            <form action={async () => {
                                'use server'
                                const { updateStatus } = await import('@/app/actions')
                                await updateStatus(id, 'REJECTED')
                            }}>
                                <button type="submit" className="btn btn-danger">❌ Rechazar</button>
                            </form>
                        </>
                    )}
                </div>
            </div>

            {/* Main grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 'var(--space-6)' }}>
                {/* Content */}
                <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--border-default)' }}>
                        <h2 className="section-title" style={{ margin: 0 }}>Versión {currentVersion.versionNumber}</h2>
                        {currentVersion.fileUrl && (
                            <a href={currentVersion.fileUrl} download={currentVersion.fileName || 'contract.docx'} className="btn btn-secondary btn-sm">
                                ⬇️ Descargar ({currentVersion.fileName})
                            </a>
                        )}
                        <ClientSignatureSection contractId={contract.id} status={contract.status} />
                    </div>

                    <EditorWrapper
                        contractId={contract.id}
                        initialContent={renderedContent || ''}
                        isFinalized={contract.status === 'FINALIZED'}
                        isLatest={isLatest}
                    >
                        <div
                            className="contract-content"
                            style={{
                                padding: '30mm 25mm',
                                background: 'white',
                                minHeight: '297mm',
                                width: '210mm',
                                margin: '20px auto',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                border: '1px solid var(--border-default)',
                                color: '#000',
                                fontFamily: "'Times New Roman', serif",
                                fontSize: '11pt',
                                lineHeight: '1.5'
                            }}
                            dangerouslySetInnerHTML={{ __html: renderedContent || '' }}
                        />
                    </EditorWrapper>
                </section>

                {/* Sidebar */}
                <aside style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                    {/* Assignment */}
                    <div className="card">
                        <h3 className="section-title" style={{ fontSize: 'var(--text-sm)' }}>Asignado a</h3>
                        <p style={{ marginBottom: 'var(--space-3)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                            {contract.assignedTo?.name || 'Sin asignar'}
                        </p>
                        {isLatest && (
                            <form action={async (formData) => {
                                'use server'
                                const { assignContract } = await import('@/app/actions')
                                await assignContract(id, formData)
                            }}>
                                <select name="userId" style={{ marginBottom: 'var(--space-2)' }}>
                                    <option value="">Seleccionar...</option>
                                    {users.map((u: any) => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                    ))}
                                </select>
                                <button type="submit" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>Asignar</button>
                            </form>
                        )}
                    </div>

                    {/* Version History */}
                    <div className="card">
                        <h3 className="section-title" style={{ fontSize: 'var(--text-sm)' }}>Historial de Versiones</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                            {contract.versions?.map((version: any) => (

                                <Link
                                    key={version.id}
                                    href={`/ contracts / ${id}?versionId = ${version.id} `}
                                    style={{
                                        display: 'block',
                                        padding: 'var(--space-2) var(--space-3)',
                                        borderRadius: 'var(--radius-sm)',
                                        borderLeft: version.id === currentVersion.id ? '3px solid var(--accent-primary)' : '3px solid transparent',
                                        background: version.id === currentVersion.id ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                                        fontSize: 'var(--text-sm)',
                                        color: version.id === currentVersion.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                        fontWeight: version.id === currentVersion.id ? '600' : '400',
                                    }}
                                >
                                    v{version.versionNumber} — {version.author.name}
                                    <br />
                                    <small style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                                        {version.createdAt.toLocaleString('es-ES')}
                                    </small>
                                </Link>
                            ))}
                        </div>
                        {isLatest && contract.status !== 'FINALIZED' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
                                <Link href={`/ contracts / ${id} /edit`} className="btn btn-sm" style={{ textAlign: 'center' }}>Nueva Versión</Link >
                                {
                                    (contract.versions?.length || 0) > 1 && (
                                        <Link href={`/contracts/${id}/compare`} className="btn btn-secondary btn-sm" style={{ textAlign: 'center' }}>Comparar Cambios</Link>
                                    )
                                }

                            </div >
                        )}
                    </div >

                    {/* Activity Log */}
                    < div className="card" >
                        <h3 className="section-title" style={{ fontSize: 'var(--text-sm)' }}>Actividad</h3>
                        <div style={{ fontSize: 'var(--text-xs)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                            {activityLogs.map((log: any) => (
                                <div key={log.id} style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: 'var(--space-2)' }}>
                                    <span className="badge badge-primary" style={{ fontSize: '10px', marginRight: 'var(--space-2)' }}>{log.action}</span>
                                    <span style={{ color: 'var(--text-secondary)' }}>{log.details}</span>
                                    <br />
                                    <small style={{ color: 'var(--text-muted)' }}>
                                        {new Date(log.createdAt).toLocaleString('es-ES')} · {log.user.name}
                                    </small>
                                </div>
                            ))}
                        </div>

                    </div >

                    {/* Comments */}
                    < div className="card" >
                        <h3 className="section-title" style={{ fontSize: 'var(--text-sm)' }}>
                            Comentarios (v{currentVersion.versionNumber})
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                            {currentVersion.comments?.map((comment: any) => (
                                <div key={comment.id} style={{
                                    background: 'var(--bg-secondary)',
                                    padding: 'var(--space-3)',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: 'var(--text-sm)'
                                }}>
                                    <p style={{ margin: 0, color: 'var(--text-primary)' }}>{comment.content}</p>
                                    <small style={{ color: 'var(--text-muted)' }}>
                                        {comment.author.name} · {comment.createdAt.toLocaleDateString('es-ES')}
                                    </small>
                                </div>
                            ))}
                        </div>
                        {
                            isLatest && (
                                <form action={async (formData) => {
                                    'use server'
                                    const { addComment } = await import('@/app/actions')
                                    await addComment(currentVersion.id, formData.get('content') as string)
                                }} style={{ marginTop: 'var(--space-3)' }}>
                                    <textarea name="content" placeholder="Escribe un comentario..." rows={3} required style={{ marginBottom: 'var(--space-2)' }} />
                                    <button type="submit" className="btn btn-sm" style={{ width: '100%' }}>Enviar Comentario</button>
                                </form>
                            )
                        }
                    </div >
                </aside >
            </div >
        </div >
    )
}
