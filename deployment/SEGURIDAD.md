# Revisión de seguridad y privacidad

Revisión realizada el 30/10/2026 sobre el código, la compilación y los controles funcionales. El dominio propio está pendiente de propagación; la validación final en producción queda registrada en `.qa/domain-status.json`.

## Controles comprobados

- `npm audit`: 0 vulnerabilidades conocidas en las dependencias instaladas, incluidas las de desarrollo.
- Las 12 pruebas de la API verifican acceso anónimo bloqueado, origen autorizado, CSRF, límite de intentos, vencimiento, cambio del código, revocación, cargas privadas, validación de archivos y conflictos de edición. El dominio propio tiene una prueba específica.
- El código compartido se valida en el servidor con PBKDF2-SHA256 de 600.000 iteraciones. No se incluye en el repositorio ni en la compilación pública.
- El panel en el dominio propio utiliza una sesión aleatoria en memoria, ligada al origen permitido. No guarda códigos ni sesiones en localStorage, URLs o cookies de preferencias. Las cookies del acceso directo al servicio conservan HttpOnly, Secure y SameSite=Strict.
- Las nuevas imágenes permanecen privadas hasta publicar. Las operaciones de escritura requieren sesión, origen autorizado y CSRF.
- La web y el panel incorporan una política CSP antes de cargar sus recursos. Los scripts y fuentes se limitan al propio sitio, las conexiones al servicio configurado y las imágenes a los orígenes previstos. No se utiliza `eval` ni inserción de HTML de las descripciones.
- La compilación del panel no ofrece campos de acceso si se abre mediante HTTP. Muestra un enlace a la dirección HTTPS.
- La vista previa bloqueó con HTTP 403 tanto los datos privados locales como el checkout del servicio. También se bloquearon por configuración las capturas de revisión y otras carpetas privadas.
- Los enlaces externos abren con `noopener noreferrer`; la web incluye una política de referencia `no-referrer`.

## Cookies y preferencias

El aviso permite usar solo lo necesario, aceptar preferencias o configurar la elección. El enlace «Cookies y privacidad» permanece en el pie de página. No hay analítica ni publicidad incorporadas.

`cy_privacy` es una cookie propia que guarda únicamente la versión de la elección, la aceptación o rechazo y su fecha; vence a los 180 días. En producción lleva Secure, Path=/ y SameSite=Lax, sin atributo Domain. No contiene identificadores de sesión ni datos personales. No lleva HttpOnly porque la propia interfaz necesita leer esa elección; se mantiene separada de la autenticación.

La categoría de la galería se recuerda solo después de aceptar preferencias. Rechazar o revocar elimina el valor almacenado. Las pruebas verificaron ausencia de consentimiento, rechazo, aceptación, revocación, fecha inválida y vencimiento. La comprobación en navegador confirmó persistencia de la categoría aceptada y su eliminación al revocar, así como el diseño móvil.

## Pendiente o limitado por el proveedor

1. **DNS y HTTPS:** el registrador guardó los nameservers de Cloudflare, pero el registro .uy aún anunciaba los anteriores al comprobarlo. GitHub no había emitido el certificado. El proceso temporal `scripts/finalize-domain.mjs --watch` espera, activa HTTPS obligatorio cuando esté listo y verifica las rutas principales. Necesita esta Mac encendida y autenticación local de `gh`.
2. **Bloqueo del registro:** el panel de Hosting Montevideo rechazó el intento de habilitar el bloqueo de transferencias y mostró «Se encontró un problema al actualizar el estado de bloqueo del dominio. Por favor comuníquese con soporte». Sigue desactivado en ese panel. Confirmar con el proveedor si está disponible para este dominio .uy; no se abrió un ticket ni se contactó a terceros.
3. **DNSSEC:** no había registros DS publicados. Una vez activa la zona se podrá evaluar su habilitación coordinada en Cloudflare y el registrador. No se desactivó DNSSEC existente.
4. **Encabezados HTTP del sitio estático:** GitHub Pages no permite configurarlos desde el repositorio. La CSP se entrega mediante meta; directivas como `frame-ancestors` requieren encabezados HTTP y no se declaran falsamente como activas. El servicio de administración sí entrega sus encabezados de seguridad. Para controles adicionales sobre la interfaz haría falta configurar una capa HTTP autorizada.

Esta revisión no equivale a una auditoría de penetración ni comprueba la seguridad de las contraseñas o el segundo factor de las cuentas de GitHub, Cloudflare y Hosting Montevideo. Se recomienda que sus titulares utilicen segundo factor.

Fuentes: [OWASP: sesiones](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), [OWASP: encabezados HTTP](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html), [GitHub Pages y HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https).
