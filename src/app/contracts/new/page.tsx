import { createContract, getTemplates } from '../../actions'
import Link from 'next/link'

export default async function NewContractPage() {
    const templates = await getTemplates()

    return (
        <div>
            <div style={{ marginBottom: 'var(--space-4)' }}>
                <Link href="/contracts" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>← Volver a contratos</Link>
            </div>

            <div className="page-header">
                <div>
                    <h1>Nuevo Contrato</h1>
                    <p>Crea un nuevo contrato desde cero o usa una plantilla</p>
                </div>
            </div>

            <form action={createContract} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: '700px' }}>
                <div>
                    <label htmlFor="title">Título *</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        required
                        placeholder="Ej: Contrato de prestación de servicios"
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div>
                        <label htmlFor="category">Categoría</label>
                        <select id="category" name="category">
                            <option value="General">General</option>
                            <option value="RRHH">RRHH</option>
                            <option value="Legal">Legal</option>
                            <option value="Ventas">Ventas</option>
                            <option value="Proveedores">Proveedores</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="templateId">Plantilla (Opcional)</label>
                        <select name="templateId" id="templateId">
                            <option value="">— Sin plantilla —</option>
                            {templates.map((t: any) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div style={{
                    padding: 'var(--space-5)',
                    border: '2px dashed var(--border-default)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--bg-secondary)'
                }}>
                    <label htmlFor="file" style={{ fontWeight: '600', color: 'var(--text-primary)' }}>📎 Subir archivo Word (.docx)</label>
                    <input type="file" id="file" name="file" accept=".docx,.doc" style={{ marginTop: 'var(--space-2)' }} />
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
                        O escribe el contenido manualmente abajo.
                    </p>
                </div>

                <div>
                    <label htmlFor="content">Contenido Inicial</label>
                    <textarea
                        id="content"
                        name="content"
                        rows={12}
                        placeholder="Escribe el contenido del contrato aquí... Puedes usar variables como {{TITULO}}, {{FECHA}}, {{AUTOR}}"
                        style={{ fontFamily: 'monospace' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    <button type="submit" className="btn">Crear Borrador</button>
                    <Link href="/contracts" className="btn btn-secondary">Cancelar</Link>
                </div>
            </form>
        </div>
    )
}
