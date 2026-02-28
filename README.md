# **Bombardo 💣**

**Bombardo v7.1 — Multiplayer Arcade Game** 🕹️

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Made with JavaScript](https://img.shields.io/badge/Made%20with-JavaScript-F7DF1E.svg?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen.svg)](#)

> [🇪🇸 **Leer en Español**](README.es.md)

## **📝 Project Overview**

Bombardo is a fast-paced **multiplayer arcade game** inspired by the classics. Developed as a **full-stack project**, it features a custom game engine built on **HTML5 Canvas** and a real-time multiplayer server using **WebSockets (Node.js)**.

This project demonstrates the capability to create synchronized, low-latency multiplayer experiences directly in the browser without heavy game engines.

## **🚀 Live Demo**

👉 [**Play Bombardo here**](https://stevemanchado.github.io/BombardoTestPlay/)
*(Note: Ensure the WebSocket server is running)*

## ** How to Play**

* **Game Modes** 🎮:
  * **PvP (Multiplayer)**: Classic battle for 2-4 players. Last one standing wins.
  * **Campaign (Co-op)**: 1-2 players team up to defeat waves of AI Bots.
* **Objective** 🏆:
  * Place bombs to destroy bricks and clear a path.
  * Eliminate other players to be the last one standing!
* **Controls (PC)** ⌨️:
  * **Movement**: `Arrow Keys` or `WASD`.
  * **Action**: `Spacebar` to place a bomb.
* **Controls (Mobile)** 📱:
  * Use the on-screen **D-Pad** and **Action Button**.
* **Power-ups** ⚡:
  * 🔥 **Fire**: Increases explosion range.
  * 💣 **Bomb**: Increases the number of bombs you can place at once.
  * 👟 **Speed**: Makes your character move faster.

## **🛠️ Tech Stack**

* **Frontend**:
  * **HTML5 Canvas**: For high-performance 2D rendering (60 FPS fixed timestep).
  * **Vanilla JavaScript**: Game logic, physics, and state management.
* **Backend**:
  * **Node.js**: Runtime environment for the server.
  * **WebSockets (`ws`)**: For real-time, low-latency communication between players.
* **Architecture**:
  * **Client-Server Relay**: The server acts as a relay to synchronize state between clients.
  * **Lag Smoothing**: Interpolation techniques to ensure smooth movement despite network latency.

## **📂 Repository Contents**

* `index.html` — The game client (logic, rendering, and UI).
* `server.js` — The Node.js WebSocket server.
* `package.json` — Dependencies for the server.
* `sprites.png` — The sprite sheet containing all game assets.
* `README.md` — Project documentation.

## **🖥️ Running Locally**

1.  **Start the Server**:
    ```sh
    npm install
    npm start
    ```
    The server will run on port `8080`.

2.  **Run the Client**:
    *   Open `index.html` in your browser.
    *   Or serve it using a local web server (e.g., Live Server).

3.  **Connect**:
    *   Enter a Room ID (e.g., "TEST") and click **CONNECT**.
    *   Open a second tab to test multiplayer locally!

## **💡 Future Improvements**

* More map themes and dynamic obstacles.
* Team deathmatch mode.
* Account system for persistent stats.

## **📜 License**

This project is licensed under the **MIT License**.
