import { db as firestore, bucket } from '@/lib/firebase-admin';

// Interfaz para normalizar los datos en Firebase
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
    // Only Firebase remains
    static async getContracts(): Promise<ContractData[]> {
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
                    author: { name: data.authorName || 'Desconocido' },
                    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
                    updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
                    versions: new Array(data.versionCount || 1).fill({})
                } as ContractData;
            });
        } catch (error) {
            console.error('[ContractService] Error fetching contracts from Firebase:', error);
            throw error;
        }
    }

    static async getContractById(id: string): Promise<ContractData | null> {
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

    static async createContract(data: { title: string; category?: string }, authorId: string, initialVersion: { content: string; fileUrl?: string | null; fileName?: string | null }) {
        const user = await this.getUserById(authorId);
        const contractRef = firestore.collection('contracts').doc();
        const timestamp = new Date().toISOString();

        const contractData = {
            title: data.title,
            status: 'DRAFT',
            category: data.category || 'General',
            authorId: authorId,
            authorName: user?.name || 'Sistema',
            versionCount: 1,
            createdAt: timestamp,
            updatedAt: timestamp
        };

        await contractRef.set(contractData);

        const versionId = firestore.collection('placeholder').doc().id; // Guid-like ID
        await contractRef.collection('versions').doc(versionId).set({
            content: initialVersion.content,
            versionNumber: 1,
            authorId: authorId,
            fileUrl: initialVersion.fileUrl,
            fileName: initialVersion.fileName,
            createdAt: timestamp
        });

        return { id: contractRef.id, ...contractData, versions: [{ id: versionId }] };
    }

    static async createVersion(contractId: string, authorId: string, versionData: { content: string; fileUrl?: string | null; fileName?: string | null }) {
        const contractRef = firestore.collection('contracts').doc(contractId);
        const doc = await contractRef.get();
        if (!doc.exists) throw new Error('Contract not found');

        const data = doc.data()!;
        const nextVersionNumber = (data.versionCount || 0) + 1;
        const timestamp = new Date().toISOString();

        await contractRef.update({
            status: 'REVIEW',
            versionCount: nextVersionNumber,
            updatedAt: timestamp
        });

        const versionRef = contractRef.collection('versions').doc();
        await versionRef.set({
            content: versionData.content,
            versionNumber: nextVersionNumber,
            authorId: authorId,
            fileUrl: versionData.fileUrl,
            fileName: versionData.fileName,
            createdAt: timestamp
        });

        return { id: versionRef.id, versionNumber: nextVersionNumber };
    }

    static async addComment(versionId: string, authorId: string, content: string, contractId: string) {
        const commentRef = firestore
            .collection('contracts')
            .doc(contractId)
            .collection('versions')
            .doc(versionId)
            .collection('comments')
            .doc();

        const commentData = {
            content,
            authorId,
            createdAt: new Date().toISOString()
        };

        await commentRef.set(commentData);

        // Also add to global comments collection for "Recent Activity" feed if index exists
        try {
            await firestore.collection('comments').doc(commentRef.id).set({
                ...commentData,
                contractId,
                versionId
            });
        } catch (e) {
            console.warn('[ContractService] Error syncing to global comments:', e);
        }

        return { id: commentRef.id, ...commentData, contractId, versionId };
    }

    static async updateStatus(contractId: string, status: string) {
        const timestamp = new Date().toISOString();
        await firestore.collection('contracts').doc(contractId).update({
            status,
            updatedAt: timestamp
        });
        return { id: contractId, status, updatedAt: timestamp };
    }

    static async assignContract(contractId: string, assignedToId: string) {
        const timestamp = new Date().toISOString();
        await firestore.collection('contracts').doc(contractId).update({
            assignedToId,
            updatedAt: timestamp
        });
        return { id: contractId, assignedToId, updatedAt: timestamp };
    }

    static async updateContractContent(id: string, content: string) {
        // Find latest version
        const versions = await firestore.collection('contracts').doc(id).collection('versions').orderBy('versionNumber', 'desc').limit(1).get();
        if (versions.empty) throw new Error('No versions found');

        const latestVersion = versions.docs[0];
        const timestamp = new Date().toISOString();

        await firestore.collection('contracts').doc(id).update({ updatedAt: timestamp });
        await latestVersion.ref.update({ content });

        return { id: latestVersion.id, content };
    }

    static async signContract(contractId: string, signatureDataUrl: string) {
        const timestamp = new Date().toISOString();
        await firestore.collection('contracts').doc(contractId).update({
            status: 'EXECUTED',
            signature: signatureDataUrl,
            signedAt: timestamp
        });
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
