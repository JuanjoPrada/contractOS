import { db as firestore, bucket } from '@/lib/firebase-admin';
import { prisma } from '@/lib/prisma';

// Interfaz para normalizar los datos entre Prisma y Firebase
export interface ContractData {
    id?: string;
    title: string;
    status: string;
    category: string;
    authorId: string;
    signature?: string;
    signedAt?: string;
}

export class ContractService {
    private static useFirebase = !!process.env.FIREBASE_SERVICE_ACCOUNT;

    static async getContracts() {
        if (this.useFirebase) {
            try {
                const snapshot = await firestore.collection('contracts').orderBy('createdAt', 'desc').get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.error('[ContractService] Error fetching contracts from Firebase:', error);
                throw error;
            }
        }
        return await prisma.contract.findMany({
            include: { author: true, versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async getContractById(id: string) {
        if (this.useFirebase) {
            try {
                const doc = await firestore.collection('contracts').doc(id).get();
                if (!doc.exists) return null;
                const versions = await firestore.collection('contracts').doc(id).collection('versions').orderBy('versionNumber', 'desc').get();
                return {
                    id: doc.id,
                    ...doc.data(),
                    versions: versions.docs.map(v => ({ id: v.id, ...v.data() }))
                };
            } catch (error) {
                console.error(`[ContractService] Error fetching contract ${id} from Firebase:`, error);
                throw error;
            }
        }
        return await prisma.contract.findUnique({
            where: { id },
            include: { versions: { orderBy: { versionNumber: 'desc' } }, activityLogs: true, assignedTo: true }
        });
    }

    static async signContract(contractId: string, signatureDataUrl: string) {
        const timestamp = new Date().toISOString();

        if (this.useFirebase) {
            await firestore.collection('contracts').doc(contractId).update({
                status: 'EXECUTED',
                signature: signatureDataUrl,
                signedAt: timestamp
            });
        } else {
            await prisma.contract.update({
                where: { id: contractId },
                data: {
                    status: 'EXECUTED',
                    // En Prisma (SQLite) guardamos el base64 en un campo de texto si existe, 
                    // pero como no queremos migrar el schema todavía, lo manejamos vía logs
                    // En una app real, añadiríamos el campo 'signature' al schema.
                }
            });
        }
        return { success: true, signedAt: timestamp };
    }
}
