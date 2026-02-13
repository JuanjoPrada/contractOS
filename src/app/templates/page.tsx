import { prisma } from '@/lib/prisma'
import { createTemplate, deleteTemplate } from '../actions'
import Link from 'next/link'

export default async function TemplatesPage() {
    const templates = await prisma.template.findMany({
        orderBy: { createdAt: 'desc' }
    })

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Gestión de Plantillas</h1>
                    <p>Crea y administra las plantillas base para contratos</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-6)' }}>
                {/* New Template Form */}
                <section className="card">
                    <h3 className="section-title">Nueva Plantilla</h3>
                    <form action={createTemplate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                        <div>
                            <label htmlFor="name">Nombre *</label>
                            <input type="text" id="name" name="name" required placeholder="Ej: Contrato de servicios" />
                        </div>
                        <div>
                            <label htmlFor="description">Descripción</label>
                            <input type="text" id="description" name="description" placeholder="Breve descripción de la plantilla" />
                        </div>
                        <div>
                            <label htmlFor="content">Contenido Base</label>
                            <textarea
                                id="content"
                                name="content"
                                rows={10}
                                placeholder="Usa variables como {{TITULO}}, {{FECHA}}, {{AUTOR}}, {{CATEGORIA}}"
                                style={{ fontFamily: 'monospace' }}
                            />
                        </div>
                        <div style={{
                            padding: 'var(--space-4)',
                            border: '2px dashed var(--border-default)',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--bg-secondary)'
                        }}>
                            <label htmlFor="file" style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>📎 O adjunta un archivo .docx</label>
                            <input type="file" id="file" name="file" accept=".docx,.doc" style={{ marginTop: 'var(--space-2)' }} />
                        </div>
                        <button type="submit" className="btn">Guardar Plantilla</button>
                    </form>
                </section>

                {/* Existing Templates */}
                <section>
                    <h3 className="section-title">Plantillas Existentes</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        {templates.length === 0 && (
                            <div className="empty-state">
                                <p>No hay plantillas guardadas.</p>
                                <p style={{ fontSize: 'var(--text-sm)' }}>Crea tu primera plantilla usando el formulario.</p>
                            </div>
                        )}
                        {templates.map((template: any) => (
                            <div key={template.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: '600' }}>{template.name}</h4>
                                    <p style={{ margin: 'var(--space-1) 0', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                        {template.description || 'Sin descripción'}
                                    </p>
                                    {template.fileUrl && (
                                        <span className="badge badge-primary" style={{ fontSize: '10px' }}>📎 Archivo adjunto</span>
                                    )}
                                </div>
                                <form action={async () => {
                                    'use server'
                                    await deleteTemplate(template.id)
                                }}>
                                    <button type="submit" className="btn btn-danger btn-sm">Eliminar</button>
                                </form>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    )
}
