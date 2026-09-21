# Three.js Cabinet Experiment

An isolated, playable 3D arcade cabinet. Three.js models the cabinet, controls, trim, and printed side art. A CSS3D monitor shares the WebGL camera and world coordinates so the playable screen stays attached when the view changes.

## Run it with Docker

From the repository root:

```sh
docker compose -f experiments/three-arcade/compose.yml up --build -d
```

Open <http://localhost:3100>. An internet connection is currently required to load Three.js and the display fonts from their CDNs.

Check or stop the experiment with:

```sh
docker compose -f experiments/three-arcade/compose.yml ps
docker compose -f experiments/three-arcade/compose.yml down
```

If Bun is installed locally, the server can alternatively be started with `bun run experiments/three-arcade/server.ts`.

Choose a game, then press **Step up & play** or the screen's **Press start** button. The camera moves into the monitor. Press **Escape** or **Back to the arcade** to leave (ending the current game). Drag the machine to look around; **Reset view** restores the original angle. Reduced-motion preferences disable camera animation.

The experiment server adds its own compact monitor stylesheet and input adapter to the existing game pages. Production game files are unchanged. Brick Breaker supports arrow keys and on-screen direction buttons. A WebGL-capable browser and internet access for Three.js/fonts are required.
