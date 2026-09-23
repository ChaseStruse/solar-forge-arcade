# Solar Tennis and Solar Pool

Two browser-local Canvas games using the arcade's pixel-art cabinet, mint/coral palette, and Solar Forge branding.

## Solar Tennis

A quick singles match against Nova, first to seven points. Move with arrows/WASD or drag on the court; nearby balls return automatically. Space serves or readies a brief power-shot window. Direct shots left/right with movement. Touch controls offer movement and the same action. A second bounce, out ball, or net fault awards the point. Serves alternate. Nova aims for the open side of the court with bounded placement error; it does not redirect shots in flight.

## Solar Pool

A solo eight-ball challenge: pocket seven colored balls, then the black 8-ball, within 20 shots. Aim with the pointer or left/right arrows. Hold and release Space, the shoot button, or the table pointer to control power. A guide shows the first contact and a longer object-ball path; a pink path warns of an early 8-ball shot. A clean color pot returns one shot, capped at 20. Scratching costs an extra shot and safely respots the cue ball. Pocketing the 8-ball early, or scratching on the winning shot, loses the rack.

Both games include pause/resume, restart after a result, optional synthesized sound, and automatic pause when focus is lost. Physics live in separate modules so scoring, collisions, and match flow can be tested without a browser.

## Verification

Built-in Node tests cover tennis serves, automatic returns, timed power shots, net/out/double-bounce scoring, AI serves, and complete matches. Pool checks cover rack construction, collisions, cushions, aiming guides, settling, scratches, cue respotting, early/final 8-ball rules, and shot exhaustion.

Chromium checks covered both standalone and embedded views, starting, serving/shooting, pause/resume, canceled charges, pointer and touch shooting, mobile layouts, and selection from the eight-game cabinet. A simulated legal pool rack cleared in eight shots, including the break. All assets are drawn locally; neither game needs an image or physics dependency.
