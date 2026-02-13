import { z } from 'zod'

// ===== Contract Schemas =====

export const createContractSchema = z.object({
    title: z.string().min(1, 'El título es obligatorio').max(200, 'El título es demasiado largo'),
    content: z.string().optional().default(''),
    category: z.string().optional().default('General'),
    templateId: z.string().optional(),
})

export const createVersionSchema = z.object({
    content: z.string().optional().default(''),
})

// ===== Template Schemas =====

export const createTemplateSchema = z.object({
    name: z.string().min(1, 'El nombre de la plantilla es obligatorio').max(100),
    description: z.string().optional().default(''),
    content: z.string().optional().default(''),
})

// ===== Comment Schemas =====

export const addCommentSchema = z.object({
    content: z.string().min(1, 'El comentario no puede estar vacío').max(2000),
})

// ===== Status =====

export const contractStatuses = ['DRAFT', 'REVIEW', 'APPROVED', 'REJECTED', 'FINALIZED'] as const
export type ContractStatus = typeof contractStatuses[number]

export const updateStatusSchema = z.object({
    status: z.enum(contractStatuses, { message: 'Estado no válido' }),
})

// ===== Helpers =====

export function parseFormData<T extends z.ZodType>(
    schema: T,
    formData: FormData
): z.infer<T> {
    const obj: Record<string, unknown> = {}
    formData.forEach((value, key) => {
        if (typeof value === 'string') {
            obj[key] = value
        }
    })
    return schema.parse(obj)
}
