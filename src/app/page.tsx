import Link from 'next/link'
import { ContractService } from '@/lib/services/contractService'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'

function getStatusBadge(status: string) {
  const map: Record<string, string> = {
    DRAFT: 'badge badge-draft',
    REVIEW: 'badge badge-review',
    APPROVED: 'badge badge-approved',
    REJECTED: 'badge badge-rejected',
    FINALIZED: 'badge badge-finalized',
    EXECUTED: 'badge badge-approved',
  }
  return map[status] || 'badge badge-draft'
}

export default async function Dashboard() {
  // Nota: Simplificamos los counts para demo/firebase. 
  // En una versión más avanzada, ContractService tendría un getStats()
  const recentContracts = await ContractService.getContracts()
  const totalContracts = recentContracts.length
  const draftCount = recentContracts.filter((c: any) => c.status === 'DRAFT').length
  const reviewCount = recentContracts.filter((c: any) => c.status === 'REVIEW').length
  const approvedCount = recentContracts.filter((c: any) => c.status === 'APPROVED').length
  const rejectedCount = recentContracts.filter((c: any) => c.status === 'REJECTED').length
  const finalizedCount = recentContracts.filter((c: any) => c.status === 'FINALIZED').length
  const executedCount = recentContracts.filter((c: any) => c.status === 'EXECUTED').length

  const recentComments = await ContractService.getRecentComments(5)
  const assignedContracts = recentContracts.filter((c: any) => c.status === 'REVIEW').slice(0, 5)

  const dashboardRecent = recentContracts.slice(0, 5)

  return (
    <div className={styles.dashboard}>
      <div className="page-header">
        <div>
          <h1>Panel de Control</h1>
          <p>Visión general de tu actividad contractual</p>
        </div>
        <div className="page-header-actions">
          <Link href="/contracts/new" className="btn">+ Nuevo Contrato</Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className={styles.kpiGrid}>
        <div className={`${styles.kpiCard} ${styles.kpiSuccess}`}>
          <div className={styles.kpiIcon}>✅</div>
          <div className={styles.kpiValue}>{approvedCount}</div>
          <div className={styles.kpiLabel}>Aprobados</div>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiInfo}`}>
          <div className={styles.kpiIcon}>🔒</div>
          <div className={styles.kpiValue}>{finalizedCount}</div>
          <div className={styles.kpiLabel}>Finalizados</div>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiSuccess}`}>
          <div className={styles.kpiIcon}>🖋️</div>
          <div className={styles.kpiValue}>{executedCount}</div>
          <div className={styles.kpiLabel}>Ejecutados</div>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiWarning}`}>
          <div className={styles.kpiIcon}>⏳</div>
          <div className={styles.kpiValue}>{reviewCount}</div>
          <div className={styles.kpiLabel}>En Revisión</div>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiMuted}`}>
          <div className={styles.kpiIcon}>📝</div>
          <div className={styles.kpiValue}>{draftCount}</div>
          <div className={styles.kpiLabel}>Borradores</div>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiDanger}`}>
          <div className={styles.kpiIcon}>❌</div>
          <div className={styles.kpiValue}>{rejectedCount}</div>
          <div className={styles.kpiLabel}>Rechazados</div>
        </div>
      </div>

      {/* Content Grid */}
      <div className={styles.contentGrid}>
        <div>
          {/* Assigned to me */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Asignados a Mí</h2>
              <Link href="/contracts?status=REVIEW" className={styles.sectionLink}>Ver todos →</Link>
            </div>
            {assignedContracts.length === 0 ? (
              <div className="empty-state">
                <p>No tienes contratos pendientes de revisión.</p>
              </div>
            ) : (
              <div className={styles.itemList}>
                {assignedContracts.map((contract: any) => (
                  <div key={contract.id} className={`${styles.miniCard} ${styles.miniCardHighlight}`}>
                    <div>
                      <div className={styles.miniCardTitle}>
                        <Link href={`/contracts/${contract.id}`}>{contract.title}</Link>
                      </div>
                      <div className={styles.miniCardMeta}>
                        <span className="badge badge-primary">{contract.category}</span>
                        <span>·</span>
                        <span>{contract.updatedAt.toLocaleDateString('es-ES')}</span>
                      </div>
                    </div>
                    <span className={getStatusBadge(contract.status)}>{contract.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Contracts */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Contratos Recientes</h2>
              <Link href="/contracts" className={styles.sectionLink}>Ver todos →</Link>
            </div>
            <div className={styles.itemList}>
              {dashboardRecent.map((contract: any) => (
                <div key={contract.id} className={styles.contractCard}>
                  <div>
                    <div className={styles.miniCardTitle}>
                      <Link href={`/contracts/${contract.id}`}>{contract.title}</Link>
                    </div>
                    <div className={styles.miniCardMeta}>
                      <span>Por {contract.author?.name || 'Desconocido'}</span>
                      <span>·</span>
                      <span>{contract.updatedAt?.toLocaleDateString?.('es-ES') || 'Fecha no disponible'}</span>
                    </div>

                  </div>
                  <span className={getStatusBadge(contract.status)}>{contract.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Actividad Reciente</h2>
            </div>
            {recentComments.length === 0 ? (
              <div className="empty-state">
                <p>No hay comentarios recientes.</p>
              </div>
            ) : (
              <div className={styles.itemList}>
                {recentComments.map((comment: any) => (
                  <div key={comment.id} className={styles.activityCard}>
                    <div className={styles.activityAuthor}>
                      <strong>{comment.author.name}</strong> comentó
                    </div>
                    <div className={styles.activityQuote}>"{comment.content}"</div>

                    <div className={styles.activityTime}>
                      {comment.createdAt.toLocaleString('es-ES')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
