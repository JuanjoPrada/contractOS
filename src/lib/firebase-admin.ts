import * as admin from 'firebase-admin';

let _app: admin.app.App | null = null;

function getAdminApp(): admin.app.App {
    if (_app) return _app;
    if (admin.apps.length > 0) {
        _app = admin.apps[0]!;
        return _app;
    }

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

            _app = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.firebasestorage.app`
            });
            return _app;
        } catch (error) {
            console.error('[Firebase Admin] Error parsing service account:', error);
        }
    }

    console.warn('[Firebase Admin] No service account found. Using demo mode.');
    _app = admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'contract-os-demo'
    });
    return _app;
}

// Lazy getters to avoid module-level initialization crashes during build
export const getDb = () => {
    const app = getAdminApp();
    return admin.firestore(app);
};

export const getBucket = () => {
    const app = getAdminApp();
    return admin.storage(app).bucket();
};

export const getAdminAuth = () => {
    const app = getAdminApp();
    return admin.auth(app);
};

// Lazy proxy objects that initialize on first access
let _db: admin.firestore.Firestore | null = null;
let _bucket: ReturnType<typeof admin.storage.prototype.bucket> | null = null;

export const db = new Proxy({} as admin.firestore.Firestore, {
    get(_target, prop) {
        if (!_db) _db = getDb();
        return (_db as any)[prop];
    }
});

export const bucket = new Proxy({} as ReturnType<typeof admin.storage.prototype.bucket>, {
    get(_target, prop) {
        if (!_bucket) _bucket = getBucket();
        return (_bucket as any)[prop];
    }
});

export const firestore = db;
