'use server'

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
import { ContractService } from '@/lib/services/contractService'
import { bucket } from '@/lib/firebase-admin'



async function getOrCreateUser() {
    return await ContractService.getOrCreateUserByEmail('admin@example.com', 'Admin User');
}


async function saveFile(file: File): Promise<{ url: string; name: string }> {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const fileName = `${Date.now()}-${file.name}`

    // For cloud deployment, use Firebase Storage
    try {
        const fileRef = bucket.file(`uploads/${fileName}`)
        await fileRef.save(buffer, {
            metadata: { contentType: file.type }
        })

        // Make the file publicly accessible or get a signed URL
        // For this demo, we'll use a public-style URL if the bucket is public, 
        // or a simpler format that we can handle in the UI.
        // Firebase Storage format: https://firebasestorage.googleapis.com/v0/b/[BUCKET]/o/[PATH]?alt=media
        const encodedPath = encodeURIComponent(`uploads/${fileName}`)
        const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`

        return {
            url,
            name: file.name
        }
    } catch (error) {
        console.error('[Firebase Storage] Error uploading file:', error)
        // Fallback to local (only works in local dev)
        const relativePath = path.join('uploads', fileName)
        const absolutePath = path.join(process.cwd(), 'public', relativePath)
        await fs.ensureDir(path.dirname(absolutePath))
        await fs.writeFile(absolutePath, buffer)
        return {
            url: `/${relativePath.replace(/\\/g, '/')}`,
            name: file.name
        }
    }
}


async function logActivity(contractId: string, action: string, details: string) {
    const user = await getOrCreateUser()
    await ContractService.logActivity(contractId, user.id, action, details)
}


export async function createContract(formData: FormData) {
    const data = parseFormData(createContractSchema, formData)
    const file = formData.get('file') as File | null

    const user = await getOrCreateUser()
    let fileInfo = null
    let initialContent = data.content || ''

    // If a template is selected and no file is uploaded, pull content from template
    if (data.templateId && (!file || file.size === 0)) {
        const template = await ContractService.getTemplateById(data.templateId)
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

    const contract = await ContractService.createContract(data, user.id, {
        content: initialContent,
        fileUrl: fileInfo?.url,
        fileName: fileInfo?.name
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
    const contract = await ContractService.getContractById(id)

    if (!contract) throw new Error('Contract not found')
    if (contract.status === 'FINALIZED') throw new Error('Cannot add versions to a finalized contract')

    let fileInfo = null
    if (file && file.size > 0) {
        fileInfo = await saveFile(file)
    }

    await ContractService.createVersion(id, user.id, {
        content: data.content,
        fileUrl: fileInfo?.url,
        fileName: fileInfo?.name
    })

    await logActivity(id, 'ADDED_VERSION', `Nueva versión añadida`)

    revalidatePath(`/contracts/${id}`)
    redirect(`/contracts/${id}`)
}


export async function addComment(contractId: string, versionId: string, versionNumber: number, content: string) {
    const data = addCommentSchema.parse({ content })
    const user = await getOrCreateUser()

    // Pass contractId to the service
    const comment = await ContractService.addComment(versionId, user.id, data.content, contractId)

    // Use passed variables for logging instead of trying to access nested properties that don't exist
    await logActivity(contractId, 'COMMENTED', `Comentario añadido a la v${versionNumber}`)

    revalidatePath(`/contracts/${contractId}`)
}

export async function assignContract(contractId: string, formData: FormData) {
    const userId = formData.get('userId') as string

    const updatedContract = await ContractService.assignContract(contractId, userId)
    const assignedUser = await ContractService.getUserById(userId)

    await logActivity(contractId, 'ASSIGNED', `Contrato asignado a ${assignedUser?.name || 'desconocido'}`)

    revalidatePath(`/contracts/${contractId}`)
}


export async function updateStatus(contractId: string, status: string) {
    await ContractService.updateStatus(contractId, status)

    await logActivity(contractId, 'UPDATED_STATUS', `Estado actualizado a ${status}`)

    revalidatePath(`/contracts/${contractId}`)
}


export async function finalizeContract(contractId: string) {
    await ContractService.updateStatus(contractId, 'FINALIZED')

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

    await ContractService.createTemplate({
        name: data.name,
        description: data.description,
        content: data.content,
        fileUrl
    })
    revalidatePath('/templates')
}

export async function getTemplates() {
    return await ContractService.getTemplates()
}

export async function deleteTemplate(id: string) {
    await ContractService.deleteTemplate(id)
    revalidatePath('/templates')
}


export async function updateContractContent(id: string, content: string) {
    if (!id) throw new Error('Contract ID is required')

    await ContractService.updateContractContent(id, content)

    await logActivity(id, 'EDITED', `Contenido actualizado desde el editor web`)

    revalidatePath(`/contracts/${id}`)
}


export async function signContract(contractId: string, signatureDataUrl: string) {
    // Simulación de validación de integridad (Hash)
    const integrityHash = Buffer.from(`${contractId}-${Date.now()}`).toString('hex')

    await ContractService.signContract(contractId, signatureDataUrl)

    await logActivity(contractId, 'EXECUTED', `Contrato firmado digitalmente. Certificado de integridad: ${integrityHash}`)

    revalidatePath(`/contracts/${contractId}`)
    return { success: true, hash: integrityHash }
}


export async function saveFirebaseConfig(webConfig: Record<string, any>, serviceAccount: Record<string, any>) {

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
