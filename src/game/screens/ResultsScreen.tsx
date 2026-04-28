import { useScreen } from '~/core/systems/screens';
import { Button } from '~/core/ui/Button';
import { gameState } from '~/game/state';

// ── Results payload shape ─────────────────────────────────────────────

interface WinPayload {
  outcome: 'win';
  banner: string;         // 'Clue collected!'
  stars: number;          // 1–3
  coinsEarned: number;
  totalCoins: number;
  score: number;
}

interface LossPayload {
  outcome: 'loss';
  banner: string;         // 'So close, gang!'
  stars: 0;
  coinsEarned: 0;
  totalCoins: number;
  score: number;
  movesGrantedOnContinue: number;  // Watch Ad mock: +5
}

type ResultsPayload = WinPayload | LossPayload;

// ── ResultsScreen ─────────────────────────────────────────────────────

export function ResultsScreen() {
  const { goto, data } = useScreen();

  // Read payload from screen data (passed by gameController win/loss sequences)
  const payload = () => data() as Partial<ResultsPayload>;
  const isWin = () => payload().outcome === 'win';
  const banner = () => payload().banner ?? (isWin() ? 'Clue collected!' : 'So close, gang!');
  const stars = () => Math.min(3, Math.max(0, (payload().stars as number) ?? 0));
  const coinsEarned = () => (payload().coinsEarned as number) ?? 0;
  const totalCoins = () => (payload().totalCoins as number) ?? 0;
  const score = () => (payload().score as number) ?? gameState.score();

  const nextChapter = () => (payload().nextChapter as number) ?? 1;
  const nextLevel = () => (payload().nextLevel as number) ?? ((payload().level as number ?? 1) + 1);
  const evidenceMeterValue = () => (payload().evidenceMeterValue as number) ?? 0;

  const handleNextLevel = () => {
    gameState.incrementLevel();
    goto('game', {
      chapter: nextChapter(),
      level: nextLevel(),
    });
  };

  const handleTryAgain = () => {
    goto('game', {
      chapter: (payload().chapter as number) ?? 1,
      level: (payload().level as number) ?? 1,
    });
  };

  const handleWatchAd = () => {
    // AD_MOCK: log mock, grant +5 moves, return to game with same board state
    console.log('AD_MOCK');
    goto('game', {
      adMockContinue: true,
      bonusMoves: 5,
      chapter: (payload().chapter as number) ?? 1,
      level: (payload().level as number) ?? 1,
      evidenceMeterValue: evidenceMeterValue(),
    });
  };

  const handleMainMenu = () => {
    goto('start');
  };

  // Star display helper — always renders 3 slots
  const StarSlots = () => (
    <div class="flex gap-2 justify-center mb-4">
      {[1, 2, 3].map((i) => (
        <span
          class="text-3xl"
          style={{ opacity: i <= stars() ? '1' : '0.25', transition: 'opacity 0.2s ease' }}
        >
          ⭐
        </span>
      ))}
    </div>
  );

  return (
    <div class="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-indigo-950 to-black px-6">

      {/* Companion reaction placeholder */}
      <div class="text-6xl mb-4">
        {isWin() ? '🐕' : '😅'}
      </div>

      {/* Banner — never says 'Game Over' */}
      <h1 class="text-2xl font-bold text-white mb-2 text-center">
        {banner()}
      </h1>

      {/* Win path: stars + score + coin tally */}
      {isWin() && (
        <div class="text-center mb-6">
          <StarSlots />
          <p class="text-white/60 text-sm mb-1">Score</p>
          <p class="text-4xl font-bold text-white mb-4">{score()}</p>
          <p class="text-yellow-400 text-base">
            🦴 +{coinsEarned()} Scooby Snacks
          </p>
          <p class="text-white/50 text-sm">
            Total: {totalCoins()} coins
          </p>
        </div>
      )}

      {/* Loss path: score only */}
      {!isWin() && (
        <div class="text-center mb-6">
          <p class="text-white/60 text-sm mb-1">Score</p>
          <p class="text-4xl font-bold text-white mb-2">{score()}</p>
          <p class="text-white/50 text-sm">Evidence meter not filled. Try again!</p>
        </div>
      )}

      {/* Win path buttons */}
      {isWin() && (
        <div class="flex flex-col gap-3 w-full max-w-xs">
          <Button onClick={handleNextLevel}>
            Next Level
          </Button>
          <Button variant="secondary" onClick={handleMainMenu}>
            Chapter Map
          </Button>
        </div>
      )}

      {/* Loss path buttons */}
      {!isWin() && (
        <div class="flex flex-col gap-3 w-full max-w-xs">
          <Button onClick={handleWatchAd}>
            📺 Watch Ad (+5 moves)
          </Button>
          <Button onClick={handleTryAgain}>
            Try Again
          </Button>
          <Button variant="secondary" onClick={handleMainMenu}>
            Main Menu
          </Button>
        </div>
      )}

    </div>
  );
}
