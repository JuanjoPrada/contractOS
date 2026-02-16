import { ContractService } from '@/lib/services/contractService'
import styles from '@/app/page.module.css'
import { Calendar, Bell, AlertTriangle, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function RemindersPage() {
    // Simulación de extracción de obligaciones 
    const allContracts = await ContractService.getContracts()
    const contracts = allContracts.filter(c => ['EXECUTED', 'FINALIZED'].includes(c.status))


    const reminders = contracts.map(c => ({
        id: c.id,
        title: c.title,
        dueDate: new Date(Date.now() + Math.random() * 1000000000).toLocaleDateString('es-ES'),
        obligation: 'Revisión de cláusula de renovación automática',
        priority: Math.random() > 0.5 ? 'HIGH' : 'MEDIUM'
    }))

    return (
        <main className="main-content">
            <header className="page-header">
                <div>
                    <h1>Gestión de Obligaciones</h1>
                    <p>Seguimiento de hitos y vencimientos contractuales [CLM Stage 6]</p>
                </div>
                <div className="badge badge-primary">
                    <Bell size={14} /> 3 Alertas activas
                </div>
            </header>

            <div className="card" style={{ padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-default)' }}>
                        <tr>
                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)' }}>CONTRATO</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)' }}>OBLIGACIÓN / HITO</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)' }}>FECHA LÍMITE</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)' }}>PRIORIDAD</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reminders.map((r) => (
                            <tr key={r.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                                <td style={{ padding: '16px', fontWeight: 600 }}>{r.title}</td>
                                <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{r.obligation}</td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Clock size={14} className="text-muted" />
                                        {r.dueDate}
                                    </div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <span className={`badge ${r.priority === 'HIGH' ? 'badge-rejected' : 'badge-review'}`}>
                                        {r.priority === 'HIGH' ? <AlertTriangle size={12} /> : null}
                                        {r.priority}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <section style={{ marginTop: '40px' }}>
                <h2 className="section-title">Calendario de Hitos</h2>
                <div className="empty-state">
                    <Calendar size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <p>Integración con Google Calendar / Outlook disponible en la versión Enterprise.</p>
                </div>
            </section>
        </main>
    )
}
