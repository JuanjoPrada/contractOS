import { db as firestore, bucket } from '@/lib/firebase-admin';
import { prisma } from '@/lib/prisma';

// Interfaz para normalizar los datos entre Prisma y Firebase
export interface ContractData {
    id: string;
    title: string;
    status: string;
    category?: string | null;
    authorId: string;
    authorName?: string;
    versionCount?: number;
    signature?: string | null;
    signedAt?: string | null;
    createdAt: Date;
    updatedAt: Date;
    versions?: any[];
    author?: { name: string | null };
    assignedToId?: string | null;
    assignedTo?: { name: string | null; role: string } | null;
    activityLogs?: any[];
}


export interface UserData {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: string;
}

export interface TemplateData {
    id: string;
    name: string;
    description?: string;
    content?: string;
    fileUrl?: string | null;
    createdAt: string;
}


export class ContractService {
    private static useFirebase = true; // Forced true for web deployment


    static async getContracts(): Promise<ContractData[]> {
        if (this.useFirebase) {

            try {
                const snapshot = await firestore.collection('contracts').orderBy('createdAt', 'desc').get();
                return snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        title: data.title || 'Sin título',
                        status: data.status || 'DRAFT',
                        authorId: data.authorId || '',
                        category: data.category || 'General',
                        // Normalización para la UI
                        author: { name: data.authorName || 'Desconocido' },
                        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
                        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
                        // Stub de versiones para evitar crash en lista y evitar N+1 queries
                        versions: new Array(data.versionCount || 1).fill({})
                    } as ContractData;
                });


            } catch (error) {
                console.error('[ContractService] Error fetching contracts from Firebase:', error);
                throw error;
            }
        }

        return (await prisma.contract.findMany({
            include: { author: true, versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
            orderBy: { createdAt: 'desc' }
        })) as unknown as ContractData[];

    }

    static async getContractById(id: string): Promise<ContractData | null> {
        if (this.useFirebase) {

            try {
                const doc = await firestore.collection('contracts').doc(id).get();
                if (!doc.exists) return null;
                const data = doc.data()!;
                const versions = await firestore.collection('contracts').doc(id).collection('versions').orderBy('versionNumber', 'desc').get();
                return {
                    id: doc.id,
                    title: data.title || 'Sin título',
                    status: data.status || 'DRAFT',
                    authorId: data.authorId || '',
                    category: data.category || 'General',
                    ...data,
                    author: { name: data.authorName || 'Desconocido' },
                    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
                    updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
                    versions: versions.docs.map(v => {
                        const vData = v.data();
                        return {
                            id: v.id,
                            ...vData,
                            createdAt: vData.createdAt ? new Date(vData.createdAt) : new Date()
                        };
                    })
                } as ContractData;

            } catch (error) {
                console.error(`[ContractService] Error fetching contract ${id} from Firebase:`, error);
                throw error;
            }
        }

        return (await prisma.contract.findUnique({
            where: { id },
            include: { versions: { orderBy: { versionNumber: 'desc' } }, activityLogs: true, assignedTo: true }
        })) as unknown as ContractData | null;

    }

    static async createContract(data: { title: string; category?: string }, authorId: string, initialVersion: { content: string; fileUrl?: string | null; fileName?: string | null }) {

        // ALWAYS save to Prisma (Primary/Fallback)
        const contract = await prisma.contract.create({
            data: {
                title: data.title,
                status: 'DRAFT',
                category: data.category || 'General',
                authorId: authorId,
                versions: {
                    create: {
                        content: initialVersion.content,
                        versionNumber: 1,
                        authorId: authorId,
                        fileUrl: initialVersion.fileUrl,
                        fileName: initialVersion.fileName
                    }
                }
            },
            include: { versions: true }
        });

        // Sync with Firebase if configured
        if (this.useFirebase) {
            try {
                const author = await prisma.user.findUnique({ where: { id: authorId } });
                const contractRef = firestore.collection('contracts').doc(contract.id);
                await contractRef.set({
                    title: contract.title,
                    status: contract.status,
                    category: contract.category,
                    authorId: contract.authorId,
                    authorName: author?.name || 'Sistema',
                    versionCount: 1,
                    createdAt: contract.createdAt.toISOString(),
                    updatedAt: contract.updatedAt.toISOString()
                });



                const firstVersion = contract.versions[0];
                await contractRef.collection('versions').doc(firstVersion.id).set({
                    content: firstVersion.content,
                    versionNumber: firstVersion.versionNumber,
                    authorId: firstVersion.authorId,
                    fileUrl: firstVersion.fileUrl,
                    fileName: firstVersion.fileName,
                    createdAt: firstVersion.createdAt.toISOString()
                });

                console.log(`[ContractService] Contract ${contract.id} synced with Firebase.`);
            } catch (error) {
                console.error('[ContractService] Error syncing contract to Firebase:', error);
                // We don't throw here to avoid failing since Prisma succeeded, 
                // but in a strict system we might want to.
            }
        }

        return contract;
    }

    static async createVersion(contractId: string, authorId: string, versionData: { content: string; fileUrl?: string | null; fileName?: string | null }) {

        const contract = await prisma.contract.findUnique({
            where: { id: contractId },
            include: { versions: true }
        });

        if (!contract) throw new Error('Contract not found');

        const nextVersionNumber = contract.versions.length + 1;

        const newVersion = await prisma.contractVersion.create({
            data: {
                contractId,
                content: versionData.content,
                versionNumber: nextVersionNumber,
                authorId,
                fileUrl: versionData.fileUrl,
                fileName: versionData.fileName
            }
        });

        await prisma.contract.update({
            where: { id: contractId },
            data: { status: 'REVIEW' }
        });

        if (this.useFirebase) {
            try {
                const contractRef = firestore.collection('contracts').doc(contractId);
                await contractRef.update({
                    status: 'REVIEW',
                    versionCount: nextVersionNumber,
                    updatedAt: new Date().toISOString()
                });


                await contractRef.collection('versions').doc(newVersion.id).set({
                    content: newVersion.content,
                    versionNumber: newVersion.versionNumber,
                    authorId: newVersion.authorId,
                    fileUrl: newVersion.fileUrl,
                    fileName: newVersion.fileName,
                    createdAt: newVersion.createdAt.toISOString()
                });
            } catch (error) {
                console.error('[ContractService] Error syncing version to Firebase:', error);
            }
        }

        return newVersion;
    }

    static async addComment(versionId: string, authorId: string, content: string) {
        const comment = await prisma.comment.create({
            data: {
                content,
                versionId,
                authorId
            },
            include: { version: true }
        });

        if (this.useFirebase) {
            try {
                await firestore
                    .collection('contracts')
                    .doc(comment.version.contractId)
                    .collection('versions')
                    .doc(versionId)
                    .collection('comments')
                    .doc(comment.id)
                    .set({
                        content: comment.content,
                        authorId: comment.authorId,
                        createdAt: comment.createdAt.toISOString()
                    });
            } catch (error) {
                console.error('[ContractService] Error syncing comment to Firebase:', error);
            }
        }

        return comment;
    }

    static async updateStatus(contractId: string, status: string) {
        const contract = await prisma.contract.update({
            where: { id: contractId },
            data: { status }
        });

        if (this.useFirebase) {
            try {
                await firestore.collection('contracts').doc(contractId).update({
                    status,
                    updatedAt: contract.updatedAt.toISOString()
                });
            } catch (error) {
                console.error('[ContractService] Error updating status in Firebase:', error);
            }
        }

        return contract;
    }

    static async assignContract(contractId: string, assignedToId: string) {
        const contract = await prisma.contract.update({
            where: { id: contractId },
            data: { assignedToId },
            include: { assignedTo: true }
        });

        if (this.useFirebase) {
            try {
                await firestore.collection('contracts').doc(contractId).update({
                    assignedToId,
                    updatedAt: contract.updatedAt.toISOString()
                });
            } catch (error) {
                console.error('[ContractService] Error assigning contract in Firebase:', error);
            }
        }

        return contract;
    }

    static async updateContractContent(id: string, content: string) {
        const contract = await prisma.contract.findUnique({
            where: { id },
            include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } }
        });

        if (!contract) throw new Error('Contract not found');
        const currentVersion = contract.versions[0];

        const updatedVersion = await prisma.contractVersion.update({
            where: { id: currentVersion.id },
            data: { content }
        });

        if (this.useFirebase) {
            try {
                const contractRef = firestore.collection('contracts').doc(id);
                await contractRef.update({ updatedAt: new Date().toISOString() });
                await contractRef.collection('versions').doc(currentVersion.id).update({
                    content
                });
            } catch (error) {
                console.error('[ContractService] Error updating content in Firebase:', error);
            }
        }

        return updatedVersion;
    }

    static async signContract(contractId: string, signatureDataUrl: string) {
        const timestamp = new Date().toISOString();

        if (this.useFirebase) {
            await firestore.collection('contracts').doc(contractId).update({
                status: 'EXECUTED',
                signature: signatureDataUrl,
                signedAt: timestamp
            });
        }
        return { success: true, signedAt: timestamp };
    }

    // --- USER METHODS ---
    static async getUsers() {
        const snapshot = await firestore.collection('users').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    static async getUserById(id: string): Promise<UserData | null> {
        const doc = await firestore.collection('users').doc(id).get();
        return doc.exists ? { id: doc.id, ...doc.data() } as UserData : null;
    }

    static async getOrCreateUserByEmail(email: string, name: string = 'Admin User'): Promise<UserData> {
        const snapshot = await firestore.collection('users').where('email', '==', email).limit(1).get();
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() } as UserData;
        }

        const userRef = firestore.collection('users').doc();
        const userData = {
            email,
            name,
            role: 'ADMIN',
            createdAt: new Date().toISOString()
        };
        await userRef.set(userData);
        return { id: userRef.id, ...userData } as UserData;
    }

    // --- TEMPLATE METHODS ---
    static async getTemplates(): Promise<TemplateData[]> {
        const snapshot = await firestore.collection('templates').orderBy('createdAt', 'desc').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TemplateData));
    }

    static async getTemplateById(id: string): Promise<TemplateData | null> {
        const doc = await firestore.collection('templates').doc(id).get();
        return doc.exists ? { id: doc.id, ...doc.data() } as TemplateData : null;
    }


    static async createTemplate(data: { name: string, description?: string, content?: string, fileUrl?: string | null }) {
        const templateRef = firestore.collection('templates').doc();
        const templateData = {
            ...data,
            createdAt: new Date().toISOString()
        };
        await templateRef.set(templateData);
        return { id: templateRef.id, ...templateData };
    }

    static async deleteTemplate(id: string) {
        await firestore.collection('templates').doc(id).delete();
    }

    // --- ACTIVITY LOG METHODS ---
    static async logActivity(contractId: string, userId: string, action: string, details: string) {
        const user = await this.getUserById(userId);
        const logRef = firestore.collection('contracts').doc(contractId).collection('activityLogs').doc();
        await logRef.set({
            action,
            details,
            userId,
            userName: user?.name || 'Sistema', // Denormalize for list views
            createdAt: new Date().toISOString()
        });
    }

    static async getActivityLogs(contractId: string) {
        const snapshot = await firestore
            .collection('contracts')
            .doc(contractId)
            .collection('activityLogs')
            .orderBy('createdAt', 'desc')
            .get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Ensure UI compatibility
            user: { name: doc.data().userName || 'Sistema' }
        }));
    }

    static async getRecentComments(limit: number = 5) {

        try {
            const snapshot = await firestore.collectionGroup('comments').orderBy('createdAt', 'desc').limit(limit).get();
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
                    author: { name: 'Usuario' } // Simplified
                };
            });
        } catch (e) {
            console.warn('[ContractService] Error fetching recent comments:', e);
            return [];
        }
    }
}


