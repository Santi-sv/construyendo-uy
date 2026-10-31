# Conexión de construyendo.uy

Estado: preparación local. No se modificaron todavía el dominio de GitHub Pages, sus DNS ni el origen permitido del panel.

El dominio está registrado en Hosting Montevideo. Al revisar la cuenta el 30/10/2026 solo estaban contratados dominios, sin servicio DNS administrado. Los servidores actuales `ns1.servidorlinux19.com` y `ns2.servidorlinux19.com` respondían REFUSED; Google y Cloudflare devolvían SERVFAIL. Está pendiente elegir el proveedor de DNS.

## Registros para la web

| Tipo | Nombre | Valor | TTL |
| --- | --- | --- | --- |
| A | @ | 185.199.108.153 | 3600 |
| A | @ | 185.199.109.153 | 3600 |
| A | @ | 185.199.110.153 | 3600 |
| A | @ | 185.199.111.153 | 3600 |
| CNAME | www | santi-sv.github.io | 3600 |

Con Cloudflare, mantener estos registros en DNS only. El registro del dominio sigue en Hosting Montevideo. Conservar cualquier registro de correo, verificación u otro servicio que aparezca al acceder a la zona autorizada. El archivo `construyendo.uy.zone` contiene únicamente los registros de la web.

## Aplicación coordinada

1. Preparar la zona DNS con los registros indicados y anotar los nameservers asignados por el proveedor elegido.
2. Configurar `construyendo.uy` como dominio personalizado del repositorio `Santi-sv/construyendo-uy`. Verificar la propiedad en la cuenta de GitHub cuando se disponga del TXT correspondiente. Conservar ese TXT.
3. Publicar la compilación para el dominio propio. El workflow obtiene `base_path` de `actions/configure-pages`; la raíz pasa de `/construyendo-uy/` a `/`.
4. Aplicar los nameservers preparados, comprobar la resolución pública y esperar el certificado de GitHub Pages. Activar HTTPS obligatorio cuando el certificado esté disponible.
5. En el servicio de imágenes existente, actualizar únicamente `PUBLIC_SITE_URL` a `https://construyendo.uy/` y aplicar la configuración siguiendo la respuesta del proveedor. Conservar los secretos y los datos actuales.
6. Verificar portada, galería, presupuesto, contacto descargable y panel. El panel final será `https://construyendo.uy/admin.html`. Las sesiones anteriores pueden requerir un nuevo ingreso; el código permanece igual.

No se debe declarar terminada la conexión hasta que DNS, HTTPS y acceso privado se hayan verificado en el dominio propio.

Referencias: [GitHub Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site), [verificación de dominio](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages), [gestión DNS de Hosting Montevideo](https://www.hostingmontevideo.com/como-administrar-la-zona-dns-de-mi-dominio/).
