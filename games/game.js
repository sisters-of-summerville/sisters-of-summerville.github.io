(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const arcadeScreen = $("arcadeScreen");
  const playScreen = $("playScreen");
  const gameGrid = $("gameGrid");
  const stage = $("gameStage");
  const world = $("world");
  const backgroundLayer = $("backgroundLayer");
  const instructionOverlay = $("instructionOverlay");
  const roundOverlay = $("roundOverlay");
  const pauseOverlay = $("pauseOverlay");
  const resultOverlay = $("resultOverlay");
  const coach = $("coach");
  const coachBubble = $("coachBubble");
  const coachImage = $("coachImage");
  const announcement = $("announcement");

  const games = [
    {
      id: "roomba", title: "Roomba Rodeo", kicker: "Three-Round Challenge",
      description: "Round up moving dust bunnies, dodge hazards, build combos and survive all three rooms.",
      background: "assets/living-room.webp", character: "assets/honey-roomba.webp",
      instructions: "Drag anywhere to steer Honey Bear. Gather every dust bunny, grab clocks for extra time, and avoid household hazards. Each round gets faster and more crowded.",
      rewards: ["3 escalating rounds", "Combo multipliers", "Golden bunny bonuses"], button: "Saddle Up"
    },
    {
      id: "bandits", title: "Bird Feeder Bandits", kicker: "Backyard Defense",
      description: "Bop Nimble Nut's crew and enjoy a proper cartoon SQUASH when you catch one.",
      background: "assets/backyard.webp", character: "assets/nimble-nut.webp",
      instructions: "Tap each squirrel as soon as it pops up. Fast taps build a combo. Missed squirrels steal seed, and an empty feeder ends the game.",
      rewards: ["Speed combos", "Seed-saving bonus", "18 bandits to stop"], button: "Defend the Feeder"
    },
    {
      id: "acorn", title: "The Acorn Open", kicker: "Three-Green Challenge",
      description: "Putt acorns past water and sand while Caddy Hack provides highly questionable advice.",
      background: "assets/acorn-green.webp", character: "assets/caddy-hack.webp",
      instructions: "Touch the acorn, drag the bright arrow TOWARD the one cup, then release. The power meter shows the exact shot strength. Keep the acorn on the green—sand kills momentum and takes a strong recovery shot.",
      rewards: ["One cup per green", "Clear aim + power meter", "Punishing sand traps"], button: "Tee Off"
    },
    {
      id: "paworder", title: "Paw & Order", kicker: "Cushion Crimes Unit",
      description: "Search the visible room for three clues, then identify Summerville's most suspicious suspect.",
      background: "assets/living-room.webp", character: "assets/bootsie.webp",
      instructions: "Tap the three glowing evidence markers in the room. Only after you find every clue will the generous 25-second accusation clock begin. Then choose the suspect whose story fits the evidence.",
      rewards: ["Visible room clues", "25-second accusation clock", "Five full cases"], button: "Open the Case"
    },
    {
      id: "watch", title: "Where's Bootsie?", kicker: "Operation Watch Bootsie",
      description: "Search a cluttered room, move things aside and uncover Summerville's least cooperative cat.",
      background: "assets/bootsie-search-room.webp", character: "assets/bootsie.webp",
      instructions: "Search five increasingly crowded rooms. Tap objects to move them aside. Bootsie is hiding behind one of them—when she appears, tap her before time runs out. A hint is available, but it costs points.",
      rewards: ["Five search rooms", "Movable hiding places", "Speed + no-hint bonuses"], button: "Start Searching"
    },
    {
      id: "snailmail", title: "Snail Mail Express", kicker: "Special Delivery",
      description: "Guide Maggie Jean along the walkway, collect the mail and reach the mailbox without getting soaked.",
      background: "assets/backyard.webp", character: "assets/maggie-jean.webp",
      instructions: "Deliver three routes. Drag to guide Maggie Jean along each stone path, collect every letter or parcel, dodge moving sprinklers and squirrels, then reach the mailbox. Routes get narrower and faster.",
      rewards: ["Three escalating routes", "Moving blockers", "Dry-shell + time bonuses"], button: "Deliver the Mail"
    }
  ];

  const defaultProgress = { tickets: 0, games: {} };
  let progress = loadProgress();
  let currentId = null;
  let currentModule = null;
  let paused = false;
  let soundOn = true;
  let roundAction = null;
  const heldKeys = new Set();

  function loadProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem("sos-chaos-arcade-v2"));
      return saved && saved.games ? saved : structuredClone(defaultProgress);
    } catch (_) {
      return { tickets: 0, games: {} };
    }
  }

  function saveProgress() {
    try { localStorage.setItem("sos-chaos-arcade-v2", JSON.stringify(progress)); } catch (_) { /* Device storage is optional. */ }
  }

  function renderArcade() {
    const totalStars = games.reduce((sum, game) => sum + (progress.games[game.id]?.stars || 0), 0);
    $("totalStars").textContent = totalStars;
    $("totalTickets").textContent = progress.tickets || 0;
    $("progressText").textContent = `${totalStars} of ${games.length * 3} stars`;
    $("progressFill").style.width = `${totalStars / (games.length * 3) * 100}%`;
    gameGrid.innerHTML = "";
    games.forEach((game, index) => {
      const record = progress.games[game.id] || { stars: 0, best: 0 };
      const button = document.createElement("button");
      button.type = "button";
      button.className = "game-card";
      button.style.backgroundImage = `url(${game.background})`;
      button.setAttribute("aria-label", `Play ${game.title}. ${record.stars} of 3 stars.`);
      button.innerHTML = `
        ${index === 0 ? '<span class="featured-ribbon">Upgraded</span>' : ""}
        <img class="game-card-character" src="${game.character}" alt="">
        <span class="game-card-copy">
          <span class="game-number">Game ${index + 1} · ${game.kicker}</span>
          <h2>${game.title}</h2>
          <p>${game.description}</p>
          <span class="card-footer">
            <span class="card-stars">${"★".repeat(record.stars)}${"☆".repeat(3 - record.stars)}</span>
            <span class="card-best">Best ${record.best || 0}</span>
          </span>
        </span>`;
      button.addEventListener("click", () => openGame(game.id));
      gameGrid.appendChild(button);
    });
  }

  function openGame(id) {
    cleanupGame();
    currentId = id;
    const game = games.find((item) => item.id === id);
    arcadeScreen.hidden = true;
    playScreen.hidden = false;
    $("gameTitle").textContent = game.title;
    $("gameKicker").textContent = game.kicker;
    $("instructionKicker").textContent = game.kicker;
    $("instructionTitle").textContent = game.title;
    $("instructionText").textContent = game.instructions;
    $("instructionImage").src = game.character;
    $("instructionImage").alt = game.title;
    $("instructionRewards").innerHTML = game.rewards.map((reward) => `<span class="reward-chip">${reward}</span>`).join("");
    $("startGameButton").textContent = game.button;
    backgroundLayer.style.backgroundImage = `url(${game.background})`;
    backgroundLayer.style.filter = "brightness(.78)";
    instructionOverlay.hidden = false;
    resultOverlay.hidden = true;
    roundOverlay.hidden = true;
    pauseOverlay.hidden = true;
    coach.hidden = true;
    world.innerHTML = "";
    setHud("Ready", "—", "Best", progress.games[id]?.best || 0, "Stars", `${progress.games[id]?.stars || 0}/3`);
  }

  function launchCurrentGame() {
    instructionOverlay.hidden = true;
    resultOverlay.hidden = true;
    roundOverlay.hidden = true;
    pauseOverlay.hidden = true;
    backgroundLayer.style.filter = "none";
    paused = false;
    currentModule = modules[currentId]();
    currentModule.start();
    stage.focus({ preventScroll: true });
  }

  function cleanupGame() {
    if (currentModule?.destroy) currentModule.destroy();
    currentModule = null;
    paused = false;
    roundAction = null;
    world.innerHTML = "";
    coach.hidden = true;
    document.querySelectorAll(".comic-pop,.combo-banner,.path-warning").forEach((el) => el.remove());
  }

  function showArcade() {
    cleanupGame();
    playScreen.hidden = true;
    arcadeScreen.hidden = false;
    renderArcade();
  }

  function setHud(label1, value1, label2, value2, label3, value3) {
    $("hudLabel1").textContent = label1;
    $("hudValue1").textContent = value1;
    $("hudLabel2").textContent = label2;
    $("hudValue2").textContent = value2;
    $("hudLabel3").textContent = label3;
    $("hudValue3").textContent = value3;
  }

  function showRound(kicker, title, text, buttonText, action) {
    $("roundKicker").textContent = kicker;
    $("roundTitle").textContent = title;
    $("roundText").textContent = text;
    $("continueButton").textContent = buttonText;
    roundAction = action;
    roundOverlay.hidden = false;
  }

  function completeGame({ score, stars, title, kicker = "Game Complete", line, tickets }) {
    currentModule?.stop?.();
    const earnedStars = Math.max(0, Math.min(3, stars));
    const previous = progress.games[currentId] || { stars: 0, best: 0, plays: 0 };
    const reward = tickets ?? [2, 6, 12, 20][earnedStars];
    progress.games[currentId] = {
      stars: Math.max(previous.stars || 0, earnedStars),
      best: Math.max(previous.best || 0, Math.round(score)),
      plays: (previous.plays || 0) + 1
    };
    progress.tickets = (progress.tickets || 0) + reward;
    saveProgress();
    $("resultKicker").textContent = kicker;
    $("resultTitle").textContent = title;
    $("resultStars").textContent = "★".repeat(earnedStars) + "☆".repeat(3 - earnedStars);
    $("resultScore").textContent = Math.round(score);
    $("resultTickets").textContent = `+${reward} 🎟️`;
    $("resultBest").textContent = progress.games[currentId].best;
    $("resultLine").innerHTML = line;
    resultOverlay.hidden = false;
    announcement.textContent = `${title}. You earned ${earnedStars} stars and ${reward} Treat Tickets.`;
    winChime();
  }

  function togglePause(force) {
    if (!currentModule || !resultOverlay.hidden || !roundOverlay.hidden) return;
    paused = typeof force === "boolean" ? force : !paused;
    pauseOverlay.hidden = !paused;
    $("pauseButton").textContent = paused ? "▶" : "Ⅱ";
    if (!paused) stage.focus({ preventScroll: true });
  }

  function create(tag, className, parent = world) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    parent.appendChild(el);
    return el;
  }

  function place(el, x, y, z = Math.round(y)) {
    el.style.left = `${x}%`;
    el.style.top = `${y}%`;
    el.style.zIndex = String(z);
  }

  function popText(x, y, text) {
    const el = create("div", "comic-pop", stage);
    el.textContent = text;
    place(el, x, y, 79);
    setTimeout(() => el.remove(), 800);
  }

  function showCombo(text) {
    const el = create("div", "combo-banner", stage);
    el.textContent = text;
    setTimeout(() => el.remove(), 760);
  }

  function shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function distance(a, b) { return Math.hypot((a.x - b.x) * 1.42, a.y - b.y); }

  function beep(freq = 440, duration = .07, type = "sine", volume = .03) {
    if (!soundOn) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = beep.ctx || (beep.ctx = new AudioCtx());
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (_) { /* Sound is optional. */ }
  }

  function winChime() {
    beep(392, .08, "square", .035);
    setTimeout(() => beep(523, .08, "square", .035), 100);
    setTimeout(() => beep(659, .16, "square", .035), 205);
  }

  function eventPoint(event) {
    const rect = stage.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / rect.width * 100, y: (event.clientY - rect.top) / rect.height * 100 };
  }

  function makeRuntime() {
    const controller = new AbortController();
    const timeouts = new Set();
    const intervals = new Set();
    const rafs = new Set();
    return {
      signal: controller.signal,
      on(el, type, fn, options = {}) { el.addEventListener(type, fn, { ...options, signal: controller.signal }); },
      later(fn, ms) { const id = setTimeout(() => { timeouts.delete(id); fn(); }, ms); timeouts.add(id); return id; },
      every(fn, ms) { const id = setInterval(fn, ms); intervals.add(id); return id; },
      frame(fn) { const id = requestAnimationFrame((time) => { rafs.delete(id); fn(time); }); rafs.add(id); return id; },
      clear() { controller.abort(); timeouts.forEach(clearTimeout); intervals.forEach(clearInterval); rafs.forEach(cancelAnimationFrame); timeouts.clear(); intervals.clear(); rafs.clear(); }
    };
  }

  function addCoach(line, image = "assets/bootsie.webp", alt = "Bootsie Belle") {
    coachImage.src = image;
    coachImage.alt = alt;
    coachBubble.textContent = line;
    coach.hidden = false;
  }

  function movingCharacter(runtime, options) {
    const el = create("div", `sprite ${options.className || ""}`);
    el.innerHTML = `<img src="${options.image}" alt="">`;
    const state = { x: options.x, y: options.y, vx: 0, vy: 0, targetX: options.x, targetY: options.y, dragging: false };
    const minX = options.minX ?? 7, maxX = options.maxX ?? 91, minY = options.minY ?? 14, maxY = options.maxY ?? 90;
    function setTarget(event) { const p = eventPoint(event); state.targetX = p.x; state.targetY = p.y; }
    runtime.on(stage, "pointerdown", (event) => { if (paused) return; state.dragging = true; stage.setPointerCapture?.(event.pointerId); setTarget(event); });
    runtime.on(stage, "pointermove", (event) => { if (state.dragging && !paused) setTarget(event); });
    runtime.on(stage, "pointerup", () => { state.dragging = false; });
    runtime.on(stage, "pointercancel", () => { state.dragging = false; });
    function update(dt, speed = options.speed || .3, maxSpeed = options.maxSpeed || 1.05) {
      let keyX = 0, keyY = 0;
      if (heldKeys.has("ArrowLeft") || heldKeys.has("a")) keyX--;
      if (heldKeys.has("ArrowRight") || heldKeys.has("d")) keyX++;
      if (heldKeys.has("ArrowUp") || heldKeys.has("w")) keyY--;
      if (heldKeys.has("ArrowDown") || heldKeys.has("s")) keyY++;
      if (keyX || keyY) {
        const keyLength = Math.hypot(keyX, keyY);
        state.vx += keyX / keyLength * speed * dt;
        state.vy += keyY / keyLength * speed * dt;
      } else if (state.dragging) {
        const dx = state.targetX - state.x, dy = state.targetY - state.y, dist = Math.hypot(dx, dy);
        if (dist > 1) { state.vx += dx / dist * speed * dt; state.vy += dy / dist * speed * dt; }
      }
      const magnitude = Math.hypot(state.vx, state.vy);
      if (magnitude > maxSpeed) { state.vx = state.vx / magnitude * maxSpeed; state.vy = state.vy / magnitude * maxSpeed; }
      state.x += state.vx * dt; state.y += state.vy * dt;
      state.vx *= Math.pow(.91, dt); state.vy *= Math.pow(.91, dt);
      if (state.x < minX || state.x > maxX) state.vx *= -.6;
      if (state.y < minY || state.y > maxY) state.vy *= -.6;
      state.x = Math.max(minX, Math.min(maxX, state.x)); state.y = Math.max(minY, Math.min(maxY, state.y));
      place(el, state.x, state.y, 30 + Math.round(state.y));
      const tilt = Math.max(-7, Math.min(7, state.vx * 6));
      el.style.transform = `translate(-50%,-72%) rotate(${tilt}deg)`;
    }
    place(el, state.x, state.y, 30 + Math.round(state.y));
    return { el, state, update };
  }

  const modules = {
    roomba() {
      const runtime = makeRuntime();
      const configs = [
        { name: "Living Room Roundup", goal: 8, time: 38, hazards: 4, movers: 2 },
        { name: "Dining Room Stampede", goal: 10, time: 34, hazards: 5, movers: 5 },
        { name: "Floor Buffalo Frenzy", goal: 12, time: 30, hazards: 6, movers: 9 }
      ];
      const spots = [
        {x:18,y:30},{x:30,y:23},{x:44,y:26},{x:58,y:20},{x:72,y:29},{x:82,y:42},
        {x:75,y:57},{x:66,y:72},{x:52,y:77},{x:38,y:69},{x:25,y:61},{x:17,y:47},
        {x:37,y:42},{x:54,y:48},{x:63,y:36},{x:47,y:59},{x:29,y:50},
        {x:84,y:67},{x:58,y:63},{x:40,y:33},{x:20,y:72}
      ];
      const hazardIcons = ["🧶","📚","🥿","🥣","🧸","🪴"];
      let round = 0, score = 0, remaining = 0, collected = 0, combo = 1, lastCollect = 0;
      let player, objects = [], running = false, lastFrame = 0, secondTimer = null, raf = null;

      function startRound() {
        world.innerHTML = "";
        coach.hidden = true;
        objects = [];
        const cfg = configs[round];
        remaining = cfg.time;
        collected = 0;
        combo = 1;
        player = movingCharacter(runtime, { image:"assets/honey-roomba.webp", className:"roomba-player riding", x:13, y:82, speed:.34, maxSpeed:1.18 + round * .08 });
        const selected = shuffle(spots).slice(0, cfg.goal + cfg.hazards + 1);
        for (let i = 0; i < cfg.goal; i++) {
          const item = selected[i];
          const el = create("div", `object collectible ${i === cfg.goal - 1 ? "gold" : ""}`);
          el.textContent = i === cfg.goal - 1 ? "✨" : "☁️";
          place(el,item.x,item.y);
          objects.push({ ...item, baseX:item.x, baseY:item.y, radius:4.5, type:"bunny", gold:i === cfg.goal - 1, hit:false, moving:i < cfg.movers, phase:Math.random()*6.28, el });
        }
        for (let i = 0; i < cfg.hazards; i++) {
          const item = selected[cfg.goal + i];
          const el = create("div","object"); el.textContent = hazardIcons[i]; place(el,item.x,item.y);
          objects.push({ ...item, baseX:item.x, baseY:item.y, radius:5.1, type:"hazard", hitAt:0, moving:round === 2 && i < 3, phase:Math.random()*6.28, el });
        }
        const clockSpot = selected[cfg.goal + cfg.hazards];
        const clock = create("div","object collectible gold"); clock.textContent = "⏱️"; place(clock,clockSpot.x,clockSpot.y);
        objects.push({ ...clockSpot, radius:4.4, type:"clock", hit:false, el:clock });
        running = true;
        lastFrame = performance.now();
        setHud(`Round ${round+1}/3`,`${collected}/${cfg.goal}`,"Time",remaining,"Score",score);
        addCoach(round === 0 ? "The floor buffalo has reinforcements." : round === 1 ? "More dust. Less dignity." : "Even I may respect this level of chaos.");
        secondTimer = runtime.every(() => {
          if (!running || paused) return;
          remaining--;
          setHud(`Round ${round+1}/3`,`${collected}/${cfg.goal}`,"Time",remaining,"Score",score);
          if (remaining <= 0) endRun(false);
          else if (remaining <= 8) beep(210,.03,"square",.018);
        },1000);
        raf = runtime.frame(loop);
      }

      function loop(now) {
        if (!running) return;
        const dt = Math.min((now-lastFrame)/16.667,2.2); lastFrame=now;
        if (!paused) {
          player.update(dt,.34,1.18+round*.08);
          objects.forEach((obj) => {
            if (obj.moving && !obj.hit) {
              obj.x = obj.baseX + Math.sin(now/760 + obj.phase) * (round + 1) * 1.45;
              obj.y = obj.baseY + Math.cos(now/940 + obj.phase) * (round + 1) * .9;
              place(obj.el,obj.x,obj.y);
            }
          });
          collide(now);
        }
        raf = runtime.frame(loop);
      }

      function collide(now) {
        objects.forEach((obj) => {
          if ((obj.type === "bunny" || obj.type === "clock") && obj.hit) return;
          if (distance(player.state,obj) > obj.radius + 4.3) return;
          if (obj.type === "bunny") {
            obj.hit=true; obj.el.classList.add("collected"); collected++;
            combo = now-lastCollect < 2300 ? Math.min(5,combo+1) : 1; lastCollect=now;
            const gain=(obj.gold?450:125)*combo; score+=gain;
            popText(obj.x,obj.y,obj.gold?"GOLDEN!":`+${gain}`);
            if(combo>=3) showCombo(`${combo}× Dust Combo!`);
            beep(600+combo*60,.07,"sine",.035);
            setHud(`Round ${round+1}/3`,`${collected}/${configs[round].goal}`,"Time",remaining,"Score",score);
            if(collected>=configs[round].goal) finishRound();
          } else if (obj.type === "clock") {
            obj.hit=true; obj.el.classList.add("collected"); remaining+=5; score+=200; popText(obj.x,obj.y,"+5 SECONDS!"); beep(780,.1,"sine",.04);
          } else if(now-obj.hitAt>950) {
            obj.hitAt=now; remaining=Math.max(0,remaining-3); score=Math.max(0,score-75); combo=1;
            player.state.vx*=-1.7; player.state.vy*=-1.7;
            obj.el.classList.remove("hazard-hit"); void obj.el.offsetWidth; obj.el.classList.add("hazard-hit");
            player.el.classList.remove("bump"); void player.el.offsetWidth; player.el.classList.add("bump");
            popText(player.state.x,player.state.y-7,["BONK!","CLUNK!","WHOOPS!"][Math.floor(Math.random()*3)]); beep(105,.13,"sawtooth",.045);
          }
        });
      }

      function finishRound() {
        running=false; score+=remaining*30; clearInterval(secondTimer);
        if(round<2){
          const next=round+1;
          showRound("Round Cleared",configs[round].name,`Time bonus earned! Next: ${configs[next].name}. The dust bunnies will move faster and the room will get more crowded.`,`Start Round ${next+1}`,()=>{roundOverlay.hidden=true;round++;startRound();});
        } else endRun(true);
      }

      function endRun(won) {
        running=false; clearInterval(secondTimer);
        const stars=won?(score>=13000?3:score>=8500?2:1):(score>=3500?1:0);
        completeGame({score,stars,title:won?"Floor Buffalo Tamed!":"The Herd Got Away!",kicker:won?"Three Rounds Cleared":"Rodeo Interrupted",line:won?"“That was almost graceful. Almost.”<br><b>— Bootsie Belle</b>":"“The surviving dust bunnies have formed a committee.”<br><b>— Bootsie Belle</b>"});
      }

      return { start:startRound, stop(){running=false;clearInterval(secondTimer);}, destroy(){running=false;clearInterval(secondTimer);runtime.clear();} };
    },

    bandits() {
      const runtime=makeRuntime();
      const holes=[{x:17,y:31},{x:36,y:26},{x:56,y:31},{x:76,y:27},{x:28,y:55},{x:52,y:54},{x:76,y:56},{x:43,y:75},{x:67,y:76}];
      let score=0,hits=0,seed=100,time=32,combo=0,misses=0,running=false,spawnTimer=null,clockTimer=null,active=null;
      function start(){
        world.innerHTML="";running=true;addCoach("The squirrels deny everything. Their cheeks do not.");
        const meter=create("div","seed-meter");meter.innerHTML='<span>Birdseed Remaining: <b id="seedValue">100%</b></span><div class="seed-track"><i id="seedFill"></i></div>';
        update();
        clockTimer=runtime.every(()=>{if(paused||!running)return;time--;update();if(time<=0)finish(seed>0);},1000);
        scheduleSpawn();
      }
      function scheduleSpawn(){
        if(!running)return;
        spawnTimer=runtime.later(spawn,Math.max(320,760-hits*18));
      }
      function spawn(){
        if(!running||paused){scheduleSpawn();return;}
        const spot=holes[Math.floor(Math.random()*holes.length)];
        const btn=create("button","bandit-hole");btn.type="button";btn.setAttribute("aria-label","Stop Nimble Nut");btn.innerHTML='<img src="assets/nimble-nut.webp" alt="Nimble Nut">';place(btn,spot.x,spot.y,35+Math.round(spot.y));active=btn;
        let caught=false;
        runtime.on(btn,"pointerdown",(event)=>{
          event.stopPropagation();if(caught||paused||!running)return;caught=true;combo=Math.min(8,combo+1);hits++;const gain=100+combo*25;score+=gain;popText(spot.x,spot.y,combo>=3?`${combo}× SQUASH!`:"WHOMP!");beep(610+combo*35,.065,"square",.035);
          btn.classList.add("squashed");btn.querySelector("img").src="assets/nimble-nut-squashed.webp";btn.setAttribute("aria-label","Nimble Nut was safely squashed");active=null;update();
          runtime.later(()=>{btn.remove();if(hits>=18)finish(true);else scheduleSpawn();},360);
        });
        runtime.later(()=>{
          if(caught||!running)return;caught=true;btn.remove();active=null;combo=0;misses++;seed=Math.max(0,seed-10);popText(spot.x,spot.y,"SEED STOLEN!");beep(120,.11,"sawtooth",.04);update();if(seed<=0)finish(false);else scheduleSpawn();
        },Math.max(620,1350-hits*28));
      }
      function update(){setHud("Bandits",`${hits}/18`,"Time",time,"Combo",`${combo}×`);const sv=$("seedValue"),sf=$("seedFill");if(sv)sv.textContent=`${seed}%`;if(sf)sf.style.transform=`scaleX(${seed/100})`;}
      function finish(won){if(!running)return;running=false;active?.remove();score+=seed*8+Math.max(0,time)*20;const stars=won?(misses<=2?3:misses<=5?2:1):(hits>=10?1:0);completeGame({score,stars,title:won?"Feeder Defended!":"The Bandits Got the Seed!",line:won?"“Their getaway plan lacked subtlety. And pockets.”<br><b>— Bootsie Belle</b>":"“We shall remember the birdseed. Briefly.”<br><b>— Bootsie Belle</b>"});}
      return{start,stop(){running=false;},destroy(){running=false;runtime.clear();}};
    },

    acorn() {
      const runtime=makeRuntime();
      const greens=[
        {name:"Picnic Green",start:{x:24,y:72},cup:{x:75,y:23},par:3},
        {name:"Azalea Green",start:{x:49,y:76},cup:{x:75,y:23},par:3},
        {name:"Champion Green",start:{x:20,y:48},cup:{x:75,y:23},par:4}
      ];
      let hole=0,strokes=0,holeStrokes=0,score=0,running=false,ball=null,ballEl=null,cupEl=null,aimEl=null,aiming=false,moving=false,raf=null,last=0,inSand=false;
      function start(){
        world.innerHTML="";running=true;backgroundLayer.style.backgroundImage='url("assets/acorn-green.webp")';
        const caddy=create("img","course-character");caddy.src="assets/caddy-hack.webp";caddy.alt="Caddy Hack";
        runtime.on(stage,"pointerdown",down);runtime.on(stage,"pointermove",move);runtime.on(stage,"pointerup",up);runtime.on(stage,"pointercancel",up);startHole();last=performance.now();raf=runtime.frame(loop);
      }
      function startHole(){
        world.querySelectorAll(".golf-ball,.golf-hole,.power-readout,.aim-line,.green-label").forEach(el=>el.remove());
        ball={...greens[hole].start,vx:0,vy:0};holeStrokes=0;moving=false;aiming=false;inSand=false;
        cupEl=create("div","golf-hole");place(cupEl,greens[hole].cup.x,greens[hole].cup.y,20);cupEl.setAttribute("aria-label","The only cup on this green");
        ballEl=create("button","golf-ball");ballEl.type="button";ballEl.textContent="🌰";ballEl.setAttribute("aria-label","Acorn ball. Touch and drag toward the cup.");place(ballEl,ball.x,ball.y,46);
        const label=create("div","green-label");label.textContent=`Green ${hole+1}/3 · ${greens[hole].name} · Par ${greens[hole].par}`;
        const power=create("div","power-readout");power.id="powerReadout";power.innerHTML='<b>Touch the acorn</b><span class="power-track"><i id="puttPower"></i></span><small>Drag the arrow TOWARD the cup</small>';
        update();last=performance.now();
      }
      function down(event){if(paused||moving||!running)return;const p=eventPoint(event);if(distance(p,ball)<13){aiming=true;stage.setPointerCapture?.(event.pointerId);setAim(p);}}
      function move(event){if(aiming&&!paused)setAim(eventPoint(event));}
      function setAim(p){
        const dx=p.x-ball.x,dy=p.y-ball.y,len=Math.min(34,Math.hypot(dx,dy));if(!len)return;
        if(!aimEl)aimEl=create("div","aim-line");aimEl.style.left=`${ball.x}%`;aimEl.style.top=`${ball.y}%`;aimEl.style.width=`${Math.max(7,len*1.05)}%`;aimEl.style.transform=`rotate(${Math.atan2(dy,dx)*180/Math.PI}deg)`;
        const pct=Math.round(len/34*100),bar=$("puttPower");if(bar)bar.style.transform=`scaleX(${pct/100})`;const readout=$("powerReadout");if(readout)readout.querySelector("b").textContent=`Power ${pct}%${inSand?" · SAND PENALTY":""}`;
      }
      function up(event){
        if(!aiming||paused)return;aiming=false;const p=eventPoint(event),dx=p.x-ball.x,dy=p.y-ball.y,len=Math.min(34,Math.hypot(dx,dy));aimEl?.remove();aimEl=null;
        const raw=Math.hypot(dx,dy);if(len<3){resetReadout();return;}const sandShot=isSand(ball),power=Math.min(2.75,len*.086)*(sandShot ? .46 : 1);ball.vx=dx/Math.max(raw,.01)*power;ball.vy=dy/Math.max(raw,.01)*power;moving=true;strokes++;holeStrokes++;ballEl.classList.add("moving");if(sandShot)popText(ball.x,ball.y,"DIG IT OUT!");beep(185,.06,"square",.04);update();
      }
      function isSand(p){return p.x>82&&p.y>39&&p.y<76;}
      function keepOnGreen(){
        const cx=50,cy=51,rx=45,ry=38,nx=(ball.x-cx)/rx,ny=(ball.y-cy)/ry,d=Math.hypot(nx,ny);
        if(d<=1)return;ball.x=cx+nx/d*rx*.985;ball.y=cy+ny/d*ry*.985;ball.vx*=-.22;ball.vy*=-.22;popText(ball.x,ball.y,"FRINGE!");
      }
      function loop(now){
        if(!running)return;const dt=Math.min((now-last)/16.667,2);last=now;
        if(!paused&&moving){
          ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;keepOnGreen();inSand=isSand(ball);const friction=inSand ? .82 : .968;ball.vx*=Math.pow(friction,dt);ball.vy*=Math.pow(friction,dt);place(ballEl,ball.x,ball.y,46);
          const speed=Math.hypot(ball.vx,ball.vy);if(distance(ball,greens[hole].cup)<4.2&&speed<1.1)sink();else if(speed<.035){moving=false;ball.vx=ball.vy=0;ballEl.classList.remove("moving");resetReadout();if(inSand)popText(ball.x,ball.y,"STUCK IN SAND!");}
        }
        raf=runtime.frame(loop);
      }
      function resetReadout(){const r=$("powerReadout");if(r){r.querySelector("b").textContent=inSand?"Sand: use full power":"Touch the acorn";const bar=$("puttPower");if(bar)bar.style.transform="scaleX(0)";}}
      function sink(){moving=false;ballEl.classList.add("collected");score+=Math.max(350,1800-holeStrokes*185);popText(ball.x,ball.y,holeStrokes<=greens[hole].par?"UNDER PAR!":"IN THE CUP!");beep(720,.12,"sine",.04);runtime.later(()=>{hole++;if(hole<greens.length){showRound(`Green ${hole} Complete`,`${holeStrokes} Strokes`,`Next is ${greens[hole].name}, par ${greens[hole].par}. There is still only one cup—and the sand is still trouble.`,`Play Green ${hole+1}`,()=>{roundOverlay.hidden=true;startHole();});}else finish();},650);}
      function update(){setHud("Green",`${hole+1}/3`,`Strokes`,strokes,"Par",greens[hole]?.par||"—");}
      function finish(){running=false;score+=Math.max(0,3600-strokes*190);const stars=strokes<=9?3:strokes<=13?2:1;completeGame({score,stars,title:strokes<=9?"Squirrel Tour Qualified!":"Acorn Open Complete!",line:`“${strokes} strokes, three greens, and exactly three cups total. Finally.”<br><b>— Bootsie Belle</b>`});}
      return{start,stop(){running=false;},destroy(){running=false;runtime.clear();}};
    },

    paworder() {
      const runtime=makeRuntime();
      const cases=shuffle([
        {title:"The Crushed Cushion",answer:"Bootsie Belle",choices:["Honey Bear","Bootsie Belle","Nimble Nut"],clues:[{icon:"🖤",x:24,y:38,text:"Black fur"},{icon:"〰️",x:46,y:64,text:"White whisker"},{icon:"🛋️",x:67,y:45,text:"Cat-shaped dent"}]},
        {title:"The Open Treat Jar",answer:"Honey Bear",choices:["Honey Bear","Caddy Hack","Maggie Jean"],clues:[{icon:"🍪",x:28,y:69,text:"Treat crumbs"},{icon:"🎀",x:51,y:55,text:"Pink bow"},{icon:"🐾",x:72,y:72,text:"Tiny dog prints"}]},
        {title:"The Acorn Golf Ball",answer:"Caddy Hack",choices:["Bootsie Belle","Caddy Hack","Nimble Nut"],clues:[{icon:"⛳",x:29,y:38,text:"Chewed scorecard"},{icon:"🌰",x:50,y:72,text:"Muddy acorn"},{icon:"🕳️",x:71,y:55,text:"Tunnel dirt"}]},
        {title:"The Birdseed Heist",answer:"Nimble Nut",choices:["Nimble Nut","Honey Bear","Maggie Jean"],clues:[{icon:"🌻",x:25,y:58,text:"Birdseed trail"},{icon:"🌰",x:48,y:37,text:"Empty acorn cap"},{icon:"🐾",x:70,y:68,text:"Squirrel prints"}]},
        {title:"The Slow Delivery",answer:"Maggie Jean",choices:["Caddy Hack","Bootsie Belle","Maggie Jean"],clues:[{icon:"📦",x:24,y:68,text:"Damp parcel"},{icon:"💧",x:51,y:45,text:"Slime trail"},{icon:"🐚",x:70,y:60,text:"Shell impression"}]},
        {title:"The Unraveled Yarn",answer:"Bootsie Belle",choices:["Honey Bear","Bootsie Belle","Caddy Hack"],clues:[{icon:"🧶",x:27,y:72,text:"Loose yarn"},{icon:"🖤",x:49,y:44,text:"Black fur"},{icon:"📚",x:72,y:29,text:"High-shelf clue"}]}
      ]).slice(0,5);
      let index=0,correct=0,score=0,time=25,streak=0,running=false,timer=null,answered=false,clockActive=false,found=0;
      function start(){world.innerHTML="";running=true;showCase();timer=runtime.every(()=>{if(paused||!running||answered||!clockActive)return;time--;update();const fill=$("caseTimerFill");if(fill)fill.style.transform=`scaleX(${time/25})`;if(time<=5)document.querySelector(".case-clock")?.classList.add("urgent");if(time<=0){answered=true;clockActive=false;streak=0;popText(72,22,"TIME! CASE COLD!");runtime.later(next,850);}},1000);}
      function showCase(){
        world.innerHTML="";answered=false;clockActive=false;found=0;time=25;const item=cases[index];
        const guide=create("div","case-guide");guide.innerHTML=`<b>1. Find all 3 clues</b><span>2. Then accuse a suspect</span>`;
        const board=create("div","case-board");board.innerHTML=`<div class="case-copy"><p class="eyebrow">Case ${index+1} of 5</p><h2>${item.title}</h2><p class="clue" id="clueList"><b>Evidence locker:</b> Find the three glowing clues in the room.</p><div class="case-clock"><span>Accusation time: <b id="caseClockText">Starts after clues</b></span><i><em id="caseTimerFill"></em></i></div><div class="suspects"></div></div>`;
        const suspects=board.querySelector(".suspects");
        shuffle(item.choices).forEach((name)=>{const btn=document.createElement("button");btn.type="button";btn.className="suspect-button";btn.textContent=name;btn.disabled=true;suspects.appendChild(btn);runtime.on(btn,"click",()=>answer(name,btn,board));});
        item.clues.forEach((clue,n)=>{const btn=create("button","evidence-marker");btn.type="button";btn.innerHTML=`<span>${clue.icon}</span><small>Clue ${n+1}</small>`;btn.setAttribute("aria-label",`Inspect clue ${n+1}`);place(btn,clue.x,clue.y,62);runtime.on(btn,"click",()=>revealClue(btn,clue,board));});
        update();
      }
      function revealClue(button,clue,board){
        if(button.classList.contains("found")||paused||answered)return;button.classList.add("found");button.querySelector("small").textContent=clue.text;found++;score+=100;beep(520+found*70,.07,"sine",.035);
        const list=board.querySelector("#clueList");list.innerHTML=`<b>Evidence ${found}/3:</b> ${cases[index].clues.filter((_,i)=>world.querySelectorAll(".evidence-marker")[i]?.classList.contains("found")).map(c=>c.text).join(" · ")}`;
        if(found===3){clockActive=true;board.querySelectorAll(".suspect-button").forEach(btn=>btn.disabled=false);board.classList.add("ready");document.querySelector(".case-guide").innerHTML="<b>All clues found!</b><span>Choose the suspect · 25 seconds</span>";popText(50,18,"CLOCK STARTED!");update();}
      }
      function answer(name,button,board){
        if(answered||paused||!clockActive)return;answered=true;clockActive=false;const item=cases[index];const buttons=[...board.querySelectorAll("button")];buttons.forEach((btn)=>btn.disabled=true);
        const right=name===item.answer;if(right){correct++;streak++;const gain=500+time*30+streak*75;score+=gain;button.classList.add("correct");popText(70,24,streak>=2?`${streak}× CASE STREAK!`:"SOLVED!");beep(650,.09,"sine",.04);}else{streak=0;button.classList.add("wrong");buttons.find((btn)=>btn.textContent===item.answer)?.classList.add("correct");popText(70,24,"OBJECTION!");beep(115,.13,"sawtooth",.04);}
        runtime.later(next,1000);
      }
      function next(){index++;if(index>=cases.length)finish();else showCase();}
      function update(){setHud("Case",`${index+1}/5`,"Clues",`${found}/3`,clockActive?"Time":"Solved",clockActive?time:correct);const clock=$("caseClockText");if(clock)clock.textContent=clockActive?`${time} seconds`:found===3?"Choose now":"Starts after clues";}
      function finish(){running=false;score+=correct*200;const stars=correct===5?3:correct>=4?2:correct>=3?1:0;completeGame({score,stars,title:correct===5?"Perfect Detective Work!":"Court Is Adjourned!",line:correct===5?"“You may join my legal team. Bring your own snacks.”<br><b>— Bootsie Belle</b>":`“${correct} solved. Reasonable doubt remains extremely reasonable.”<br><b>— Bootsie Belle</b>`});}
      return{start,stop(){running=false;},destroy(){running=false;runtime.clear();}};
    },

    watch() {
      const runtime=makeRuntime();
      const spots=[{x:18,y:33,icon:"🧺"},{x:31,y:58,icon:"📦"},{x:44,y:37,icon:"🛋️"},{x:55,y:66,icon:"🛏️"},{x:67,y:37,icon:"🪴"},{x:80,y:55,icon:"🪑"},{x:22,y:73,icon:"🧸"},{x:40,y:76,icon:"🧳"},{x:61,y:76,icon:"🧶"},{x:76,y:72,icon:"🛍️"},{x:88,y:34,icon:"🧥"},{x:51,y:24,icon:"📚"}];
      let room=0,score=0,running=false,time=0,timer=null,target=-1,moves=0,hints=0,found=false;
      function start(){backgroundLayer.style.backgroundImage='url("assets/bootsie-search-room.webp")';running=true;timer=runtime.every(tick,1000);startRoom();}
      function startRoom(){
        world.innerHTML="";found=false;moves=0;time=38-room*3;target=Math.floor(Math.random()*(7+room));const count=8+room;
        const status=create("div","watch-status");status.id="watchStatus";status.innerHTML=`<b>Room ${room+1}/5:</b> Move the clutter. Then tap Bootsie!`;
        const hint=create("button","hint-button");hint.type="button";hint.textContent="💡 Hint −200";runtime.on(hint,"click",useHint);
        const cat=create("button","hidden-bootsie");cat.type="button";cat.innerHTML='<img src="assets/bootsie.webp" alt="Bootsie Belle">';cat.setAttribute("aria-label","Bootsie Belle—found her!");place(cat,spots[target].x,spots[target].y,34);runtime.on(cat,"click",catchBootsie);
        shuffle(spots.slice(0,count).map((spot,i)=>({...spot,original:i}))).forEach((spot)=>{const btn=create("button","search-object");btn.type="button";btn.innerHTML=`<span>${spot.icon}</span><small>Move</small>`;btn.setAttribute("aria-label","Move this hiding place");place(btn,spot.x,spot.y,spot.original===target?48:42+spot.original);runtime.on(btn,"click",()=>moveObject(btn,spot.original===target));});
        update();
      }
      function moveObject(button,isTarget){
        if(paused||!running||found||button.classList.contains("moved"))return;moves++;button.classList.add("moved");button.style.setProperty("--move-x",`${button.offsetLeft<stage.clientWidth/2?-75:75}px`);button.querySelector("small").textContent="Moved";score=Math.max(0,score-10);
        if(isTarget){document.querySelector(".hidden-bootsie")?.classList.add("revealed");const s=$("watchStatus");if(s)s.innerHTML="<b>There she is!</b> Tap Bootsie before she slips away.";popText(spots[target].x,spots[target].y-8,"FOUND HER?");beep(610,.08,"sine",.04);}else beep(240,.035,"square",.018);update();
      }
      function catchBootsie(){
        const cat=document.querySelector(".hidden-bootsie");if(paused||!running||found||!cat?.classList.contains("revealed"))return;found=true;score+=800+time*25+Math.max(0,240-moves*20);cat.classList.add("caught");popText(spots[target].x,spots[target].y,"GOTCHA!");beep(720,.12,"sine",.04);const finishedRoom=room+1;room++;
        runtime.later(()=>{if(room>=5)finish(true);else showRound(`Room ${finishedRoom} Searched`,`Bootsie Found!`,`Next room has more clutter and less time. You moved ${moves} objects.`,`Search Room ${room+1}`,()=>{roundOverlay.hidden=true;startRoom();});},700);
      }
      function useHint(){
        if(paused||!running||found)return;const cover=[...world.querySelectorAll(".search-object")].find(el=>Math.abs(parseFloat(el.style.left)-spots[target].x)<.1&&Math.abs(parseFloat(el.style.top)-spots[target].y)<.1);if(!cover||cover.classList.contains("moved"))return;cover.classList.add("hinted");hints++;score=Math.max(0,score-200);popText(spots[target].x,spots[target].y-9,"SEARCH HERE!");
      }
      function tick(){if(paused||!running||found)return;time--;update();if(time<=8)document.querySelector(".watch-status")?.classList.add("urgent");if(time<=0)finish(false);}
      function update(){setHud("Room",`${Math.min(room+1,5)}/5`,"Time",time,"Moves",moves);}
      function finish(won){if(!running)return;running=false;const stars=won?(hints===0&&score>=7000?3:hints<=2?2:1):(room>=2?1:0);completeGame({score,stars,title:won?"All Five Bootsies Found!":"Bootsie Wins This Round!",line:won?`“Five rooms searched and only ${hints} hints. Acceptable surveillance.”<br><b>— Bootsie Belle</b>`:"“I was behind the obvious thing. Probably.”<br><b>— Bootsie Belle</b>"});}
      return{start,stop(){running=false;},destroy(){running=false;runtime.clear();}};
    },

    snailmail() {
      const runtime=makeRuntime();
      const levels=[
        {name:"Garden Warm-Up",time:46,width:12,speed:.72,items:[{x:20,y:34},{x:31,y:47},{x:44,y:57},{x:58,y:64},{x:73,y:73}],sprinklers:[{x:45,y:58,phase:0}],blockers:[]},
        {name:"Sprinkler Slalom",time:40,width:9,speed:.78,items:[{x:18,y:31},{x:29,y:44},{x:40,y:54},{x:52,y:61},{x:65,y:69},{x:78,y:76}],sprinklers:[{x:38,y:53,phase:0},{x:64,y:68,phase:2.5}],blockers:[{x:55,y:63,phase:1}]},
        {name:"Parcel Panic",time:36,width:7.5,speed:.84,items:[{x:18,y:31,parcel:true},{x:28,y:43},{x:39,y:53,parcel:true},{x:51,y:61},{x:63,y:68,parcel:true},{x:74,y:73},{x:82,y:77,parcel:true}],sprinklers:[{x:32,y:47,phase:0},{x:54,y:62,phase:2},{x:73,y:73,phase:4}],blockers:[{x:44,y:57,phase:0},{x:68,y:70,phase:3}]}
      ];
      const path=[{x:14,y:27},{x:27,y:42},{x:39,y:54},{x:53,y:61},{x:68,y:70},{x:86,y:79}];
      let level=0,running=false,time=0,score=0,collected=0,totalWet=0,levelWet=0,totalOff=0,levelOff=0,player,items=[],sprinklers=[],blockers=[],last=0,raf=null,timer=null;
      function start(){running=true;timer=runtime.every(tick,1000);startLevel();}
      function startLevel(){
        world.innerHTML="";const cfg=levels[level];time=cfg.time;collected=0;levelWet=0;levelOff=0;items=[];sprinklers=[];blockers=[];
        player=movingCharacter(runtime,{image:"assets/maggie-jean.webp",className:"maggie-player",x:13,y:26,speed:.22+level*.02,maxSpeed:cfg.speed,minX:6,maxX:93,minY:15,maxY:90});
        cfg.items.forEach((pos)=>{const el=create("div","mail-item");el.textContent=pos.parcel?"📦":"✉️";place(el,pos.x,pos.y,32);items.push({...pos,hit:false,el});});
        cfg.sprinklers.forEach((s)=>{const el=create("div","sprinkler");el.textContent="💦";place(el,s.x,s.y,28);sprinklers.push({...s,baseX:s.x,hitAt:0,el});});
        cfg.blockers.forEach((s)=>{const el=create("div","route-blocker");el.textContent="🐿️";place(el,s.x,s.y,38);blockers.push({...s,baseY:s.y,hitAt:0,el});});
        const goal=create("div","object collectible gold");goal.textContent="📫";place(goal,87,79,36);goal.style.opacity=".78";
        const banner=create("div","route-banner");banner.textContent=`Route ${level+1}/3 · ${cfg.name}`;update();last=performance.now();raf=runtime.frame(loop);
      }
      function tick(){if(paused||!running)return;time--;const cfg=levels[level],d=distanceToPath(player.state);if(d>cfg.width){levelOff++;totalOff++;time=Math.max(0,time-1);warning("Off route! −1 second");}update();if(time<=0)finish(false);}
      function loop(now){
        if(!running)return;const dt=Math.min((now-last)/16.667,2.2);last=now;if(!paused){const cfg=levels[level];player.update(dt,.22+level*.02,cfg.speed);
          items.forEach((item)=>{if(!item.hit&&distance(player.state,item)<7){item.hit=true;item.el.classList.add("collected");collected++;score+=item.parcel?500:300;popText(item.x,item.y,item.parcel?"PARCEL!":"STAMPED!");beep(630+collected*30,.07,"sine",.035);update();}});
          sprinklers.forEach((s)=>{s.x=s.baseX+Math.sin(now/(720-level*90)+s.phase)*(5+level*1.4);place(s.el,s.x,s.y);if(now-s.hitAt>1050&&distance(player.state,s)<8){hitHazard(s,"SPLASH!",4);}});
          blockers.forEach((s)=>{s.y=s.baseY+Math.sin(now/620+s.phase)*7;place(s.el,s.x,s.y);if(now-s.hitAt>1050&&distance(player.state,s)<8){hitHazard(s,"NUT BLOCK!",3);}});
          if(collected===cfg.items.length&&distance(player.state,{x:87,y:79})<7)completeLevel();
        }raf=runtime.frame(loop);
      }
      function hitHazard(hazard,label,penalty){hazard.hitAt=performance.now();levelWet++;totalWet++;time=Math.max(0,time-penalty);score=Math.max(0,score-120);player.state.vx*=-1.6;player.state.vy*=-1.6;popText(hazard.x,hazard.y,label);beep(110,.12,"sawtooth",.04);update();}
      function completeLevel(){
        const cfg=levels[level];score+=time*35+Math.max(0,600-levelWet*120-levelOff*40);const finished=level+1;level++;if(level>=levels.length){finish(true);return;}running=false;showRound(`Route ${finished} Delivered`,cfg.name,`Next: ${levels[level].name}. More mail, faster hazards and a narrower safe path.`,`Start Route ${level+1}`,()=>{roundOverlay.hidden=true;running=true;startLevel();});
      }
      function distanceToPath(point){let best=Infinity;for(let i=0;i<path.length-1;i++){const a=path[i],b=path[i+1],dx=b.x-a.x,dy=b.y-a.y;const t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/(dx*dx+dy*dy)));const p={x:a.x+t*dx,y:a.y+t*dy};best=Math.min(best,distance(point,p));}return best;}
      function warning(text){document.querySelector(".path-warning")?.remove();const el=create("div","path-warning",stage);el.textContent=text;runtime.later(()=>el.remove(),700);}
      function update(){const need=levels[level]?.items.length||0;setHud("Route",`${Math.min(level+1,3)}/3`,"Mail",`${collected}/${need}`,"Time",time);}
      function finish(won){if(!running)return;running=false;const stars=won?(totalWet===0&&totalOff<=2?3:totalWet<=4?2:1):(level>=1?1:0);completeGame({score,stars,title:won?"Three Special Deliveries!":"Return to Sender!",line:won?`“Three routes, ${totalWet} collisions, and the mail still arrived.”<br><b>— Bootsie Belle</b>`:"“Maggie Jean promises delivery sometime this month.”<br><b>— Bootsie Belle</b>"});}
      return{start,stop(){running=false;},destroy(){running=false;runtime.clear();}};
    }
  };

  $("startGameButton").addEventListener("click", launchCurrentGame);
  $("arcadeButton").addEventListener("click", showArcade);
  $("resultArcadeButton").addEventListener("click", showArcade);
  $("playAgainButton").addEventListener("click", () => { openGame(currentId); launchCurrentGame(); });
  $("continueButton").addEventListener("click", () => { const action=roundAction;roundAction=null;action?.(); });
  $("pauseButton").addEventListener("click", () => togglePause());
  $("resumeButton").addEventListener("click", () => togglePause(false));
  $("restartButton").addEventListener("click", () => { cleanupGame();openGame(currentId);launchCurrentGame(); });
  $("soundButton").addEventListener("click", () => {
    soundOn=!soundOn;$("soundButton").textContent=soundOn?"♪":"×";$("soundButton").setAttribute("aria-pressed",String(soundOn));$("soundButton").setAttribute("aria-label",soundOn?"Turn sound off":"Turn sound on");if(soundOn)beep();
  });
  window.addEventListener("keydown",(event)=>{
    const key=event.key.length===1?event.key.toLowerCase():event.key;
    heldKeys.add(key);
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(event.key))event.preventDefault();
    if(event.key===" "&&currentModule)togglePause();
    if(event.key==="Escape"&&!playScreen.hidden)showArcade();
  },{passive:false});
  window.addEventListener("keyup",(event)=>heldKeys.delete(event.key.length===1?event.key.toLowerCase():event.key));
  window.addEventListener("blur",()=>{if(currentModule&&!paused)togglePause(true);});
  document.addEventListener("visibilitychange",()=>{if(document.hidden&&currentModule&&!paused)togglePause(true);});

  renderArcade();
  if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
})();
