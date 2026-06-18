import type { Metadata } from 'next';

type Difficulty = 'Easy' | 'Normal' | 'Hard';
type Phase = 'Main 1' | 'Battle' | 'End';
type LessonKind = 'lethal-line' | 'board-break';

type TrainerCard = {
  id: string;
  name: string;
  frame: 'monster' | 'spell' | 'trap' | 'link' | 'xyz' | 'synchro' | 'fusion' | 'pendulum';
  glyph: string;
  atk: number;
  text: string;
};

type Threat = TrainerCard & {
  protectedBy?: string;
  mustAnswer?: boolean;
};

type Interruption = {
  id: string;
  name: string;
  visible: boolean;
  baitable: boolean;
  spent: boolean;
  text: string;
};

type LegalAction = {
  code: string;
  label: string;
  phase: Phase;
  sourceId?: string;
  targetKinds: string[];
  teaches: string;
};

type Scenario = {
  id: string;
  kind: LessonKind;
  difficulty: Difficulty;
  playerLP: number;
  opponentLP: number;
  currentPhase: Phase;
  hand: TrainerCard[];
  field: TrainerCard[];
  graveyard: TrainerCard[];
  opponentField: Threat[];
  knownInterruptions: Interruption[];
  legalActions: LegalAction[];
  solutionLines: string[][];
  prompt: string;
};

type Lesson = {
  title: string;
  chapter: string;
  objective: string;
  scenario: Scenario;
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://duel-trainer.app'),
  title: 'Yu-Gi-Oh!-Inspired Mini-Duel Trainer | Board-Break & Lethal Practice Game',
  description: 'A fan-made Yu-Gi-Oh!-style mini-duel trainer for returning players. Practice compact board-break and lethal-line scenarios with guided phases, chain prompts, and original training cards only.',
  openGraph: {
    title: 'Yu-Gi-Oh!-Inspired Mini-Duel Trainer | Board-Break & Lethal Practice Game',
    description: 'Practice board breaks, lethal lines, guided chains, and phase sequencing with original training cards only.',
    siteName: 'Duel Trainer',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yu-Gi-Oh!-Inspired Mini-Duel Trainer',
    description: 'Practice board-break and lethal-line scenarios with guided phases and chain prompts using original training cards.'
  }
};

const card = (id: string, name: string, frame: TrainerCard['frame'], glyph: string, atk: number, text: string): TrainerCard => ({ id, name, frame, glyph, atk, text });
const threat = (id: string, name: string, frame: Threat['frame'], glyph: string, atk: number, text: string, protectedBy?: string, mustAnswer = false): Threat => ({ id, name, frame, glyph, atk, text, protectedBy, mustAnswer });
const action = (code: string, label: string, phase: Phase, sourceId: string | undefined, targetKinds: string[], teaches: string): LegalAction => ({ code, label, phase, sourceId, targetKinds, teaches });

const cards = {
  rookie: card('rookie', 'Azure Rookie', 'monster', 'DR', 1900, 'Normal Summon starter and reliable lethal attacker.'),
  lancer: card('lancer', 'Lantern Lancer', 'monster', 'LC', 1700, 'Normal Summon that teaches attacking over blockers.'),
  familiar: card('familiar', 'Link Spark Familiar', 'link', 'LK', 1500, 'Special Summon if you control a monster.'),
  courier: card('courier', 'Quickstep Courier', 'synchro', 'QS', 1400, 'Special Summon after a Spell resolves.'),
  breaker: card('breaker', 'Starfall Board Breaker', 'spell', 'SF', 0, 'Destroy all unprotected face-up training threats.'),
  bolt: card('bolt', 'Dawnbolt Tactic', 'spell', 'DB', 0, 'Destroy one selected unprotected monster.'),
  signal: card('signal', 'Twin Signal Quick-Play', 'spell', 'TS', 0, 'Low-value activation that can bait a known response.'),
  whisper: card('whisper', 'Chain Whisper', 'trap', 'CW', 0, 'A safe chain prompt that invites a negate.'),
  limit: card('limit', 'Limit Lesson', 'spell', 'LL', 0, 'Target your strongest monster; it gains 1000 ATK this turn.'),
  charge: card('charge', 'Battle Charge Drill', 'spell', 'BC', 0, 'Target a monster; it gains 700 ATK for this Battle Phase.'),
  grid: card('grid', 'Academy Field Grid', 'pendulum', 'FG', 0, 'Field Spell that turns off protection on boss threats.')
};

const lessons: Lesson[] = [
  {
    title: 'Lesson 1: Count the Open Lane',
    chapter: 'Return to the Field',
    objective: 'Build two attackers, boost the largest body, enter Battle Phase, and deal lethal through an empty board.',
    scenario: {
      id: 's01-open-lane', kind: 'lethal-line', difficulty: 'Easy', playerLP: 8000, opponentLP: 4300, currentPhase: 'Main 1',
      hand: [{ ...cards.rookie }, { ...cards.familiar }, { ...cards.limit }], field: [], graveyard: [], opponentField: [], knownInterruptions: [],
      legalActions: [
        action('summon:rookie', 'Normal Summon Azure Rookie', 'Main 1', 'rookie', [], 'Commit the normal summon before extension.'),
        action('special:familiar', 'Special Summon Link Spark Familiar', 'Main 1', 'familiar', ['your-field'], 'Extend only after a monster exists.'),
        action('boost:limit', 'Activate Limit Lesson targeting the highest ATK monster', 'Main 1', 'limit', ['your-monster'], 'Boost before battle to confirm lethal.'),
        action('phase:Battle', 'Move to Battle Phase', 'Main 1', undefined, [], 'Phase sequencing matters.'),
        action('attack:rookie:direct', 'Attack directly with Azure Rookie', 'Battle', undefined, ['opponent-lp'], 'Add all available damage.'),
        action('attack:familiar:direct', 'Attack directly with Familiar', 'Battle', undefined, ['opponent-lp'], 'Use the last attacker.')
      ],
      solutionLines: [['summon:rookie', 'special:familiar', 'boost:limit', 'phase:Battle', 'attack:rookie:direct', 'attack:familiar:direct']],
      prompt: 'No interruptions are present. Practice lethal arithmetic and phase discipline.'
    }
  },
  {
    title: 'Lesson 2: Bait the Visible Negate',
    chapter: 'Chain School',
    objective: 'Spend the opponent interruption on a low-value card, then resolve your board breaker.',
    scenario: {
      id: 's02-bait-negate', kind: 'board-break', difficulty: 'Normal', playerLP: 8000, opponentLP: 4200, currentPhase: 'Main 1',
      hand: [{ ...cards.signal }, { ...cards.breaker }, { ...cards.rookie }, { ...cards.familiar }], field: [], graveyard: [],
      opponentField: [threat('guard', 'Training Guard', 'monster', 'TG', 1700, 'A simple defender. Clear it before direct attacks.', undefined, true)],
      knownInterruptions: [{ id: 'i-negate', name: 'Sentinel Negate', visible: true, baitable: true, spent: false, text: 'Negates the first important Spell activation unless baited.' }],
      legalActions: [
        action('bait:signal:i-negate', 'Activate Twin Signal into Sentinel Negate', 'Main 1', 'signal', ['interruption'], 'Make the opponent spend interaction before your key card.'),
        action('breaker:breaker:all', 'Resolve Starfall Board Breaker', 'Main 1', 'breaker', ['opponent-field'], 'Resolve board removal after the chain is safe.'),
        action('summon:rookie', 'Normal Summon Azure Rookie', 'Main 1', 'rookie', [], 'Commit damage after clearing.'),
        action('special:familiar', 'Special Summon Familiar', 'Main 1', 'familiar', ['your-field'], 'Create lethal attackers.'),
        action('phase:Battle', 'Move to Battle Phase', 'Main 1', undefined, [], 'Finish only after the board is clear.'),
        action('attack:rookie:direct', 'Attack directly with Azure Rookie', 'Battle', undefined, ['opponent-lp'], 'Count damage.'),
        action('attack:familiar:direct', 'Attack directly with Familiar', 'Battle', undefined, ['opponent-lp'], 'Close lethal.')
      ],
      solutionLines: [['bait:signal:i-negate', 'breaker:breaker:all', 'summon:rookie', 'special:familiar', 'phase:Battle', 'attack:rookie:direct', 'attack:familiar:direct']],
      prompt: 'A visible negate is live. If Starfall is activated before baiting, it will be negated.'
    }
  },
  {
    title: 'Lesson 3: Protected Boss Monster',
    chapter: 'Board Break Lab',
    objective: 'Turn off protection with the Field Grid, then destroy the boss and find lethal.',
    scenario: {
      id: 's03-protected-boss', kind: 'board-break', difficulty: 'Hard', playerLP: 6400, opponentLP: 5200, currentPhase: 'Main 1',
      hand: [{ ...cards.grid }, { ...cards.breaker }, { ...cards.rookie }, { ...cards.familiar }, { ...cards.limit }], field: [], graveyard: [],
      opponentField: [threat('boss', 'Protected Boss Sigil', 'xyz', 'BS', 2600, 'Cannot be destroyed while Academy Lock is active.', 'lock', true)],
      knownInterruptions: [{ id: 'lock', name: 'Academy Lock', visible: true, baitable: false, spent: false, text: 'Protects the boss until Academy Field Grid is active.' }],
      legalActions: [
        action('field:grid', 'Activate Academy Field Grid', 'Main 1', 'grid', ['field-zone'], 'Remove protection before removal.'),
        action('breaker:breaker:all', 'Starfall destroys the unprotected boss', 'Main 1', 'breaker', ['opponent-field'], 'Protected threats demand setup.'),
        action('summon:rookie', 'Normal Summon Azure Rookie', 'Main 1', 'rookie', [], 'Build attackers.'),
        action('special:familiar', 'Special Summon Familiar', 'Main 1', 'familiar', ['your-field'], 'Add damage.'),
        action('boost:limit', 'Activate Limit Lesson', 'Main 1', 'limit', ['your-monster'], 'Boost the best attacker.'),
        action('phase:Battle', 'Move to Battle Phase', 'Main 1', undefined, [], 'Confirm clear board.'),
        action('attack:rookie:direct', 'Attack directly with Azure Rookie', 'Battle', undefined, ['opponent-lp'], 'Push lethal.'),
        action('attack:familiar:direct', 'Attack directly with Familiar', 'Battle', undefined, ['opponent-lp'], 'Finish.')
      ],
      solutionLines: [['field:grid', 'breaker:breaker:all', 'summon:rookie', 'special:familiar', 'boost:limit', 'phase:Battle', 'attack:rookie:direct', 'attack:familiar:direct']],
      prompt: 'Starfall cannot destroy the boss while Academy Lock is protecting it.'
    }
  },
  {
    title: 'Lesson 4: Attack Over Then Direct',
    chapter: 'Return to the Field',
    objective: 'Remove the defender by battle, preserve enough direct damage, and do not skip Battle Phase.',
    scenario: {
      id: 's04-battle-order', kind: 'lethal-line', difficulty: 'Easy', playerLP: 7800, opponentLP: 3300, currentPhase: 'Main 1',
      hand: [{ ...cards.rookie }, { ...cards.familiar }, { ...cards.charge }], field: [], graveyard: [],
      opponentField: [threat('guard', 'Training Guard', 'monster', 'TG', 1500, 'Clear it or attack over it before counting direct damage.', undefined, true)], knownInterruptions: [],
      legalActions: [
        action('summon:rookie', 'Normal Summon Azure Rookie', 'Main 1', 'rookie', [], 'Start with a body.'),
        action('special:familiar', 'Special Summon Familiar', 'Main 1', 'familiar', ['your-field'], 'Create a second attacker.'),
        action('boost:charge', 'Use Battle Charge Drill', 'Main 1', 'charge', ['your-monster'], 'Damage math can change combat order.'),
        action('phase:Battle', 'Move to Battle Phase', 'Main 1', undefined, [], 'Enter battle after setup.'),
        action('attack:rookie:guard', 'Attack Training Guard first', 'Battle', undefined, ['opponent-monster'], 'Clear blockers before direct attacks.'),
        action('attack:familiar:direct', 'Attack directly with Familiar', 'Battle', undefined, ['opponent-lp'], 'Finish with the remaining attacker.')
      ],
      solutionLines: [['summon:rookie', 'special:familiar', 'boost:charge', 'phase:Battle', 'attack:rookie:guard', 'attack:familiar:direct']],
      prompt: 'The guard is weaker than your boosted normal summon. Choose the attack order that keeps lethal online.'
    }
  }
];

const trainerScript = `
(function () {
  var root = document.getElementById('duel-trainer-root');
  if (!root) return;
  var lessons = JSON.parse(root.getAttribute('data-lessons') || '[]');
  var state = { index: 0, started: false, solved: false, failed: false, scoreSubmitted: false, phase: 'Main 1', hand: [], field: [], graveyard: [], opponentField: [], interruptions: [], line: [], chain: [], attempts: 0, hintsUsed: 0, startTime: 0, message: 'Pick a scenario, then press Start duel.', protectionOff: false };
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function lesson() { return lessons[state.index]; }
  function scenario() { return lesson().scenario; }
  function elapsed() { return state.startTime ? Date.now() - state.startTime : 0; }
  function track(name, extra) {
    var sc = scenario();
    var payload = Object.assign({ event: name, scenarioId: sc.id, difficulty: sc.difficulty, chapter: lesson().chapter, attempts: state.attempts, hintsUsed: state.hintsUsed, elapsedMs: elapsed(), lessonKind: sc.kind, occurredAt: new Date().toISOString() }, extra || {});
    var body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      var blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon('/api/events', blob)) return;
    }
    fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true }).catch(function () {});
  }
  function reset(index) {
    state.index = index;
    var sc = scenario();
    state.started = false; state.solved = false; state.failed = false; state.scoreSubmitted = false; state.phase = sc.currentPhase;
    state.hand = clone(sc.hand); state.field = clone(sc.field); state.graveyard = clone(sc.graveyard); state.opponentField = clone(sc.opponentField); state.interruptions = clone(sc.knownInterruptions);
    state.line = []; state.chain = []; state.attempts = 0; state.hintsUsed = 0; state.startTime = 0; state.protectionOff = false; state.message = sc.prompt;
    render();
  }
  function start() { state.started = true; state.startTime = Date.now(); state.message = 'Scenario started. Choose the first legal action.'; track('scenario_start'); render(); }
  function isPrefix() { return scenario().solutionLines.some(function (line) { return state.line.every(function (step, index) { return line[index] === step; }); }); }
  function isSolved() { return scenario().solutionLines.some(function (line) { return line.length === state.line.length && line.every(function (step, index) { return state.line[index] === step; }); }); }
  function moveFromHand(id, destination) { var i = state.hand.findIndex(function (c) { return c.id === id; }); if (i >= 0) { var c = state.hand.splice(i, 1)[0]; destination.push(c); return c; } return null; }
  function firstMonster() { return state.field.find(function (c) { return c.atk > 0; }); }
  function spendInterruption(id) { var found = state.interruptions.find(function (i) { return i.id === id; }); if (found) found.spent = true; }
  function apply(code) {
    var parts = code.split(':');
    if (parts[0] === 'summon' || parts[0] === 'special') moveFromHand(parts[1], state.field);
    if (parts[0] === 'boost') { var boosted = firstMonster(); if (boosted) boosted.atk += parts[1] === 'charge' ? 700 : 1000; moveFromHand(parts[1], state.graveyard); }
    if (parts[0] === 'field') { state.protectionOff = true; moveFromHand(parts[1], state.graveyard); state.interruptions.forEach(function (i) { if (i.id === 'lock') i.spent = true; }); }
    if (parts[0] === 'bait') { moveFromHand(parts[1], state.graveyard); spendInterruption(parts[2]); state.chain = ['CL1 ' + parts[1], 'CL2 response spent']; }
    if (parts[0] === 'breaker') { moveFromHand(parts[1], state.graveyard); if (parts[2] === 'all') state.opponentField = state.opponentField.filter(function (t) { return t.protectedBy && !state.protectionOff; }); else state.opponentField = state.opponentField.filter(function (t) { return t.id !== parts[2]; }); }
    if (parts[0] === 'phase') state.phase = parts[1];
    if (parts[0] === 'attack') { var attacker = state.field.find(function (c) { return c.id === parts[1]; }); if (parts[2] === 'direct' && attacker) scenario().opponentLP = Math.max(0, scenario().opponentLP - attacker.atk); if (parts[2] !== 'direct') state.opponentField = state.opponentField.filter(function (t) { return t.id !== parts[2]; }); }
  }
  function attempt(code) {
    if (!state.started || state.solved || state.failed) return;
    var action = scenario().legalActions.find(function (a) { return a.code === code; });
    state.attempts += 1;
    track('action_attempt', { action: code, phase: state.phase });
    if (code.indexOf('bait:') === 0) track('chain_prompt_opened', { action: code });
    state.line.push(code); apply(code);
    if (!isPrefix()) { state.failed = true; state.message = 'Line failed: that action breaks the deterministic solution check. Reset or try another scenario.'; track('scenario_fail', { action: code }); }
    else if (isSolved()) { state.solved = true; state.message = 'Scenario solved. Submit your optional score or replay for a cleaner line.'; track('scenario_success'); }
    else { state.message = action ? action.teaches : 'Continue the line.'; }
    render();
  }
  function hint() {
    if (!state.started || state.solved) return;
    state.hintsUsed += 1;
    var options = scenario().solutionLines.map(function (line) { return line[state.line.length]; }).filter(Boolean).filter(function (value, index, arr) { return arr.indexOf(value) === index; });
    state.message = 'Hint: next accepted action is ' + options.join(' or ') + '.';
    track('hint_used', { nextActions: options });
    render();
  }
  function submitScore() { if (!state.solved || state.scoreSubmitted) return; state.scoreSubmitted = true; track('score_submit', { solvedLine: state.line.join(' > ') }); state.message = 'Score submitted with keepalive tracking. Leaderboard is optional; no account required.'; render(); }
  function draw() {
    var canvas = document.getElementById('duel-canvas'); if (!canvas) return;
    var ctx = canvas.getContext('2d'); if (!ctx) return;
    var ratio = window.devicePixelRatio || 1; var w = canvas.clientWidth; var h = 430; canvas.width = w * ratio; canvas.height = h * ratio; ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    var g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#0f1f4d'); g.addColorStop(0.55, '#111827'); g.addColorStop(1, '#1e3a8a'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(250,204,21,.7)'; ctx.lineWidth = 2; ctx.strokeRect(14, 14, w - 28, h - 28);
    ctx.fillStyle = '#dbeafe'; ctx.font = '700 16px system-ui'; ctx.fillText('Opponent LP ' + scenario().opponentLP, 24, 38); ctx.fillText('Player LP ' + scenario().playerLP, 24, h - 24); ctx.fillStyle = '#facc15'; ctx.fillText('Phase: ' + state.phase, w - 150, 38);
    function zone(x, y, label) { ctx.fillStyle = 'rgba(15,23,42,.74)'; ctx.strokeStyle = 'rgba(219,234,254,.35)'; ctx.beginPath(); ctx.roundRect(x, y, 86, 116, 12); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(203,213,225,.6)'; ctx.font = '11px system-ui'; ctx.fillText(label, x + 12, y + 104); }
    function drawCard(c, x, y, mine) { zone(x, y, c.frame); ctx.fillStyle = mine ? '#dbeafe' : '#fecaca'; ctx.font = '700 20px system-ui'; ctx.fillText(c.glyph, x + 28, y + 38); ctx.fillStyle = '#f8fafc'; ctx.font = '12px system-ui'; ctx.fillText(c.name.slice(0, 12), x + 8, y + 62); ctx.fillStyle = '#facc15'; ctx.fillText(String(c.atk), x + 27, y + 84); }
    state.opponentField.forEach(function (c, i) { drawCard(c, 120 + i * 104, 70, false); });
    state.field.forEach(function (c, i) { drawCard(c, 120 + i * 104, 246, true); });
    state.hand.forEach(function (c, i) { drawCard(c, Math.min(120 + i * 76, w - 94), 330, true); });
    if (state.chain.length) { ctx.strokeStyle = '#facc15'; ctx.beginPath(); ctx.moveTo(w - 90, 210); ctx.lineTo(w - 190, 130); ctx.stroke(); ctx.fillStyle = '#facc15'; ctx.fillText('Chain links: ' + state.chain.length, w - 190, 118); }
  }
  function render() {
    var sc = scenario();
    root.innerHTML = '<div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]"><section class="rounded-3xl border border-blue-200/20 bg-slate-950/80 p-3 shadow-2xl"><canvas id="duel-canvas" class="h-[430px] w-full rounded-2xl bg-slate-950" aria-label="Canvas-rendered duel arena with zones, cards, life points, phase, and chain feedback"></canvas></section><aside class="space-y-4 rounded-3xl border border-blue-200/20 bg-slate-900/90 p-5 text-slate-100"><div><p class="text-xs uppercase tracking-[.24em] text-yellow-300">' + sc.difficulty + ' • ' + sc.kind + '</p><h2 class="mt-1 text-2xl font-black">' + lesson().title + '</h2><p class="mt-2 text-sm text-slate-300">' + lesson().objective + '</p></div><div class="rounded-2xl bg-blue-950/50 p-3 text-sm text-blue-100">' + state.message + '</div><div id="lesson-list" class="grid grid-cols-2 gap-2"></div><div class="flex flex-wrap gap-2"><button id="start-duel" class="rounded-full bg-yellow-300 px-4 py-2 text-sm font-bold text-slate-950">Start duel</button><button id="hint-duel" class="rounded-full border border-yellow-300/60 px-4 py-2 text-sm font-bold text-yellow-100">Use hint</button><button id="reset-duel" class="rounded-full border border-blue-200/30 px-4 py-2 text-sm font-bold text-blue-100">Reset</button></div><div id="actions" class="space-y-2"></div><button id="score-duel" class="hidden w-full rounded-full bg-blue-200 px-4 py-2 font-black text-blue-950">Submit optional leaderboard score</button><dl class="grid grid-cols-3 gap-2 text-center text-xs"><div class="rounded-xl bg-slate-950/70 p-2"><dt class="text-slate-400">Attempts</dt><dd class="text-lg font-black">' + state.attempts + '</dd></div><div class="rounded-xl bg-slate-950/70 p-2"><dt class="text-slate-400">Hints</dt><dd class="text-lg font-black">' + state.hintsUsed + '</dd></div><div class="rounded-xl bg-slate-950/70 p-2"><dt class="text-slate-400">Elapsed</dt><dd class="text-lg font-black">' + Math.round(elapsed() / 1000) + 's</dd></div></dl></aside></div>';
    var list = document.getElementById('lesson-list'); lessons.forEach(function (l, i) { var b = document.createElement('button'); b.className = 'rounded-xl border border-blue-200/20 px-3 py-2 text-left text-xs ' + (i === state.index ? 'bg-blue-200 text-blue-950' : 'bg-slate-950/60 text-blue-100'); b.textContent = l.title.replace('Lesson ', 'L'); b.onclick = function () { reset(i); }; list.appendChild(b); });
    document.getElementById('start-duel').onclick = start; document.getElementById('hint-duel').onclick = hint; document.getElementById('reset-duel').onclick = function () { reset(state.index); };
    var actions = document.getElementById('actions'); sc.legalActions.forEach(function (a) { var b = document.createElement('button'); b.className = 'block w-full rounded-2xl border border-slate-600 bg-slate-950/70 px-4 py-3 text-left text-sm font-semibold text-slate-100 hover:border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-300'; b.textContent = a.label; b.disabled = !state.started || state.solved || state.failed; b.onclick = function () { attempt(a.code); }; actions.appendChild(b); });
    var score = document.getElementById('score-duel'); if (state.solved) score.classList.remove('hidden'); score.onclick = submitScore;
    setTimeout(draw, 0);
  }
  window.addEventListener('resize', draw);
  reset(0);
})();
`;

export default function Page() {
  return (
    <main className='min-h-screen bg-slate-950 text-slate-50'>
      <section className='mx-auto grid max-w-7xl gap-10 px-6 pb-12 pt-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:px-8'>
        <div>
          <p className='mb-4 inline-flex rounded-full border border-yellow-300/50 bg-yellow-300/10 px-4 py-2 text-sm font-bold text-yellow-200'>Free fan-made trainer • no account required • optional leaderboard</p>
          <h1 className='max-w-4xl text-4xl font-black tracking-tight sm:text-6xl'>Practice Yu-Gi-Oh!-inspired board breaks and lethal lines in bite-size mini-duels.</h1>
          <p className='mt-6 max-w-2xl text-lg leading-8 text-slate-300'>A guided canvas arena teaches returning players when to start a scenario, bait chain responses, use hints, progress phases, and validate board-break or lethal-line solutions with original training cards only.</p>
          <div className='mt-8 flex flex-wrap gap-3'>
            <a href='#trainer' className='rounded-full bg-yellow-300 px-6 py-3 font-black text-slate-950 shadow-lg shadow-yellow-300/20'>Start free scenario</a>
            <a href='#support' className='rounded-full border border-blue-200/30 px-6 py-3 font-bold text-blue-100'>Support / roadmap</a>
          </div>
          <p className='mt-5 max-w-3xl rounded-2xl border border-blue-200/20 bg-blue-950/40 p-4 text-sm leading-6 text-blue-100'>Fan-made training tool. Not affiliated with, endorsed by, or sponsored by Konami, Yu-Gi-Oh!, Master Duel, or any rights holders. Uses original training cards and scenarios only.</p>
        </div>
        <aside className='rounded-3xl border border-blue-200/20 bg-slate-900/80 p-6 shadow-2xl'>
          <p className='text-sm font-bold uppercase tracking-[.24em] text-yellow-300'>What is tracked</p>
          <ul className='mt-4 space-y-3 text-sm text-slate-300'>
            <li>scenario_start, action_attempt, chain_prompt_opened, hint_used</li>
            <li>scenario_success, scenario_fail, score_submit</li>
            <li>Scenario id, difficulty, chapter, attempts, hints, elapsed time</li>
          </ul>
        </aside>
      </section>

      <section id='trainer' className='mx-auto max-w-7xl px-6 py-10 lg:px-8'>
        <div id='duel-trainer-root' data-lessons={JSON.stringify(lessons)} />
      </section>

      <section id='support' className='mx-auto grid max-w-7xl gap-6 px-6 py-12 lg:grid-cols-3 lg:px-8'>
        <div className='rounded-3xl border border-blue-200/20 bg-slate-900/80 p-6 lg:col-span-2'>
          <h2 className='text-2xl font-black'>Support / roadmap</h2>
          <p className='mt-3 text-slate-300'>The trainer is free at launch, ad-free, and playable without an account. Sustainability comes from optional tips, public roadmap voting, and future clearly labeled scenario-pack sponsorships that will never lock the starter lessons or original-card disclaimer.</p>
        </div>
        <div className='rounded-3xl border border-yellow-300/30 bg-yellow-300/10 p-6'>
          <h3 className='font-black text-yellow-200'>Next packs</h3>
          <p className='mt-3 text-sm text-slate-300'>More returning-player drills: chain-link ordering, protected boards, battle math, and lethal validation.</p>
        </div>
      </section>

      <footer className='border-t border-blue-200/10 px-6 py-8 text-center text-sm text-slate-400'>
        Fan-made training tool. Not affiliated with, endorsed by, or sponsored by Konami, Yu-Gi-Oh!, Master Duel, or any rights holders. Uses original training cards and scenarios only.
      </footer>
      <script dangerouslySetInnerHTML={{ __html: trainerScript }} />
    </main>
  );
}
