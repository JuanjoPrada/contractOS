'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import path from 'path'
import fs from 'fs-extra'
import {
    createContractSchema,
    createVersionSchema,
    addCommentSchema,
    createTemplateSchema,
    parseFormData
} from '@/lib/validators'

async function getOrCreateUser() {
    let user = await prisma.user.findUnique({
        where: { email: 'admin@example.com' }
    })

    if (!user) {
        user = await prisma.user.create({
            data: {
                email: 'admin@example.com',
                name: 'Admin User',
                role: 'ADMIN'
            }
        })
    }
    return user
}

async function saveFile(file: File): Promise<{ url: string; name: string }> {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const fileName = `${Date.now()}-${file.name}`
    const relativePath = path.join('uploads', fileName)
    const absolutePath = path.join(process.cwd(), 'public', relativePath)

    await fs.ensureDir(path.dirname(absolutePath))
    await fs.writeFile(absolutePath, buffer)

    return {
        url: `/${relativePath.replace(/\\/g, '/')}`,
        name: file.name
    }
}

async function logActivity(contractId: string, action: string, details: string) {
    const user = await getOrCreateUser()
    await prisma.activityLog.create({
        data: {
            contractId,
            action,
            details,
            userId: user.id
        }
    })
}

export async function createContract(formData: FormData) {
    const data = parseFormData(createContractSchema, formData)
    const file = formData.get('file') as File | null

    const user = await getOrCreateUser()
    let fileInfo = null
    let initialContent = data.content || ''

    // If a template is selected and no file is uploaded, pull content from template
    if (data.templateId && (!file || file.size === 0)) {
        const template = await prisma.template.findUnique({ where: { id: data.templateId } })
        if (template) {
            initialContent = template.content || ''
            if (template.fileUrl) {
                fileInfo = { url: template.fileUrl, name: `Plantilla: ${template.name}` }
            }
        }
    }

    // Variable injection (simple replacement)
    const replacements: Record<string, string> = {
        '{{TITULO}}': data.title,
        '{{FECHA}}': new Date().toLocaleDateString('es-ES'),
        '{{AUTOR}}': user.name || 'Admin',
        '{{CATEGORIA}}': data.category || 'General'
    }

    Object.entries(replacements).forEach(([key, value]) => {
        initialContent = initialContent.split(key).join(value)
    })

    if (file && file.size > 0) {
        fileInfo = await saveFile(file)
    }

    const contract = await prisma.contract.create({
        data: {
            title: data.title,
            status: 'DRAFT',
            category: data.category || 'General',
            authorId: user.id,
            versions: {
                create: {
                    content: initialContent,
                    versionNumber: 1,
                    authorId: user.id,
                    fileUrl: fileInfo?.url,
                    fileName: fileInfo?.name
                }
            }
        }
    })

    await logActivity(contract.id, 'CREATED', `Contrato creado bajo la categoría ${data.category}`)

    revalidatePath('/')
    redirect(`/contracts/${contract.id}`)
}

export async function createNewVersion(id: string, formData: FormData) {
    const data = parseFormData(createVersionSchema, formData)
    const file = formData.get('file') as File | null

    if (!id) throw new Error('Contract ID is required')

    const user = await getOrCreateUser()
    const contract = await prisma.contract.findUnique({
        where: { id },
        include: { versions: true }
    })

    if (!contract) throw new Error('Contract not found')
    if (contract.status === 'FINALIZED') throw new Error('Cannot add versions to a finalized contract')

    let fileInfo = null
    if (file && file.size > 0) {
        fileInfo = await saveFile(file)
    }

    const nextVersionNumber = contract.versions.length + 1

    await prisma.contractVersion.create({
        data: {
            contractId: id,
            content: data.content,
            versionNumber: nextVersionNumber,
            authorId: user.id,
            fileUrl: fileInfo?.url,
            fileName: fileInfo?.name
        }
    })

    await prisma.contract.update({
        where: { id },
        data: { status: 'REVIEW' }
    })

    await logActivity(id, 'ADDED_VERSION', `Nueva versión v${nextVersionNumber} añadida`)

    revalidatePath(`/contracts/${id}`)
    redirect(`/contracts/${id}`)
}

export async function addComment(versionId: string, content: string) {
    const data = addCommentSchema.parse({ content })
    const user = await getOrCreateUser()

    const comment = await prisma.comment.create({
        data: {
            content: data.content,
            versionId,
            authorId: user.id
        },
        include: { version: true }
    })

    await logActivity(comment.version.contractId, 'COMMENTED', `Comentario añadido a la v${comment.version.versionNumber}`)

    revalidatePath('/contracts/[id]')
}

export async function assignContract(contractId: string, formData: FormData) {
    const userId = formData.get('userId') as string

    const updatedContract = await prisma.contract.update({
        where: { id: contractId },
        data: { assignedToId: userId },
        include: { assignedTo: true }
    })

    await logActivity(contractId, 'ASSIGNED', `Contrato asignado a ${updatedContract.assignedTo?.name || 'desconocido'}`)

    revalidatePath(`/contracts/${contractId}`)
}

export async function updateStatus(contractId: string, status: string) {
    await prisma.contract.update({
        where: { id: contractId },
        data: { status }
    })

    await logActivity(contractId, 'UPDATED_STATUS', `Estado actualizado a ${status}`)

    revalidatePath(`/contracts/${contractId}`)
}

export async function finalizeContract(contractId: string) {
    await prisma.contract.update({
        where: { id: contractId },
        data: { status: 'FINALIZED' }
    })

    await logActivity(contractId, 'FINALIZED', 'Contrato finalizado y bloqueado para ediciones')

    revalidatePath(`/contracts/${contractId}`)
}

export async function createTemplate(formData: FormData) {
    const data = parseFormData(createTemplateSchema, formData)
    const file = formData.get('file') as File | null

    let fileUrl = null
    if (file && file.size > 0) {
        const fileInfo = await saveFile(file)
        fileUrl = fileInfo.url
    }

    await prisma.template.create({
        data: {
            name: data.name,
            description: data.description,
            content: data.content,
            fileUrl
        }
    })
    revalidatePath('/templates')
}

export async function getTemplates() {
    return await prisma.template.findMany({
        orderBy: { createdAt: 'desc' }
    })
}

export async function deleteTemplate(id: string) {
    await prisma.template.delete({
        where: { id }
    })
    revalidatePath('/templates')
}

export async function updateContractContent(id: string, content: string) {
    if (!id) throw new Error('Contract ID is required')

    const user = await getOrCreateUser()
    const contract = await prisma.contract.findUnique({
        where: { id },
        include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } }
    })

    if (!contract) throw new Error('Contract not found')
    if (contract.status === 'FINALIZED') throw new Error('Cannot edit a finalized contract')

    const currentVersion = contract.versions[0]

    await prisma.contractVersion.update({
        where: { id: currentVersion.id },
        data: { content }
    })

    await logActivity(id, 'EDITED', `Contenido actualizado desde el editor web`)

    revalidatePath(`/contracts/${id}`)
}

export async function signContract(contractId: string, signatureDataUrl: string) {
    const user = await getOrCreateUser()

    // Simulación de validación de integridad (Hash)
    const integrityHash = Buffer.from(`${contractId}-${Date.now()}`).toString('hex')

    await prisma.contract.update({
        where: { id: contractId },
        data: { status: 'EXECUTED' } // Actualizamos a EXECUTED según estándar CLM
    })

    await logActivity(contractId, 'EXECUTED', `Contrato firmado digitalmente. Certificado de integridad: ${integrityHash}`)

    revalidatePath(`/contracts/${contractId}`)
    return { success: true, hash: integrityHash }
}

export async function saveFirebaseConfig(webConfig: any, serviceAccount: any) {
    try {
        const envContent = `
# Firebase Client (Público)
NEXT_PUBLIC_FIREBASE_API_KEY=${webConfig.apiKey || ''}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${webConfig.authDomain || ''}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${webConfig.projectId || ''}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${webConfig.storageBucket || ''}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${webConfig.messagingSenderId || ''}
NEXT_PUBLIC_FIREBASE_APP_ID=${webConfig.appId || ''}

# Firebase Admin (Servidor)
FIREBASE_SERVICE_ACCOUNT='${JSON.stringify(serviceAccount)}'
`.trim()

        const envPath = path.join(process.cwd(), '.env.local')
        await fs.writeFile(envPath, envContent)

        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
