# Administración privada de ConstruYENDO

Estado: panel publicado en Sites, con D1 y R2. Dirección: https://construyendo-uy-equipo.sam777-varela.chatgpt.site/admin. Proyecto de alojamiento: `appgprj_6ae5409ab6bc8191978a878f69331d02`. La web institucional continúa en GitHub Pages y obtiene el contenido publicado desde este servicio.

## Uso local

1. Ejecutar `npm run cms:setup` en una terminal interactiva y elegir el código inicial. La entrada no se muestra. Para una revisión temporal, `npm run cms:setup -- --random-local` crea un código aleatorio en `.cms-data/acceso-local.txt`, con permiso de lectura solo para el usuario local. El archivo no se sirve por HTTP ni se incluye en Git.
2. Ejecutar `npm run dev` y abrir `http://127.0.0.1:5173/admin.html`.
3. Ingresar con el código. El panel administra galería, portada e imágenes de las localidades. Los archivos originales del proyecto se conservan.
4. Guardar un borrador o publicar en la vista local. Ninguna de estas acciones modifica GitHub Pages mientras no se configure un servicio de producción.

El servicio local se integra a Vite y se limita a la interfaz de loopback. Los registros y las fotos cargadas permanecen en `.cms-data/`, excluido de Git, del sitio generado y del acceso HTTP de Vite. `CMS_DATA_DIR` permite usar otra carpeta privada. La escritura local utiliza bloqueo entre procesos y reemplazo atómico; no se recomienda como almacenamiento de producción.

## Seguridad implementada

- Código compartido de 14 a 128 caracteres, con variedad y letras; no se aceptan códigos solamente numéricos.
- PBKDF2-HMAC-SHA256, 600.000 iteraciones y salt aleatorio. Si Workers rechaza esa cantidad en Web Crypto, se calcula el mismo algoritmo y resultado con @noble/hashes, conservando las 600.000 iteraciones. No hay un código predeterminado en el código fuente ni en la compilación pública.
- Sesiones aleatorias de 256 bits: el servidor conserva el hash del identificador. Cookies HttpOnly, SameSite=Strict y Secure en producción, con prefijo `__Host-`.
- Vencimiento absoluto de 8 horas y de 30 minutos por inactividad. Cambiar el código requiere el código actual e invalida las sesiones anteriores.
- Todas las operaciones administrativas verifican sesión; las escrituras verifican Origin y un token CSRF. No hay una ruta pública de registro/configuración inicial.
- El panel de GitHub Pages se conecta solo al servicio configurado. El servidor permite CORS administrativo exclusivamente al origen HTTPS de `PUBLIC_SITE_URL`, sin cookies de terceros. Emite una sesión aleatoria ligada a ese origen, conservada únicamente en memoria y enviada por Authorization, nunca en URLs, localStorage ni sessionStorage. Al recargar el panel se solicita nuevamente el código. Las vistas previas privadas se obtienen mediante solicitudes autenticadas y URLs Blob temporales.
- El acceso directo en el origen del servicio conserva cookies HttpOnly/Secure/SameSite=Strict. Una sesión de Pages no sirve como cookie, ni una cookie como sesión de Pages. Ambas tienen la misma expiración, CSRF, límites y revocación por cambio de código.
- Cinco intentos de ingreso por dirección cada 15 minutos; límite global de 60 por minuto. Los contadores se guardan del lado del servidor.
- Fotos nuevas privadas hasta publicar. El navegador normaliza las fotos a JPEG en dos tamaños, sin modificar el archivo original. El servidor verifica tipo, tamaño, dimensiones y ausencia de EXIF/XMP/IPTC/comentarios; rechaza SVG.
- Borrador y publicación separados, con revisiones para detectar ediciones concurrentes. Se conservan los IDs originales que utilizan otras secciones.
- El panel no registra códigos, cookies ni cuerpos de solicitudes. La configuración de producción ausente impide abrir operaciones de administración.

Esto no reemplaza una revisión independiente de seguridad ni verifica la configuración del proveedor que se elija para producción.

## Alojamiento de producción

GitHub Pages sirve el sitio público y el panel en `https://santi-sv.github.io/construyendo-uy/admin.html`. La autenticación y el almacenamiento requieren un servicio separado. El servicio utiliza un Worker ESM de Cloudflare con D1 y R2, administrados por Sites.

`npm run cms:build` genera `.cms-dist/server/index.js`, que incluye la interfaz administrativa y las rutas del servicio. La configuración de producción utiliza estos pasos; para futuras actualizaciones se conserva el proyecto existente:

- Proveer bindings privados `DB` (D1) y `BUCKET` (R2), y aplicar `server/schema.sql`.
- Configurar `ADMIN_ORIGIN` con el origen HTTPS del panel y `PUBLIC_SITE_URL` con `https://santi-sv.github.io/construyendo-uy/`.
- Establecer `BOOTSTRAP_CREDENTIAL` como secreto del servidor: un registro producido por `hashCode` de `auth.mjs`, nunca el código en texto ni una variable `VITE_`. No existe una pantalla pública de inicialización.
- Desplegar y probar el Worker real, los bindings, las cookies, las cargas y el cambio de código. La compilación local no prueba por sí sola el entorno Cloudflare ni los límites de su plan.
- Compilar el sitio público y el panel con `VITE_CMS_ORIGIN` igual al origen HTTPS del servicio. Eso habilita la lectura del contenido publicado y la conexión segura del panel. El enlace «Acceso del equipo» apunta al `admin.html` del propio GitHub Pages.
- Publicar GitHub Pages únicamente ante un pedido del usuario. La compilación genera ambas entradas HTML; nunca incluye credenciales ni datos de sesión.

La primera publicación se verificó mediante acceso HTTPS real, rechazo del acceso anónimo, cookies de sesión, controles de origen y CSRF, carga privada, publicación y lectura de la imagen desde R2. La prueba restauró el contenido inicial de la galería. No se vinculó ningún dominio ni se solicitó Vercel. La fuente del servicio y su manifiesto están en el checkout independiente `cms-hosted/`, excluido del repositorio público de la web. Su migración inicial fue generada en `drizzle/` y debe conservarse una vez aplicada.

## Verificación

`npm test` incluye pruebas de acceso anónimo, origen/CSRF, cookies, límites concurrentes, expiración, cambio de código y revocación, privacidad del borrador, archivos inválidos, publicación, revisiones y persistencia local.

Fuentes de diseño: [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), [OWASP: almacenamiento de contraseñas](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [OWASP: sesiones](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), [Cloudflare: Web Crypto](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/).
