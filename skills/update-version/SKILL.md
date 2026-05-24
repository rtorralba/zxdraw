# Skill: Actualizar versión (repositorio-local)

Descripción
- Este skill proporciona un pequeño script para actualizar la versión del proyecto en dos sitios dentro de este repositorio:
  - `package.json`
  - `snap/snapcraft.yaml`

Uso
- Ejecutar desde la raíz del repositorio:

```bash
node scripts/update-version.js 1.2.3
```

- El script valida un formato semver básico (`X.Y.Z`) y sobrescribe `package.json` y la línea `version:` dentro de `snap/snapcraft.yaml`. Si no existe la línea `version:` en `snap/snapcraft.yaml`, la añade al inicio del fichero.

Archivos añadidos
- `scripts/update-version.js` — script Node.js que realiza la operación.

Notas
- Haz un commit después de ejecutar el script si los cambios son correctos.
- Puedes integrar este script en un flujo de CI o añadir un `npm` script en `package.json` si lo deseas.
