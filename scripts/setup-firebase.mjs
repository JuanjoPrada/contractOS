import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setup() {
    console.log('\n🔥 Firebase Setup Wizard for ContractOS\n');
    console.log('Esta herramienta configurará automáticamente tu entorno de producción.\n');

    try {
        const webConfigStr = await question('1. Pega aquí el objeto firebaseConfig de tu consola (o el JSON entero): ');

        // Intentar extraer los campos si es un objeto JS o JSON
        let config = {};
        try {
            // Limpiar el string por si viene con "const firebaseConfig = "
            const jsonPart = webConfigStr.includes('{') ? webConfigStr.substring(webConfigStr.indexOf('{'), webConfigStr.lastIndexOf('}') + 1) : webConfigStr;
            // Convertir a JSON válido si no lo es (ej: llaves sin comillas)
            config = JSON.parse(jsonPart.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":').replace(/'/g, '"'));
        } catch (e) {
            console.error('Error al parsear el Web Config. Asegúrate de que sea un JSON válido.');
            process.exit(1);
        }

        const serviceAccountStr = await question('\n2. Pega aquí el contenido del archivo JSON de tu Cuenta de Servicio: ');
        let serviceAccount = {};
        try {
            serviceAccount = JSON.parse(serviceAccountStr);
        } catch (e) {
            console.error('Error al parsear el Service Account JSON.');
            process.exit(1);
        }

        // Preparar el archivo .env.local
        const envContent = `
# Firebase Client (Público)
NEXT_PUBLIC_FIREBASE_API_KEY=${config.apiKey || ''}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${config.authDomain || ''}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${config.projectId || ''}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${config.storageBucket || ''}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${config.messagingSenderId || ''}
NEXT_PUBLIC_FIREBASE_APP_ID=${config.appId || ''}

# Firebase Admin (Servidor)
FIREBASE_SERVICE_ACCOUNT='${JSON.stringify(serviceAccount)}'
`;

        fs.writeFileSync(path.join(process.cwd(), '.env.local'), envContent.trim());
        console.log('\n✅ Archivo .env.local creado exitosamente.');
        console.log('✅ Firebase configurado para modo producción.');

        rl.close();
    } catch (error) {
        console.error('\n❌ Error durante la configuración:', error.message);
        rl.close();
    }
}

setup();
