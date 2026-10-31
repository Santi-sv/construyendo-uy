# ConstruYENDO · construyendo.uy

Portafolio estático de ConstruYENDO Revestimientos en Maldonado. React + Vite + TypeScript + Tailwind CSS. El sitio público es estático y la administración de imágenes utiliza un servicio independiente. Sin servicios de seguimiento. El preparador de presupuestos arma un mensaje localmente; el visitante lo abre, revisa y envía desde WhatsApp.

Versión pública autorizada por el usuario el 29/10/2026. Sitio: https://santi-sv.github.io/construyendo-uy/ · Repositorio: https://github.com/Santi-sv/construyendo-uy.

Se puede seguir trabajando localmente sin publicar cada cambio. El despliegue de GitHub Pages se ejecuta manualmente desde Actions.

## Desarrollo

Requiere Node.js 20.19 o superior.

```sh
npm ci
npm run dev
```

La vista previa se sirve en http://127.0.0.1:5173. Para producción:

```sh
npm run build
npm run preview
```

`npm run build` verifica TypeScript y genera `dist/`. Las fuentes se sirven desde el propio sitio; no hay solicitudes a Google Fonts.

## Fotos y descripciones

- `src/data/projects.json`: las 26 fotos de la galería. Se muestran 24 vistas principales; los detalles del piso símil madera y del piso con niveladores se agrupan con sus vistas generales para evitar repeticiones consecutivas.
- `src/data/process.json`: las tres fotos de proceso, separadas de la galería.
- `src/data/dimensions.json`: dimensiones generadas para reservar el espacio de cada imagen.
- `public/images/retocadas/`: versiones WebP de 640 y hasta 2000 px (sin ampliar originales pequeños), con mayor calidad de exportación.
- `assets/fotos-reveladas/`: maestros JPEG a resolución original, perfiles sRGB y registro de ajustes. No se suben al hosting.
- Los JPG originales se conservan en las carpetas `Seccion …`. No se incluyen en el despliegue.

Para sumar una foto: copiar el JPG a su carpeta original, agregar un registro en `projects.json` con `id`, `category`, `description` y `prefix` (prefijo único del nombre original), y ejecutar:

```sh
npm run photos:develop
npm run images
npm run build
```

Categorías: `banos`, `pisos`, `piscinas`, `piedra`, `escaleras`. Los filtros y sus cantidades se actualizan automáticamente. El proceso de imágenes corrige EXIF y evita ampliar originales pequeños. El duplicado `9846e967` está excluido. Las descripciones iniciales están pendientes de validación por el cliente.

El revelado requiere Python con Pillow y NumPy. Los ajustes por foto están en `scripts/photo-grades.json`: exposición en luz lineal, balance de blancos conservador, recuperación leve de sombras, reducción mínima de ruido y enfoque. No se regenera contenido ni se cambia el encuadre. `assets/fotos-reveladas/manifest.json` registra los ajustes y el SHA-256 de cada original. En esta sesión el entorno de revelado se preparó en `/tmp/construyendo-photo-env`.

## Identidad visual

La paleta sigue la tarjeta de trabajo compartida el 30/10/2026: negro, blanco y grises neutros, con dorado champán protagonista en títulos, franjas y botones principales. Por pedido posterior del usuario, todos los accesos de WhatsApp vuelven a utilizar verde; sus botones con texto usan un verde más profundo para asegurar contraste con el blanco. La referencia original se conserva en `assets/brand/tarjeta-referencia-20261030.jpg`. La marca usa solo letras, sin el símbolo anterior de placas: «ConstruYendo» en negrita inclinada tomando como referencia la remera, con tinta clara en «Constru», un degradado dorado cálido en «Yendo», contorno fino, relieve discreto, línea inferior, rubro y lema, como en la referencia de la remera. El favicon también usa letras. Los colores de marca están en `src/brand.css`: `--charcoal`, `--black`, `--accent`, `--accent-light` y `--accent-ink`. Cobertura y presupuesto suman colores semánticos: ubicación roja, visitas sin cargo verdes y zonas con costo ámbar. La interfaz, las animaciones, el favicon y la imagen social comparten esta identidad; las fotografías reales mantienen su color natural.

Se incorporaron dos fotos del piso en colocación, conservando los JPG en `Seccion pisos/`: `5603eaa7` es la vista general y `188cf567` es el detalle, agrupado bajo la insignia «2 fotos». Reciben ajustes fotográficos locales con parámetros en `scripts/photo-grades.json`, sin regeneración ni cambios de geometría.

## Contacto y visor

La portada usa la imagen ilustrativa de dos instaladores colocando baldosas en el interior de una vivienda moderna, proporcionada por el usuario el 30/10/2026. El original se conserva en `assets/hero/instaladores-baldosas-v1.png`; la procedencia se registra en `assets/hero/provenance.json`. Está rotulada como ilustrativa y se mantiene fuera de la galería de obras reales. Los maestros de las dos portadas anteriores, sus registros de procedencia y el prompt disponible se conservan en `assets/hero/`.

`node scripts/prepare-hero.mjs assets/hero/instaladores-baldosas-v1.png` genera cuatro WebP para escritorio y celular, sin ampliar el original, y actualiza `src/data/hero-image.json`. El encuadre móvil 16:10 conserva a los dos instaladores. El preparador usa nombres propios para cada portada y preserva las versiones anteriores. La portada conserva la animación de entrada y respeta movimiento reducido.

El número y los textos de WhatsApp están en `src/lib/gallery.ts`. El contacto descargable está en `public/contacto.vcf`.

El cierre de contacto ofrece dos acciones: «Escribir por WhatsApp» y «Llamar por teléfono» (`tel:`), sin mostrar el número ni nombres personales. Se retiraron el número visible, su botón de copia y el WhatsApp duplicado junto a la foto. `ContactSection.tsx` concentra este bloque; `phoneUrl` y `whatsappUrl` comparten el mismo número de contacto.

`ContactActions.tsx` adapta la referencia 35 de Andrew Millen: al pulsar, el botón se convierte en una línea, después en un círculo y dibuja un check. Es una respuesta al clic, sin afirmar que se haya enviado un mensaje o realizado una llamada. La opción elegida se abre a los 1,25 segundos; ambos controles bloquean activaciones repetidas durante la secuencia y se restauran al volver o tras 2,5 segundos. El check tiene su propio tamaño y margen cero para que no herede el desplazamiento de las flechas de otros botones; el dibujo queda centrado en el círculo. Los clics modificados conservan el comportamiento nativo. Si se bloquea la nueva pestaña de WhatsApp, se usa la misma pestaña; las llamadas usan `tel:`. Movimiento reducido omite la espera y la animación.

El filtro elegido se recuerda en almacenamiento local; si el navegador lo bloquea, la galería sigue funcionando. El visor usa un diálogo nativo con foco confinado, restaura el foco al cerrarse, admite Esc y flechas, deslizamiento táctil y botones anterior/siguiente. El mensaje de «Quiero algo así» incluye la descripción y el tipo de obra.

`PortfolioExplorer.tsx` presenta las seis categorías en un bloque negro con tarjetas de iconos y cantidades grandes. La selección se destaca en dorado champán y se anuncia en una barra de resultados, junto a los controles para recorrer o ver la grilla. Se muestran todas las categorías también en celular, sin desplazamiento horizontal. `portfolio-explorer.css` controla este acceso principal al portafolio y respeta movimiento reducido.

Las tomas complementarias se agrupan con `detailIds` en la vista principal y `detailOf` en el detalle. El detalle se conserva en el visor ampliado y no se repite como tarjeta de la galería. La insignia «2 fotos» indica que hay más de una toma disponible. Las secciones auxiliares eligen fotos por ID para mantener su selección cuando cambia la galería.

Los carruseles admiten deslizamiento táctil, arrastre con mouse, flechas, Home/End y pausa. Avanzan automáticamente solo mientras están visibles; se pausan al manejarlos, al enfocar sus controles o al ocultar la pestaña. El avance asociado al scroll se usa en proceso, metodología y exteriores. Se respeta `prefers-reduced-motion`.

## Pedido de presupuesto

`PaymentPanel.tsx` presenta efectivo y transferencia como dos tarjetas informativas. `PaymentMethodIcon.tsx` dibuja dos ilustraciones SVG propias con detalle y profundidad: billetes y monedas en verde para efectivo, y un banco con columnas y flechas en azul para transferencia. Estos colores semánticos distinguen los medios de pago sobre las tarjetas negras y doradas. El bloque «Tu obra. Cuentas claras.» destaca los tres puntos a acordar en el presupuesto: importe, forma de pago y plazos. Conserva el acceso al preparador y su animación «Next». No incorpora medios de pago ni condiciones comerciales adicionales. `payment-panel.css` contiene su diseño adaptable.

`src/lib/quotes.ts` concentra las zonas y el texto del pedido. Visita y presupuesto sin cargo **solo en la ciudad de Maldonado y Punta del Este**. Las demás zonas tienen costo según ubicación. No hay precios inventados: el mensaje solicita consultar el importe antes de coordinar.

El preparador pide trabajo y zona, admite una ubicación personalizada y detalles opcionales, y muestra el mensaje antes de abrir WhatsApp. No envía nada por su cuenta. `npm test` verifica las dos zonas sin cargo, el resto de las ubicaciones y la codificación del mensaje.

La vista previa presenta dos tarjetas editables para trabajo y ubicación, un indicador circular de avance y una guía para completar el siguiente dato pendiente. Sin datos muestra un estado inicial útil; desde el primer dato aparece el borrador real y, al completar ambos, queda disponible «Copiar». El mensaje no contiene campos entre corchetes. Si el navegador bloquea el portapapeles, selecciona el texto para copiarlo manualmente. La política de visita se distingue debajo del mensaje, con el costo que corresponde a la zona. La vista previa usa colores semánticos: ámbar para trabajo, rojo para ubicación, azul para comunicación, turquesa para la visita inicial y verde para WhatsApp y estados completados. Las tarjetas conservan su color al completar datos; los textos y checks indican el estado sin depender solo del color. En escritorio, los mensajes largos se pueden desplazar dentro de la tarjeta; en celular, el contenido fluye con la página.

Al seleccionar un trabajo, su tarjeta muestra una foto real correspondiente de la galería. Al seleccionar una de las siete localidades, la tarjeta de ubicación muestra una fotografía representativa de Wikimedia Commons. `src/lib/quoteVisuals.ts` relaciona las selecciones con las fotos; `src/data/quote-locations.json` registra los encuadres, las fuentes y las licencias. Los fondos se cargan solo al elegirlos, con una transición suave, capa de contraste y respeto por movimiento reducido. «Otra zona» conserva el fondo semántico sin asignarle una foto de un lugar distinto. La Capuera se representa con el entorno de la Laguna del Sauce, rotulado explícitamente.

Las imágenes de localidades están optimizadas en `public/images/localidades/`, separadas de las obras reales. Las copias de origen y la procedencia completa se conservan en `assets/localidades/`. Los enlaces públicos de fuente ofrecen los créditos completos; las licencias y las modificaciones se registran también en `public/THIRD_PARTY_NOTICES.txt`. No se realizan consultas a servicios de fotos durante la visita.

`QuoteCardIcon.tsx` contiene los ocho iconos compactos propios de estas tarjetas. Se presentan en círculos translúcidos junto al nombre, en la parte inferior de cada foto, con tamaño y centro vertical compartidos. El trabajo conserva el dorado y la ubicación el rojo; los nombres largos y la aclaración de La Capuera se adaptan sin desplazar los iconos.

Los botones incorporan tres adaptaciones CSS propias de las referencias elegidas de BrasilCode: halo circular en el CTA del hero, burbujas al interactuar con WhatsApp y partículas en «Guardar contacto». No requieren librerías de animación, tienen respuesta de foco y pulsación, y respetan movimiento reducido. El halo de entrada y los efectos de partículas tienen duración limitada.

El efecto «Next», inspirado en el ejemplo de Imran Pardes incluido en la misma referencia, se aplica a «Hablemos», «Conversemos sobre tu obra», la flecha de «Coordinemos una visita» y «Preparar pedido de presupuesto». `NextArrow.tsx` dibuja tres chevrones propios; `next-buttons.css` controla la base inclinada, la sombra y el despliegue con color secuencial al pasar el cursor o enfocar. El ancho reservado evita que se mueva el contenido y la preferencia de movimiento reducido muestra las tres flechas estáticas. Se conservan los destinos y textos originales.

`gradient-buttons.css` adapta el borde con gradiente animado del ejemplo 24 de Alexander Bodin a los dos controles circulares elegidos: WhatsApp flotante y la flecha de consulta por zonas. Los trazos recorren el perímetro; WhatsApp usa su verde reconocible y símbolo blanco; la consulta por zonas también usa verde e icono de WhatsApp. El fondo incorpora la división diagonal del ejemplo. En movimiento reducido, el borde queda estático.

El SVG de WhatsApp proviene de Bootstrap Icons; su licencia está en `public/THIRD_PARTY_NOTICES.txt`.

## Iconografía propia

`src/components/Icons.tsx` contiene 31 dibujos SVG creados para ConstruYENDO: geometría de placas, encuentros y cuñas, con trazos coherentes y acentos de marca. Se usan en categorías, beneficios, metodología, nivelación, pagos y controles. WhatsApp conserva su símbolo reconocible. `src/iconography.css` adapta tamaño y color al contexto.

`assets/brand/iconos-construyendo/` conserva los SVG independientes, el inventario `manifest.json` y una lámina de presentación en `lamina.svg`. Estos archivos maestros no se cargan por separado en la web: los iconos se renderizan en línea desde React y permanecen nítidos en cualquier resolución.

## Publicación en GitHub Pages

El repositorio público contiene el código y las imágenes optimizadas necesarias. Las carpetas `Seccion …`, los maestros de `assets/`, las capturas de `.qa/` y las variables de entorno se conservan localmente y quedan excluidas de Git.

El workflow `.github/workflows/pages.yml` instala dependencias, ejecuta las pruebas, compila con la base `/construyendo-uy/` y publica `dist/`. No se ejecuta al guardar ni al hacer push: para publicar una revisión, abrir **Actions → Publicar ConstruYENDO en GitHub Pages → Run workflow**, después de que el usuario lo solicite.

Para comprobar localmente la misma compilación:

```sh
npm test
npm run build -- --base=/construyendo-uy/
npm run preview -- --base=/construyendo-uy/
```

Las rutas de las fotos, el hero y el contacto descargable usan `import.meta.env.BASE_URL`; los enlaces entre secciones usan anclas. Los metadatos y el sitemap corresponden a la dirección pública de GitHub Pages. No se ha vinculado un dominio propio. La configuración de Vercel se conserva para una futura migración autorizada por el usuario.

## Navegación y respuestas de los botones

`SiteHeader.tsx` concentra la marca solo con letras, la navegación agrupada y el menú desplegable para pantallas de hasta 1100 px. El menú se cierra al elegir una sección, pulsar Escape o tocar fuera; la navegación indica la sección visible. `header.css` controla el diseño.

Se revisaron las referencias de https://www.brasilcode.com.br/35-botoes-css-com-animacao/ y los ejemplos originales de CodePen. `action-motion.css` combina adaptaciones propias, conservando las anteriores que eligió el usuario: halo circular en portada (25), barrido lateral en portafolio (18/21), recorrido y flechas en navegación (23/24), trazo del contorno en pagos (21), burbujas en el pedido (29), partículas en la descarga (9) y transformación a círculo/check en contacto (35). WhatsApp añade un gesto de conversación y el teléfono un movimiento de timbre. El cierre de contacto conserva los destinos, su apertura única y la demora original; ninguna animación afirma que el mensaje se haya enviado. Los efectos responden a foco, hover o pulsación según el control y respetan movimiento reducido.

## Fondo cartográfico de cobertura

La tarjeta de cobertura utiliza `public/images/maps/maldonado-calles.svg`: calles y avenidas reales de la ciudad de Maldonado, a partir de OpenStreetMap, simplificadas y estilizadas como un fondo discreto que cubre toda la tarjeta. No es un mapa nacional. El plano es estático y no utiliza librerías de mapas, teselas, cookies ni consultas a terceros durante la visita. La atribución se muestra al pie de la tarjeta; los datos y su licencia ODbL se registran en `public/THIRD_PARTY_NOTICES.txt`. El extracto geométrico y la procedencia se conservan localmente en `assets/maps/`.

## Administrador de imágenes

Panel del equipo: https://construyendo-uy-equipo.sam777-varela.chatgpt.site/admin. Está alojado en Sites, sobre un Worker de Cloudflare con D1 y R2. La web pública continúa en GitHub Pages; `src/data/cms-hosting.json` define el servicio del que lee las imágenes y los datos publicados. `VITE_CMS_ORIGIN` permite sobrescribir ese origen al compilar. En desarrollo se usa el servicio local integrado a Vite.

Administra las fotos de obras, la portada y las imágenes de localidades mediante un código compartido, que se puede cambiar en Configuración. Usa autenticación del lado del servidor, borradores y publicación separados; no valida la clave en el navegador ni guarda credenciales en localStorage. El código y sus registros privados no forman parte del repositorio ni de la compilación pública.

`server/README.md` describe el inicio local, las pruebas y la configuración del servicio. `cms-hosted/` mantiene el checkout independiente del panel, con su identidad de alojamiento y las migraciones de D1. Para sincronizar cambios se usa `node scripts/prepare-cms-hosted.mjs` sin copiar datos privados. Las nuevas publicaciones siguen requiriendo un pedido del usuario.
