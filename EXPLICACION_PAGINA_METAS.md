# Explicación Educativa: Página de Metas (ObjetivoDetail)

## 📋 Visión General

La página de metas es el nivel más profundo de la jerarquía de Progress Tracker. Aquí es donde defines las **metas semanales** que contribuyen a alcanzar un **Objetivo mensual**.

```
Campos (áreas de vida)
  └─ Misiones (proyectos)
      └─ Objetivos (metas mensuales)
          └─ Metas (metas semanales) ← TÚ ESTÁS AQUÍ
              └─ Trackeables (acciones diarias)
              └─ Notas (reflexiones diarias)
              └─ AIPoints (evaluaciones diarias)
```

---

## 🔧 Cómo Funciona Técnicamente

### 1. **Importaciones y Configuración Inicial**

```typescript
import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
```

- **`useState`**: Maneja el estado local (mostrar/ocultar diálogo de crear meta)
- **`useParams`**: Extrae el ID del Objetivo de la URL (`/objetivo/:id`)
- **`useLocation`**: Permite navegar a otras páginas
- **`useAuth`**: Verifica si el usuario está autenticado
- **`trpc`**: Cliente para comunicarse con el backend

### 2. **Validación de Formulario (Zod)**

```typescript
const metaSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  startDate: z.string().min(1, "La fecha de inicio es requerida"),
  endDate: z.string().min(1, "La fecha de fin es requerida"),
  description: z.string().optional(),
});
```

**¿Qué es Zod?** Es una librería que valida datos **antes** de enviarlos al servidor. Garantiza que:
- El nombre no esté vacío
- Las fechas estén presentes
- La descripción es opcional

### 3. **Extracción del ID del Objetivo**

```typescript
const { id } = useParams<{ id: string }>();
const objetivoId = parseInt(id || "0", 10);
```

- Obtiene el ID de la URL (ej: `/objetivo/5` → `id = "5"`)
- Lo convierte a número entero para usarlo en queries

### 4. **Consulta de Metas (tRPC Query)**

```typescript
const { data: metas, isLoading: metasLoading, refetch: refetchMetas } = 
  trpc.hierarchy.metas.list.useQuery(objetivoId, {
    enabled: isAuthenticated && objetivoId > 0,
  });
```

**¿Qué hace?**
- **`data: metas`**: Lista de metas del objetivo actual
- **`isLoading`**: Indica si se están cargando los datos
- **`refetch`**: Función para recargar los datos manualmente
- **`enabled`**: Solo ejecuta la query si el usuario está autenticado Y hay un ID válido

### 5. **Mutaciones (Crear y Eliminar)**

#### Crear Meta:
```typescript
const createMetaMutation = trpc.hierarchy.metas.create.useMutation({
  onSuccess: () => {
    refetchMetas();           // Recarga la lista
    setShowCreateMeta(false); // Cierra el diálogo
    form.reset();             // Limpia el formulario
  },
});
```

#### Eliminar Meta:
```typescript
const deleteMetaMutation = trpc.hierarchy.metas.delete.useMutation({
  onSuccess: () => {
    refetchMetas(); // Recarga la lista
  },
});
```

### 6. **Manejo del Formulario (React Hook Form)**

```typescript
const form = useForm<MetaFormData>({
  resolver: zodResolver(metaSchema),
});
```

- **React Hook Form**: Gestiona el estado del formulario de forma eficiente
- **`zodResolver`**: Integra la validación de Zod con el formulario
- Evita re-renders innecesarios y proporciona validación en tiempo real

### 7. **Envío del Formulario**

```typescript
const onSubmit = (data: MetaFormData) => {
  createMetaMutation.mutate({
    objetivoId,
    name: data.name,
    startDate: data.startDate,
    endDate: data.endDate,
    description: data.description || undefined,
    weightAI: 0.5,        // Peso para evaluaciones IA
    weightTrackables: 0.5, // Peso para trackeables
  });
};
```

**Puntos importantes:**
- `weightAI` y `weightTrackables` son **pesos configurables** (a y b en la fórmula)
- Ambos están en 0.5 (50% cada uno) por defecto
- Se pueden ajustar por meta para personalizar cómo se calcula el progreso

---

## 🎨 Interfaz de Usuario (UI)

### Estructura Visual:

```
┌─────────────────────────────────────────┐
│ ← Volver                                │
│ Objetivo                                │
│ Gestiona las metas semanales...         │
├─────────────────────────────────────────┤
│ Metas (Semanales)    [+ Nueva Meta]     │
├─────────────────────────────────────────┤
│ ┌──────────────┐  ┌──────────────┐     │
│ │ Meta 1       │  │ Meta 2       │     │
│ │ Descripción  │  │ Descripción  │     │
│ │ Creada: ...  │  │ Creada: ...  │     │
│ │           [🗑]  │           [🗑]      │
│ └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────┘
```

### Componentes Principales:

1. **Header**: Título y botón "Volver"
2. **Diálogo de Creación**: Formulario para crear nuevas metas
3. **Grid de Metas**: Muestra todas las metas en tarjetas
4. **Tarjeta de Meta**: Cada meta es clickeable y tiene botón de eliminar

---

## 🔄 Flujo de Datos

### Crear una Meta:

```
Usuario escribe datos
        ↓
Validación con Zod
        ↓
Envía al servidor (tRPC)
        ↓
Servidor guarda en BD
        ↓
Recarga lista de metas
        ↓
Cierra diálogo
        ↓
Limpia formulario
```

### Eliminar una Meta:

```
Usuario hace clic en 🗑
        ↓
Envía ID al servidor
        ↓
Servidor elimina de BD
        ↓
Recarga lista de metas
        ↓
Tarjeta desaparece
```

---

## ✅ Lo que Funciona Bien

1. ✅ **Validación robusta**: Zod garantiza datos válidos
2. ✅ **Interfaz intuitiva**: Diálogos modales para crear
3. ✅ **Actualizaciones en tiempo real**: La lista se recarga automáticamente
4. ✅ **Manejo de errores**: Estados de carga y error
5. ✅ **Navegación**: Puedes hacer clic en una meta para ver detalles
6. ✅ **Pesos configurables**: `weightAI` y `weightTrackables` personalizables

---

## 🔧 Lo que Falta Implementar

### 1. **Página de Detalles de Meta** ❌
Cuando haces clic en una meta, debería ir a `/meta/:id` pero esa página no existe aún.

**¿Qué debería mostrar?**
- Nombre y descripción de la meta
- Fechas (inicio y fin)
- **Trackeables del día**: Acciones a seguir
- **Notas diarias**: Reflexiones
- **Botón AIPoint**: Evaluar el día (1-10)
- **Conclusión semanal**: Resumen de la semana
- **Gráfico de progreso**: Mostrar avance

### 2. **Editar Meta** ❌
No hay opción para editar una meta existente. Solo crear y eliminar.

**¿Qué se necesita?**
- Botón de editar (lápiz) en cada tarjeta
- Diálogo similar al de crear, pero pre-rellenado
- Mutación `metas.update` en el backend

### 3. **Visualización de Progreso** ❌
No se muestra el progreso de cada meta (basado en AIPoints y Trackeables).

**¿Qué se necesita?**
- Barra de progreso en cada tarjeta
- Cálculo: `(a × AIPoints + b × Trackeables) / 100`
- Mostrar porcentaje

### 4. **Indicador de Fechas Activas** ❌
No se indica visualmente si una meta está activa, próxima o pasada.

**¿Qué se necesita?**
- Badge con estado: "Activa", "Próxima", "Completada"
- Color según estado (verde, amarillo, gris)

### 5. **Pesos Configurables en UI** ❌
Los pesos `weightAI` y `weightTrackables` están hardcodeados en 0.5.

**¿Qué se necesita?**
- Sliders en el diálogo de creación
- Permitir ajustar los pesos por meta
- Mostrar los valores actuales

---

## 📝 Recomendaciones de Mejora

### Prioridad Alta:
1. Crear página `/meta/:id` con detalles completos
2. Agregar botón de editar meta
3. Mostrar barra de progreso en tarjetas

### Prioridad Media:
4. Indicadores visuales de estado (activa/próxima/completada)
5. Pesos configurables en la UI
6. Mostrar fechas en formato legible

### Prioridad Baja:
7. Animaciones al crear/eliminar
8. Búsqueda y filtrado de metas
9. Exportar metas a CSV

---

## 🎓 Conceptos Clave Aprendidos

| Concepto | Explicación |
|----------|------------|
| **tRPC Query** | Obtiene datos del servidor (lectura) |
| **tRPC Mutation** | Modifica datos en el servidor (crear/editar/eliminar) |
| **React Hook Form** | Gestiona formularios eficientemente |
| **Zod** | Valida datos antes de enviarlos |
| **useParams** | Extrae parámetros de la URL |
| **useState** | Maneja estado local (diálogo abierto/cerrado) |
| **onSuccess callback** | Se ejecuta cuando una mutación tiene éxito |

---

## 💡 Conclusión

La página de metas es el **puente entre objetivos mensuales y acciones diarias**. Aunque funciona bien para crear y listar metas, le faltan características importantes como:

- Página de detalles para ver trackeables y notas
- Visualización de progreso
- Edición de metas existentes
- Indicadores de estado

Estas mejoras harían que la aplicación sea mucho más completa y útil para el tracking diario.
