# Botón de gasto según la ley de Fitts

## Por qué
Cargar un gasto es la acción más frecuente de Expns, y hoy el botón es chico, está arriba a la derecha y solo aparece en Gastos y en el Dashboard. Se busca que quede a un toque del pulgar desde cualquier pantalla y que la carga también se pueda terminar con el pulgar. Referencia: guía UX de Fitts (secciones 2, 4 y 6) y su CSS base, del que se toman solo las medidas.

## Enfoques considerados
- **A. FAB global "+ Gasto"**: abre el diálogo actual desde cualquier pantalla.
- **B. Barra inferior con + central**: también resuelve la navegación, pero obliga a elegir 4 de 8 pantallas y es un cambio mucho mayor.
- **C. A + diálogo pensado para el pulgar** ← **elegido por el usuario**, para cubrir todo el recorrido abrir → cargar → guardar.

## Diseño
1. **Celular (`esMovil$`)**: botón redondo de 60×60 px, fijo abajo a la derecha, a 16 px del borde y sumando `env(safe-area-inset-bottom)`. Se ve solo con sesión iniciada y fuera del login. Abre `ExpenseFormComponent` igual que hoy. Tiene `aria-label="Nuevo gasto"`.
2. **Escritorio**: botón "+ Nuevo gasto" de ancho completo y 52 px de alto, al principio del menú lateral (borde izquierdo).
3. **Diálogo de gasto** (alta y edición): "Guardar" de ancho completo y 52 px de alto, al fondo. "Cancelar" pasa a ser una X de 48×48 en la esquina superior, junto al título, lejos del pulgar.
4. **Se quitan** los botones "Nuevo gasto" de Gastos y del Dashboard, con su `openAddExpense()`, porque quedarían duplicados.
5. Los colores salen de la paleta Atardecer (accent), no de la del CSS base.

## Fuera de alcance
Barra inferior, teclado numérico propio, atajos de 1 toque, swipe para borrar, cambios en Ingresos y en las acciones de cada fila.

## Riesgos
- El FAB puede tapar contenido al final de las listas. Se agrega `padding-bottom` en `.main-content` solo en el celular.
- Los diálogos de ingreso no cambian, así que su forma va a ser distinta a la del de gasto.
