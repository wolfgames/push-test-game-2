/**
 * Clue Connect — Start Screen View.
 *
 * Adapts the scaffold startView to show Mystery Inc. Mash branding.
 * Emoji fallbacks until asset gen pass produces real artwork.
 * First-launch flag routes to intro cutscene (batch 6).
 */

import type {
  StartScreenDeps,
  StartScreenController,
  SetupStartScreen,
} from '~/game/mygame-contract';
import { readFirstLaunchFlag, writeFirstLaunchComplete } from '~/game/clue-connect/screens/firstLaunchFlag';

export const setupStartScreen: SetupStartScreen = (deps: StartScreenDeps): StartScreenController => {
  let wrapper: HTMLDivElement | null = null;

  return {
    backgroundColor: '#1A0A2E',

    init(container: HTMLDivElement) {
      wrapper = document.createElement('div');
      wrapper.style.cssText =
        'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
        'height:100%;gap:20px;font-family:system-ui,sans-serif;';

      // Title block
      const titleBlock = document.createElement('div');
      titleBlock.style.cssText = 'text-align:center;';

      const logo = document.createElement('div');
      logo.textContent = '🐾 Mystery Inc. Mash';
      logo.style.cssText =
        'font-size:2rem;font-weight:800;color:#FFD700;text-shadow:0 2px 8px rgba(0,0,0,0.6);';

      const subtitle = document.createElement('div');
      subtitle.textContent = 'Clue Connect';
      subtitle.style.cssText =
        'font-size:1.25rem;font-weight:600;color:#C0A0FF;margin-top:4px;';

      const mascot = document.createElement('div');
      mascot.textContent = '🐕';
      mascot.style.cssText = 'font-size:4rem;margin-top:8px;';

      titleBlock.append(logo, subtitle, mascot);

      // Play button
      const playBtn = document.createElement('button');
      playBtn.textContent = '🔍 Investigate!';
      playBtn.style.cssText =
        'font-size:1.25rem;font-weight:700;padding:16px 48px;border:none;border-radius:16px;' +
        'background:linear-gradient(135deg,#FFD700,#FF8C00);color:#1A0A2E;cursor:pointer;' +
        'box-shadow:0 4px 16px rgba(255,215,0,0.4);min-width:180px;min-height:56px;';

      playBtn.addEventListener('click', async () => {
        playBtn.disabled = true;
        playBtn.textContent = 'Loading…';
        try {
          await deps.initGpu();
          deps.unlockAudio();
          await deps.loadCore();
          try { await deps.loadAudio(); } catch { /* audio optional */ }
        } catch (err) {
          console.error('[clue-connect] startup error', err);
        }

        const firstLaunch = readFirstLaunchFlag();
        const isReturning = !firstLaunch;
        deps.analytics.trackGameStart({ start_source: 'play_button', is_returning_player: isReturning });

        if (firstLaunch) {
          // First-time player: mark complete then go to game (intro cutscene wired in Batch 6 full integration)
          writeFirstLaunchComplete();
          deps.goto('game');
        } else {
          deps.goto('game');
        }
      }, { once: true });

      wrapper!.append(titleBlock, playBtn);
      container.append(wrapper!);
    },

    destroy() {
      wrapper?.remove();
      wrapper = null;
    },
  };
};
