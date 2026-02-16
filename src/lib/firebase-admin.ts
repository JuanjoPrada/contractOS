import * as admin from 'firebase-admin';

function getAdminApp() {
    if (admin.apps.length > 0) return admin.apps[0]!;

    console.log('[Firebase Admin] Initializing Firebase Admin...');

    const saRaw = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (saRaw) {
        try {
            // Limpiar comillas si el loader de env no lo hizo
            const saClean = saRaw.startsWith("'") && saRaw.endsWith("'") ? saRaw.slice(1, -1) : saRaw;
            const serviceAccount = JSON.parse(saClean);

            // Asegurarse de que las nuevas líneas en la clave privada sean reales
            if (serviceAccount.private_key) {
                serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
            }

            return admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.firebasestorage.app`
            });
        } catch (error) {
            console.error('[Firebase Admin] Error parsing service account:', error);
        }
    }

    console.warn('[Firebase Admin] No service account found. Using demo mode.');
    return admin.initializeApp({
        projectId: 'contract-os-demo'
    });
}

export const getDb = () => {
    const app = getAdminApp();
    return admin.firestore(app);
};

export const getBucket = () => {
    const app = getAdminApp();
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com` || 'contract-os-demo.appspot.com';
    return admin.storage(app).bucket(bucketName);
};

export const getAuth = () => {
    const app = getAdminApp();
    return admin.auth(app);
};

export const db = getDb();
export const bucket = getBucket();
export const auth = getAuth();
export const firestore = db;
