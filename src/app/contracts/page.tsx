import Link from 'next/link'
import { ContractService } from '@/lib/services/contractService'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'

export default async function ContractsPage({ searchParams }: { searchParams: Promise<{ q?: string, status?: string }> }) {
    const { q, status } = await searchParams

    const allContracts = await ContractService.getContracts()

    // Filtrado manual simple para la lista (en producción esto se haría vía query de Firestore)
    const contracts = allContracts.filter((c: any) => {
        const matchesQuery = q ? (c.title?.toLowerCase().includes(q.toLowerCase()) || c.category?.toLowerCase().includes(q.toLowerCase())) : true
        const matchesStatus = status ? c.status === status : true
        return matchesQuery && matchesStatus
    })

    const statusBadgeClass: Record<string, string> = {
        DRAFT: 'badge badge-draft',
        REVIEW: 'badge badge-review',
        APPROVED: 'badge badge-approved',
        REJECTED: 'badge badge-rejected',
        FINALIZED: 'badge badge-finalized',
    }

    return (
        <div className={styles.contractsPage}>
            <div className="page-header">
                <div>
                    <h1>Contratos</h1>
                    <p>{contracts.length} contratos encontrados</p>
                </div>
                <div className="page-header-actions">
                    <Link href="/contracts/new" className="btn">+ Nuevo Contrato</Link>
                </div>
            </div>

            {/* Filter Bar */}
            <form action="/contracts" method="GET" className={styles.filterBar}>
                <input
                    type="text"
                    name="q"
                    placeholder="🔍 Buscar por título o categoría..."
                    defaultValue={q}
                />
                <select name="status" defaultValue={status}>
                    <option value="">Todos los estados</option>
                    <option value="DRAFT">Borrador</option>
                    <option value="REVIEW">En Revisión</option>
                    <option value="APPROVED">Aprobado</option>
                    <option value="REJECTED">Rechazado</option>
                    <option value="FINALIZED">Finalizado</option>
                </select>
                <button type="submit" className="btn btn-secondary">Filtrar</button>
                {(q || status) && (
                    <Link href="/contracts" className="btn btn-sm btn-secondary">✕ Limpiar</Link>
                )}
            </form>

            {/* Contract List */}
            <div className={styles.contractGrid}>
                {contracts.map((contract: any) => (
                    <div key={contract.id} className={styles.contractCard}>
                        <div className={styles.contractInfo}>
                            <div className={styles.contractTitle}>
                                <Link href={`/contracts/${contract.id}`}>{contract.title}</Link>
                                <span className="badge badge-primary">{contract.category}</span>
                            </div>
                            <div className={styles.contractMeta}>
                                <span className={statusBadgeClass[contract.status] || 'badge badge-draft'}>
                                    {contract.status}
                                </span>
                                <span className={styles.versionCount}>
                                    v{contract.versions?.length || 0} versiones
                                </span>
                                <span>·</span>
                                <span>Por {contract.author?.name || 'Desconocido'}</span>

                            </div>
                        </div>
                        <div className={styles.contractRight}>
                            <span className={styles.contractDate}>
                                {contract.updatedAt?.toLocaleDateString?.('es-ES') || 'Fecha no disponible'}
                            </span>

                            <Link href={`/contracts/${contract.id}`} className={styles.contractLink}>
                                Ver Detalles →
                            </Link>
                        </div>
                    </div>
                ))}
                {contracts.length === 0 && (
                    <div className="empty-state">
                        <p>No se encontraron contratos con estos filtros.</p>
                        <Link href="/contracts" className="btn btn-secondary">Ver todos los contratos</Link>
                    </div>
                )}
            </div>
        </div>
    )
}
