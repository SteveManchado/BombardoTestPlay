# **Bombardo 💣**

**Bombardo v7.1 — Juego Arcade Multijugador** 🕹️

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Made with JavaScript](https://img.shields.io/badge/Made%20with-JavaScript-F7DF1E.svg?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Status](https://img.shields.io/badge/Status-Activo-brightgreen.svg)](#)

> [🇺🇸 **Read in English**](README.md)

## **📝 Descripción del Proyecto**

Bombardo es un **juego arcade multijugador** de ritmo rápido inspirado en los clásicos. Desarrollado como un **proyecto full-stack**, cuenta con un motor de juego personalizado construido sobre **HTML5 Canvas** y un servidor multijugador en tiempo real utilizando **WebSockets (Node.js)**.

Este proyecto demuestra la capacidad de crear experiencias multijugador sincronizadas y de baja latencia directamente en el navegador sin necesidad de motores de juego pesados.

## **🚀 Demo en Vivo**

👉 [**Juega a Bombardo aquí**](https://stevemanchado.github.io/BombardoTestPlay/)
*(Nota: Asegúrate de que el servidor WebSocket esté activo)*

## **👾 Cómo Jugar**

* **Modos de Juego** 🎮:
  * **PvP (Multijugador)**: Batalla clásica de 2-4 jugadores. El último en pie gana.
  * **Campaña (Cooperativo)**: 1-2 jugadores unen fuerzas para derrotar oleadas de IAs (Bots).
* **Objetivo** 🏆:
  * Coloca bombas para destruir ladrillos y abrirte camino.
  * ¡Elimina a otros jugadores para ser el último en pie!
* **Controles (PC)** ⌨️:
  * **Movimiento**: `Flechas` o `WASD`.
  * **Acción**: `Barra Espaciadora` para colocar una bomba.
* **Controles (Móvil)** 📱:
  * Usa el **D-Pad** y el **Botón de Acción** en pantalla.
* **Power-ups** ⚡:
  * 🔥 **Fuego**: Aumenta el alcance de la explosión.
  * 💣 **Bomba**: Aumenta la cantidad de bombas que puedes colocar a la vez.
  * 👟 **Velocidad**: Hace que tu personaje se mueva más rápido.

## **🛠️ Stack Tecnológico**

* **Frontend**:
  * **HTML5 Canvas**: Para renderizado 2D de alto rendimiento (timestep fijo de 60 FPS).
  * **Vanilla JavaScript**: Lógica del juego, física y gestión de estado.
* **Backend**:
  * **Node.js**: Entorno de ejecución para el servidor.
  * **WebSockets (`ws`)**: Para comunicación en tiempo real y baja latencia entre jugadores.
* **Arquitectura**:
  * **Cliente-Servidor Relay**: El servidor actúa como un repetidor para sincronizar el estado entre clientes.
  * **Suavizado de Lag**: Técnicas de interpolación para asegurar movimiento fluido a pesar de la latencia de red.

## **📂 Contenido del Repositorio**

* `index.html` — Punto de entrada del cliente (estructura HTML).
* `game.js` — Lógica del juego, renderizado y gestión de red.
* `style.css` — Hoja de estilos para la interfaz y el juego.
* `server.js` — El servidor WebSocket en Node.js.
* `package.json` — Dependencias del servidor.
* `sprites.png` — La hoja de sprites que contiene todos los recursos gráficos.
* `README.md` — Documentación del proyecto.

## **🖥️ Ejecutar Localmente**

1.  **Iniciar el Servidor**:
    ```sh
    npm install
    npm start
    ```
    El servidor correrá en el puerto `8080`.

2.  **Ejecutar el Cliente**:
    *   Abre `index.html` en tu navegador.
    *   O sírvelo usando un servidor web local (ej. Live Server).

3.  **Conectar**:
    *   Ingresa un ID de Sala (ej. "TEST") y haz clic en **CONECTAR**.
    *   ¡Abre una segunda pestaña para probar el multijugador localmente!

## **💡 Mejoras Futuras**

*   Más temas de mapas y obstáculos dinámicos.
*   Modo duelo por equipos.
*   Sistema de cuentas para estadísticas persistentes.

## **📜 Licencia**

Este proyecto está bajo la **Licencia MIT**.