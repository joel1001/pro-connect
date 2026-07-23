# ProConnect — Frontend

Aplicación móvil y web de ProConnect construida con **React Native + Expo (Expo Router)**, **TypeScript**, **Zustand**, **Context/Atomic Design** y **WebSockets**. Mobile‑first y totalmente responsive: en escritorio se comporta como una web real (sidebar + contenido ancho), en móvil usa tabs inferiores.

Consume el backend Spring Boot (`../backend`) bajo `http://localhost:8080/api/v1`.

## Requisitos

- Node 20+ (probado con Node 24)
- Expo SDK 56

## Cómo ejecutar

```bash
cd frontend
npm install
npm run web        # navegador (Expo Web)
npm run ios        # simulador iOS
npm run android    # emulador Android
```

Variables de entorno opcionales (build time):

```bash
EXPO_PUBLIC_API_URL=http://localhost:8080/api/v1
EXPO_PUBLIC_WS_URL=ws://localhost:8080/api/v1/ws
```

> En el emulador Android, `localhost` del host es `10.0.2.2` (ya contemplado por defecto).

## Arquitectura

### Atomic Design (`src/components`)
- **atoms** — `Button`, `Input`, `Text`, `Card`, `Avatar`, `Badge`, `Icon`, `Divider`, `Spinner`, `ScreenContainer`.
- **molecules** — `SectionHeader`, `StatCard`, `ListRow`, `SearchBar`, `RoleCard`, `EmptyState`, `FormField`.
- **organisms** — `BrandLogo`, `RoleSwitcher`, `ProfileView`, `StubScreen`.
- **templates** — `AuthLayout` (tarjeta centrada en web), `RoleShell` (sidebar en web / tabs en móvil).

### Estado
- **Zustand** (`src/store/authStore.ts`) — sesión, tokens, `user`, `availableRoles` y `activeRole` (cambio de rol). Persistencia con AsyncStorage.
- **API** (`src/api`) — instancia axios con bearer token y refresh automático en 401.
- **WebSockets** (`src/services/websocket.ts`) — cliente reconectante para chat y notificaciones.

### Roles y plantillas (`src/config/roles.ts`)
4 plantillas según rol activo, cada una con su acento de color y navegación:

| Rol | Color | Ruta base | Navegación |
|-----|-------|-----------|------------|
| Cliente | Azul | `/client` | Inicio · Contratos · Mensajes · Alertas · Perfil |
| Profesional | Cian | `/professional` | Inicio · Servicios · Agenda · Contratos · Finanzas · Perfil |
| Admin | Ámbar | `/admin` | Panel · Verificaciones · Disputas · Usuarios · Perfil |
| Super Admin | Violeta | `/super-admin` | Panel · Comisiones · Planes · Categorías · Perfil |

El **switch de rol** vive en el Perfil y solo muestra los roles que el usuario posee (`availableRoles`). Incluye un botón de *vista previa de todos los roles (dev)* para probar las 4 plantillas sin una cuenta multi‑rol.

### Navegación (Expo Router, `src/app`)
- `(auth)/` — onboarding, selección de rol, login, registro (cliente y profesional), verificación de correo, recuperar/restablecer contraseña.
- `client/`, `professional/`, `admin/`, `super-admin/` — cada grupo con su `_layout.tsx` que renderiza `RoleShell`.
- `shared/` — pantallas comunes con header propio: lista y detalle de profesional, chat, centro de ayuda, configuración, métodos de pago, términos.

Todas las vistas de los diseños están **enrutadas y navegables**. Las pantallas de detalle aún sin implementar usan `StubScreen` (placeholder con el contenido planificado) para irse completando 1:1 con los diseños.
