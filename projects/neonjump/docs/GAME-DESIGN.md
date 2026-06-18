# NeonJump — Game Design

**Género:** Plataformas arcade vertical

Saltá sin parar por una torre de plataformas neón, envolviéndote por los bordes de la pantalla, juntando monedas y usando impulsos mientras esquivás bichos eléctricos, agujeros negros y plataformas traicioneras. El objetivo es llegar a la Cima Neón antes de caer.

## Modelo y retención
Gratis; éxito medido por partidas por usuario, retorno diario/semanal y envíos al ranking. Retention loop: jugar → mejorar puntuación → publicar ranking → compartir/volver a intentar. Si se planifica monetización más adelante, los caminos candidatos son sponsorships, desbloqueos solo cosméticos o rewarded ads no intrusivos.

## Mecánicas
- El personaje salta automáticamente al tocar una plataforma; el jugador solo controla el movimiento horizontal.
- La cámara sube cuando el jugador supera la mitad de la pantalla; caer por debajo del borde inferior termina la partida.
- Movimiento con wrap horizontal: si salís por la izquierda aparecés por la derecha, y viceversa.
- Puntuación principal por altura alcanzada en metros; las monedas y enemigos evitados suman bonificación.
- Plataformas procedurales por tramos: al inicio son anchas y estáticas; luego aparecen más separadas, móviles, frágiles y falsas.
- Monedas colocadas en rutas de riesgo recompensan saltos laterales difíciles.
- Power-ups temporales: resorte para súper salto, gorra hélice para ascenso controlado, jetpack para empuje vertical y escudo para ignorar un golpe.
- Enemigos flotantes patrullan horizontalmente; tocarlos sin escudo termina la partida.
- Agujeros negros son obstáculos letales fijos que fuerzan rutas alternativas.
- Cada 500 m aumenta la velocidad de scroll, baja la frecuencia de plataformas seguras y sube la presencia de enemigos.
- Pausa con opciones: Continuar, Reiniciar, Menú, Sonido.
- Partida corta y rejugable: ganar requiere alcanzar una altura objetivo según dificultad; después se puede seguir en 'Modo Récord' hasta caer.

## Controles
- Teclado: Flechas izquierda/derecha o A/D para moverte. Espacio o P para pausar. Enter para iniciar, confirmar o reintentar.
- Táctil: Tocá y mantené el lado izquierdo o derecho de la pantalla para moverte. Tocá el botón de pausa. En menús, tocá los botones.

## Entidades
- [object Object]
- [object Object]
- [object Object]
- [object Object]
- [object Object]
- [object Object]
- [object Object]
- [object Object]
- [object Object]
- [object Object]
- [object Object]
- [object Object]
- [object Object]
- [object Object]

## Dificultad y niveles
[object Object]

Dificultades: Fácil, Normal, Difícil

## Puntaje
[object Object]

## Victoria / derrota
[object Object]

## Arte
[object Object]

## Highscores
Tabla `scores` + `GET/POST /api/scores` (leaderboard top-10 público).
