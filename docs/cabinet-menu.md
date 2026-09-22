# Cabinet-first game selection

The home page focuses on the arcade cabinet. Step Up opens a game menu on its screen; choose a game by clicking/tapping its card, or use arrow keys and Enter. Four large cards fit each menu page, with page buttons for the other four games. No page scrolling is required.

Escape or Game Select returns an active game to the cabinet menu. Escape from the menu, or Step Back, returns to the full cabinet view. The last selected game and page remain highlighted. Leaving a game unloads its iframe.

The menu remains usable as a flat screen if the 3D renderer or its remote dependencies cannot load. All game routes remain directly available.

Verified in headless Chromium: all eight games launch, Escape unloads the game and restores selection, Step Back restores cabinet focus, arrow keys cross menu pages, and desktop/phone layouts have no page overflow. The same keyboard flow passes with the 3D dependency blocked to exercise the flat-screen fallback.

Readability: the active menu is positioned over the projected cabinet screen in normal CSS pixels, avoiding CSS3D text resampling. Scanlines no longer cover text; labels use brighter colors and larger minimum sizes. Compact menus show game titles without genre labels to prevent crowding.
