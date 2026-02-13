# 🔥 Guía de Activación: ContractOS Enterprise con Firebase

Para que el sistema sea **100% persistente, seguro y profesional**, vamos a conectar tu proyecto con Firebase. Sigue estos pasos exactos:

---

## 🏗️ Paso 1: Crear el Proyecto en Firebase
1. Ve a [Firebase Console](https://console.firebase.google.com/).
2. Haz clic en **"Añadir proyecto"** e introdúce el nombre: `contract-os-enterprise`.
3. Desactiva Google Analytics para esta demo (opcional) y pulsa **"Crear proyecto"**.

---

## 🗄️ Paso 2: Configurar la Base de Datos (Firestore)
1. En el menú lateral, ve a **Build > Firestore Database**.
2. Haz clic en **"Crear base de datos"**.
3. Elige la ubicación más cercana a ti.
4. Selecciona **"Modo de producción"**.
5. En la pestaña **"Reglas"**, pega esto para permitir acceso mientras desarrollamos (luego lo cerraremos más):
```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // Acceso permanente (ajustar antes de lanzar a público)
    }
  }
}
```

---

## 📁 Paso 3: Configurar el Almacenamiento (Storage)
1. Ve a **Build > Storage**.
2. Haz clic en **"Empezar"** y selecciona **"Modo de producción"**.
3. **IMPORTANTE**: Si te sale el error *"La ubicación de tus datos se estableció en una región que no admite buckets sin costo"*:
   - Simplemente haz clic en el botón de **"Crear bucket"** o **"Continuar"**. 
   - Si no te deja, elige la ubicación **Default** (normalmente `nam5` o `us-central`) si te lo permite, o crea uno con el nombre por defecto que sugiere Firebase.
4. En la pestaña **"Reglas"**, asegúrate de que se vea así para que no caduque:
```javascript
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

---

## 🔑 Paso 4: Obtener las Credenciales (Lo más importante)

### A. Credenciales Web (Cliente)
1. En la rueda dentada de arriba (Configuración del proyecto) > **Configuración del proyecto**.
2. Abajo del todo, haz clic en el icono de **Web (`</>`)** para registrar una app. Ponle el nombre `ContractOS Web`.
3. Copia el objeto `firebaseConfig` (el que tiene `apiKey`, `authDomain`, etc.).

### B. Credenciales Administrativas (Servidor)
1. En la misma pantalla, ve a la pestaña **"Cuentas de servicio"**.
2. Haz clic en el botón azul **"Generar nueva clave privada"**.
3. Se descargará un archivo JSON. **Copia todo su contenido**.

---

## 🚀 Paso 5: Autoconfiguración Mágica
Una vez tengas los dos textos copiados (el objeto Config y el JSON de cuenta de servicio):

1. Abre en tu navegador: **http://localhost:3000/setup-firebase**
2. Pega los datos en los campos correspondientes.
3. Haz clic en **"Finalizar Configuración Enterprise"**.

¡Listo! El sistema detectará las credenciales y cambiará automáticamente de SQLite local a **Firebase Production** en la nube.

---

## 📱 ¿Cómo acceder desde otros dispositivos?

Ahora que la base de datos es persistente en la nube (Firebase), tienes dos formas de entrar desde otros sitios:

### 1. En tu casa/oficina (Acceso Local)
Si quieres entrar desde tu móvil o tablet mientras el ordenador está encendido:
1. Asegúrate de que el móvil esté en la misma red Wi-Fi.
2. Mira la terminal donde sale `npm run dev`. Verás una dirección llamada **Network**.
3. Ej: `http://192.168.1.35:3000`. Entra ahí desde el navegador de tu móvil.

### 2. En todo el mundo (Acceso Global)
Para que cualquier persona entre desde cualquier lugar (ej: `tu-empresa.vercel.app`):
1. Sube este código a un repositorio privado de **GitHub**.
2. Conecta ese repositorio a **Vercel** o **Netlify**.
3. En la configuración de Vercel, añade las mismas variables que pusimos en el `.env.local`.

¡Y ya está! ContractOS será accesible desde cualquier rincón del planeta. 🌍✈️
