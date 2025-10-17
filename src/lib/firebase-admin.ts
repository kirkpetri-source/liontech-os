import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Verificar se o Firebase Admin já foi inicializado
if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || (projectId ? `${projectId}.appspot.com` : undefined);
    const hasEnvCreds = Boolean(
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    );

    if (hasEnvCreds) {
      // Inicializar via variáveis de ambiente
      const serviceAccount = {
        projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        storageBucket,
      });
      // Ignorar campos undefined em documentos Firestore
      admin.firestore().settings({ ignoreUndefinedProperties: true });
    } else {
      // Tentar localizar arquivo de credenciais local se existir
      const explicitCredPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      const localFilePath = path.join(process.cwd(), 'serviceAccountKey.json');
      const candidatePath = explicitCredPath || (fs.existsSync(localFilePath) ? localFilePath : undefined);

      if (candidatePath && fs.existsSync(candidatePath)) {
        const serviceJson = JSON.parse(fs.readFileSync(candidatePath, 'utf8')) as admin.ServiceAccount;
        admin.initializeApp({
          credential: admin.credential.cert(serviceJson),
          storageBucket,
        });
        admin.firestore().settings({ ignoreUndefinedProperties: true });
      } else {
        // Fallback: credenciais padrão (pode usar ADC do gcloud, etc.)
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId,
          storageBucket,
        });
        admin.firestore().settings({ ignoreUndefinedProperties: true });
      }
    }
  } catch (error) {
    console.error('Erro ao inicializar Firebase Admin:', error);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();

export default admin;