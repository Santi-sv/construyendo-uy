# Conexión de construyendo.uy

Estado: conexión aplicada el 30/10/2026; propagación del registro .uy y certificado HTTPS pendientes. El usuario confirmó expresamente el cambio de nameservers. GitHub Pages tiene asociado `construyendo.uy`; la versión publicada usa la raíz `/` y el servicio de imágenes permite `https://construyendo.uy/`.

El dominio sigue registrado en Hosting Montevideo. Se creó su zona en el plan Free de Cloudflare y se guardaron `aarav.ns.cloudflare.com` y `tara.ns.cloudflare.com` en el registrador. Los cinco registros están en DNS only y los nameservers de Cloudflare ya responden correctamente. En la última comprobación, `a.nic.uy` y `b.nic.uy` aún anunciaban los nameservers anteriores. No había registros DS de DNSSEC; no se desactivó ninguna protección existente.

## Registros para la web

| Tipo | Nombre | Valor | TTL |
| --- | --- | --- | --- |
| A | @ | 185.199.108.153 | Auto (300) |
| A | @ | 185.199.109.153 | Auto (300) |
| A | @ | 185.199.110.153 | Auto (300) |
| A | @ | 185.199.111.153 | Auto (300) |
| CNAME | www | santi-sv.github.io | Auto (300) |

Con Cloudflare, mantener estos registros en DNS only. El registro del dominio sigue en Hosting Montevideo. Conservar cualquier registro de correo, verificación u otro servicio que aparezca al acceder a la zona autorizada. El archivo `construyendo.uy.zone` contiene únicamente los registros de la web.

## Aplicación coordinada

1. Preparar la zona DNS con los registros indicados y anotar los nameservers asignados por el proveedor elegido.
2. Configurar `construyendo.uy` como dominio personalizado del repositorio `Santi-sv/construyendo-uy`. Verificar la propiedad en la cuenta de GitHub cuando se disponga del TXT correspondiente. Conservar ese TXT.
3. Publicar la compilación para el dominio propio. El workflow obtiene `base_path` de `actions/configure-pages`; la raíz pasa de `/construyendo-uy/` a `/`.
4. Aplicar los nameservers preparados, comprobar la resolución pública y esperar el certificado de GitHub Pages. Activar HTTPS obligatorio cuando el certificado esté disponible.
5. En el servicio de imágenes existente, actualizar únicamente `PUBLIC_SITE_URL` a `https://construyendo.uy/` y aplicar la configuración siguiendo la respuesta del proveedor. Conservar los secretos y los datos actuales.
6. Verificar portada, galería, presupuesto, contacto descargable y panel. El panel final será `https://construyendo.uy/admin.html`. Las sesiones anteriores pueden requerir un nuevo ingreso; el código permanece igual.

No se debe declarar terminada la conexión hasta que DNS, HTTPS y acceso privado se hayan verificado en el dominio propio.

## Finalización de HTTPS

`node scripts/finalize-domain.mjs` comprueba una vez el estado. Con `--watch`, espera hasta 26 horas, revisa cada minuto y termina al completar la comprobación. Necesita esta Mac encendida y la sesión local de `gh` disponible. El estado se registra en `.qa/domain-status.json`, excluido de Git.

El proceso activa HTTPS obligatorio solo después de comprobar el DNS de GitHub Pages, un certificado válido y el contenido de ConstruYENDO. Se detiene si el dominio configurado cambia. Al finalizar verifica portada, panel, imagen de portada, rechazo anónimo y CORS administrativo; no solicita el código ni inicia sesiones nuevas. Si vence sin completarse, se puede ejecutar de nuevo cuando el DNS esté activo.

Referencias: [GitHub Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site), [verificación de dominio](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages), [gestión DNS de Hosting Montevideo](https://www.hostingmontevideo.com/como-administrar-la-zona-dns-de-mi-dominio/).
