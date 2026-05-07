# Doble Pulso v4 Definitive

Versión definitiva del prototipo: app mobile-first para que dos personas respondan simultáneamente, comparen todas sus respuestas y exporten todo al finalizar.

## Qué trae v4

### Sala y privacidad

- Sala online con Cloudflare Worker + Durable Object.
- WebSocket en tiempo real.
- PIN de 4 a 8 dígitos.
- Caducidad automática:
  - 2 horas,
  - 24 horas,
  - 7 días.
- Borrado manual de sala.
- Opción: borrar automáticamente 30 minutos después de que ambas personas terminen.
- Copia separada de:
  - enlace,
  - PIN,
  - enlace completo con PIN.

### Formas de responder

- Cada persona a su ritmo.
- Modo “Pregunta a pregunta juntos”, donde ambos responden la misma pregunta y la sala avanza cuando los dos han contestado.

### Test

- Modo rápido: 36 preguntas.
- Modo equilibrado: 72 preguntas.
- Modo adaptativo: empieza con 72 y propone extras solo si detecta zonas sensibles.
- Modo completo: 96 preguntas.
- 12 dimensiones centrales.
- Todas las preguntas tienen 6 opciones cerradas con emoji.
- Sin respuestas abiertas.
- Sin sliders 0-10.

### Resultados

Al terminar ambas personas:

- animación de revelado,
- dashboard general,
- química vs sostenibilidad,
- seguridad,
- proyecto,
- cuidado,
- riesgo de malentendido,
- diferencia cuidable,
- confianza del resultado,
- dimensiones,
- bloqueadores estructurales,
- encajes espejo,
- respuestas completas de Persona A,
- respuestas completas de Persona B,
- comparación pregunta a pregunta,
- filtros por:
  - todas,
  - críticas,
  - score bajo,
  - sensibles,
  - encajes fuertes,
  - complementarias,
  - dimensión.

### Export

- ZIP completo.
- JSON completo.
- CSV de respuestas.
- CSV de comparaciones.
- TXT informe.
- PNG resumen.
- Compartir JSON en iOS.

## Arquitectura

```txt
React + Vite
↓
Cloudflare Worker
↓
Durable Object por sala
↓
WebSocket A/B
```

## Instalar

```bash
npm install
```

## Probar local con Worker

```bash
npm run cf:dev
```

## Desplegar

```bash
npm run deploy
```

## GitHub Actions

El workflow está en:

```txt
.github/workflows/deploy-cloudflare.yml
```

Necesitas crear en GitHub el secret:

```txt
CLOUDFLARE_API_TOKEN
```

## Uso

1. Persona A crea sala.
2. Elige modo, ritmo, PIN y caducidad.
3. Copia enlace y PIN.
4. Persona B entra desde su móvil.
5. Ambos responden.
6. Los resultados se desbloquean cuando ambos terminan.
7. Se exporta el ZIP completo.
8. Si se quiere, se elimina la sala manualmente.

## Notas importantes

- El PIN se guarda hasheado en el Durable Object.
- Las respuestas se revelan al final para ambas personas.
- Al caducar o borrar la sala, las respuestas desaparecen del Durable Object.
- La app no diagnostica ni predice destino romántico.
- El resultado debe leerse como mapa de conversación y compatibilidad, no como sentencia.
