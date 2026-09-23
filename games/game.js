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

  function updateArcadeViewportHeight() {
    const height = Math.round(window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight);
    if (height > 0) document.documentElement.style.setProperty("--arcade-vh", `${height}px`);
  }
  updateArcadeViewportHeight();
  window.addEventListener("resize", updateArcadeViewportHeight, { passive: true });
  window.visualViewport?.addEventListener("resize", updateArcadeViewportHeight, { passive: true });
  window.visualViewport?.addEventListener("scroll", updateArcadeViewportHeight, { passive: true });

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
      description: "Putt acorns past water and sand while Ace heckles every shot with absolute, frequently misplaced confidence.",
      background: "assets/acorn-green.webp", character: "assets/ace-forgetful.webp",
      instructions: "Touch the acorn and drag the aiming arrow exactly where you want the shot to travel. The moving target marker shows direction while the distance meter gives SHORT, MEDIUM or LONG power before you release. Ace will offer commentary. Whether any of it is useful is another matter.",
      rewards: ["Reactive Ace commentary", "Short / medium / long distance control", "Punishing sand traps"], button: "Tee Off with Ace"
    },
    {
      id: "paworder", title: "Paw & Order", kicker: "Cushion Crimes Unit",
      description: "Search the room like a real detective, inspect suspicious objects, collect evidence, then solve the case from what you found.",
      background: "assets/living-room.webp", character: "assets/bootsie.webp",
      instructions: "Search the whole room. Tap ordinary-looking objects to inspect them—some are evidence and some are dead ends. Find all three real clues, read your evidence file, then name the only suspect who fits the facts.",
      rewards: ["Hidden evidence search", "Real deduction step", "Five mystery cases"], button: "Open the Case"
    },
    {
      id: "watch", title: "Where's Bootsie?", kicker: "Operation Watch Bootsie",
      description: "Move actual room clutter out of the way and see whether Summerville's least cooperative cat is hiding behind it.",
      background: "assets/bootsie-search-room.webp", character: "assets/bootsie.webp",
      instructions: "Search five increasingly cluttered rooms. Tap pillows, baskets, boxes and other objects to physically move them out of the way. No mystery cards—if Bootsie is behind something, you will actually uncover her.",
      rewards: ["Five search rooms", "Movable hiding places", "Speed + no-hint bonuses"], button: "Start Searching"
    },
    {
      id: "gooserescue", title: "Radar’s Goose Rescue!", kicker: "A Good Dog. A Goose in Trouble.",
      description: "Find Beau tangled beside the pond, fetch Meemaw, and lead a wildlife rescuer back along the trail.",
      background: "assets/pond-rescue.png", character: "assets/radar.png",
      instructions: "Tap the dirt trail or drag to steer Radar. Follow three clues to Beau, then run back to alert Meemaw. Time your barks to get her attention, lead the wildlife rescuer back without losing her, and keep Radar steady while she frees Beau.",
      rewards: ["Explore the pond trail", "Fetch help + lead the rescuer", "Timing challenges + rescue stars"], button: "START THE RESCUE"
    },
    {
      id: "snailmail", title: "Snail Mail: TURBO!", kicker: "Maggie Jean Goes Supersonic",
      description: "Turn the world's slowest delivery route into a ridiculous turbo dash with boost stamps, mail combos and sprinkler dodges.",
      background: "assets/backyard.webp", character: "assets/maggie-jean.webp",
      instructions: "Drag to steer Maggie Jean. Grab every letter, chain deliveries for bigger points, hit yellow TURBO stamps for a burst of ridiculous speed, dodge sprinklers and squirrels, then slam into the mailbox before time expires.",
      rewards: ["Turbo speed bursts", "Mail-chain multipliers", "Three escalating delivery sprints"], button: "ENGAGE TURBO"
    }

  ];

  const defaultProgress = { tickets: 0, games: {} };
  let progress = loadProgress();
  let currentId = null;
  let currentModule = null;
  let paused = false;
  let soundOn = true;
  let roundAction = null;
  let ignoreVisibilityPauseUntil = 0;
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

  function setGameUrl(id) {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("game", id);
    else url.searchParams.delete("game");
    window.history.replaceState({ game: id || null }, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function openGame(id, updateUrl = true) {
    const game = games.find((item) => item.id === id);
    if (!game) return false;
    cleanupGame();
    document.body.classList.add("game-setup");
    currentId = id;
    if (updateUrl) setGameUrl(id);
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
    $("pauseButton").textContent = "Ⅱ";
    coach.hidden = true;
    world.innerHTML = "";
    setHud("Ready", "—", "Best", progress.games[id]?.best || 0, "Stars", `${progress.games[id]?.stars || 0}/3`);
    return true;
  }

  function enterGameFullscreen() {
    const frame = document.querySelector(".arcade-frame");
    updateArcadeViewportHeight();
    document.body.classList.add("game-fullscreen");
    try {
      const request = frame?.requestFullscreen || frame?.webkitRequestFullscreen;
      if (request && !document.fullscreenElement && !document.webkitFullscreenElement) {
        const result = request.call(frame);
        result?.catch?.(() => {});
      }
    } catch (_) { /* iPad/Safari can use the CSS fullscreen fallback. */ }
  }

  function leaveGameFullscreen() {
    updateArcadeViewportHeight();
    document.body.classList.remove("game-fullscreen");
    try {
      if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch?.(() => {});
      else if (document.webkitFullscreenElement && document.webkitExitFullscreen) document.webkitExitFullscreen();
    } catch (_) { /* Fullscreen exit is best effort. */ }
  }

  function launchCurrentGame() {
    document.body.classList.remove("game-setup");
    ignoreVisibilityPauseUntil = Date.now() + 1800;
    enterGameFullscreen();
    instructionOverlay.hidden = true;
    resultOverlay.hidden = true;
    roundOverlay.hidden = true;
    pauseOverlay.hidden = true;
    backgroundLayer.style.filter = "none";
    paused = false;
    $("pauseButton").textContent = "Ⅱ";
    currentModule = modules[currentId]();
    currentModule.start();
    stage.focus({ preventScroll: true });
  }

  function cleanupGame() {
    if (currentModule?.destroy) currentModule.destroy();
    currentModule = null;
    paused = false;
    pauseOverlay.hidden = true;
    $("pauseButton").textContent = "Ⅱ";
    roundAction = null;
    world.innerHTML = "";
    coach.hidden = true;
    coach.classList.remove("ace-golf-coach");
    document.body.classList.remove("game-setup");
    document.querySelectorAll(".comic-pop,.combo-banner,.path-warning").forEach((el) => el.remove());
  }

  function showArcade(updateUrl = true) {
    leaveGameFullscreen();
    cleanupGame();
    currentId = null;
    if (updateUrl) setGameUrl(null);
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

  function completeGame({ score, stars, title, kicker = "Game Complete", line, tickets, playAgainLabel = "Play Again", arcadeLabel = "Choose Another Game" }) {
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
    $("playAgainButton").textContent = playAgainLabel;
    $("resultArcadeButton").textContent = arcadeLabel;
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
        {name:"Picnic Green",start:{x:40,y:70},cup:{x:75,y:23},par:3},
        {name:"Azalea Green",start:{x:49,y:76},cup:{x:75,y:23},par:3},
        {name:"Champion Green",start:{x:48,y:55},cup:{x:75,y:23},par:4}
      ];
      const aceLines={
        opening:[
          "A fresh green! Or a very tidy lawn. Either way, I own it.",
          "The cup is exactly where I expected it—once you point it out.",
          "I remember this hole perfectly. I just don't recall playing it."
        ],
        short:[
          "A cautious tap! Bold strategy for someone afraid of distance.",
          "That acorn moved. I saw it with my own two… never mind.",
          "A little farther next time. Unless the cup comes to us."
        ],
        medium:[
          "Not bad. I'd have hit it straighter, naturally. Which way is straight?",
          "Good swing! Almost exactly like the one I meant to suggest.",
          "Confident contact. Accuracy is mostly paperwork."
        ],
        long:[
          "Now THAT is confidence! Accuracy can catch up later.",
          "Give it everything! The next green might count too.",
          "Magnificent! I heard the acorn leave, so it must be good."
        ],
        sand:[
          "Excellent—straight into the beach. Sand builds character.",
          "Right where I wanted it. The cup can come to us.",
          "I call that a tactical rest in the sand."
        ],
        fringe:[
          "Perfectly played. I always take the scenic route.",
          "The green moved! I suspected as much.",
          "A boundary is merely the course admitting defeat."
        ],
        stopped:[
          "It stopped to admire my advice.",
          "Close! To something, certainly.",
          "Fine position. I can almost remember what for."
        ],
        sunk:[
          "You're welcome! I knew my coaching would reach you eventually.",
          "Just as I planned. You performed it surprisingly well.",
          "In the cup! I never doubted me for a second."
        ]
      };
      let hole=0,strokes=0,holeStrokes=0,score=0,running=false,ball=null,ballEl=null,cupEl=null,aimEl=null,targetEl=null,aiming=false,moving=false,raf=null,last=0,inSand=false,aimPower=0,lastAceTalk=0,lastGalleryBump=0;
      const pick=(lines)=>lines[Math.floor(Math.random()*lines.length)];
      function aceTalk(line,force=false){const now=performance.now();if(!force&&now-lastAceTalk<1000)return;lastAceTalk=now;addCoach(line,"assets/ace-forgetful.webp","Ace the Forgetful Golfer");}
      function start(){
        world.innerHTML="";running=true;backgroundLayer.style.backgroundImage='url("assets/acorn-green.webp")';
        coach.classList.add("ace-golf-coach");
        const caddy=create("img","course-character caddy-hack-character");caddy.src="assets/caddy-hack.webp";caddy.alt="Caddy Hack the gofer";
        runtime.on(stage,"pointerdown",down);runtime.on(stage,"pointermove",move);runtime.on(stage,"pointerup",up);runtime.on(stage,"pointercancel",up);startHole();last=performance.now();raf=runtime.frame(loop);
      }
      function startHole(){
        world.querySelectorAll(".golf-ball,.golf-hole,.power-readout,.aim-line,.aim-target,.green-label").forEach(el=>el.remove());
        ball={...greens[hole].start,vx:0,vy:0};holeStrokes=0;moving=false;aiming=false;inSand=false;aimPower=0;
        cupEl=create("div","golf-hole");place(cupEl,greens[hole].cup.x,greens[hole].cup.y,20);cupEl.setAttribute("aria-label","The cup on this green");
        ballEl=create("button","golf-ball");ballEl.type="button";ballEl.textContent="🌰";ballEl.hidden=false;ballEl.style.visibility="visible";ballEl.style.opacity="1";ballEl.setAttribute("aria-label","Acorn ball. Touch and drag toward your target.");place(ballEl,ball.x,ball.y,78);
        const label=create("div","green-label");label.textContent=`Green ${hole+1}/3 · ${greens[hole].name} · Par ${greens[hole].par}`;
        const power=create("div","power-readout");power.id="powerReadout";power.innerHTML='<b>Touch the acorn to aim</b><span class="power-track"><i id="puttPower"></i><em class="power-third short">SHORT</em><em class="power-third medium">MED</em><em class="power-third long">LONG</em></span><small>Drag the target where you want the acorn to go, then release</small>';
        update();last=performance.now();aceTalk(pick(aceLines.opening),true);
      }
      function down(event){if(paused||moving||!running)return;const p=eventPoint(event);if(distance(p,ball)<14){aiming=true;stage.setPointerCapture?.(event.pointerId);setAim(p);}}
      function move(event){if(aiming&&!paused)setAim(eventPoint(event));}
      function setAim(p){
        const dx=p.x-ball.x,dy=p.y-ball.y,raw=Math.hypot(dx,dy);if(raw<.2)return;const len=Math.min(38,raw),angle=Math.atan2(dy,dx)*180/Math.PI;
        if(!aimEl)aimEl=create("div","aim-line");
        aimEl.style.left=`${ball.x}%`;aimEl.style.top=`${ball.y}%`;aimEl.style.width=`${Math.max(5,len)}%`;aimEl.style.transform=`translateY(-50%) rotate(${angle}deg)`;
        if(!targetEl){targetEl=create("div","aim-target");targetEl.innerHTML='<span>+</span>';}
        const ratio=len/Math.max(raw,.01);const tx=ball.x+dx*ratio,ty=ball.y+dy*ratio;place(targetEl,tx,ty,47);
        aimPower=Math.round(len/38*100);const bar=$("puttPower");if(bar)bar.style.transform=`scaleX(${aimPower/100})`;
        const range=aimPower<34?"SHORT":aimPower<68?"MEDIUM":"LONG";const readout=$("powerReadout");if(readout)readout.querySelector("b").textContent=`${range} · ${aimPower}% power${inSand?" · SAND PENALTY":""}`;
      }
      function up(event){
        if(!aiming||paused)return;aiming=false;const p=eventPoint(event),dx=p.x-ball.x,dy=p.y-ball.y,raw=Math.hypot(dx,dy),len=Math.min(38,raw);aimEl?.remove();targetEl?.remove();aimEl=null;targetEl=null;
        if(len<3){resetReadout();return;}const sandShot=isSand(ball),power=Math.min(2.95,len*.078)*(sandShot ? .48 : 1);ball.vx=dx/Math.max(raw,.01)*power;ball.vy=dy/Math.max(raw,.01)*power;moving=true;strokes++;holeStrokes++;ballEl.classList.add("moving");if(sandShot){popText(ball.x,ball.y,"DIG IT OUT!");aceTalk(pick(aceLines.sand),true);}else aceTalk(pick(aimPower<34?aceLines.short:aimPower<68?aceLines.medium:aceLines.long),true);beep(185,.06,"square",.04);update();
      }
      function isSand(p){return p.x>82&&p.y>39&&p.y<76;}
      function keepOnGreen(){
        const cx=50,cy=51,rx=45,ry=38,nx=(ball.x-cx)/rx,ny=(ball.y-cy)/ry,d=Math.hypot(nx,ny);
        if(d<=1)return;ball.x=cx+nx/d*rx*.985;ball.y=cy+ny/d*ry*.985;ball.vx*=-.22;ball.vy*=-.22;popText(ball.x,ball.y,"FRINGE!");aceTalk(pick(aceLines.fringe));
      }
      function keepClearOfCharacters(now){
        let label="";
        if(ball.x<36&&ball.y>40){ball.x=36;ball.vx=Math.max(.12,Math.abs(ball.vx)*.38);ball.vy*=.68;label="ACE'S CORNER!";}
        else if(ball.x>79&&ball.y>74){ball.x=79;ball.vx=-Math.max(.12,Math.abs(ball.vx)*.38);ball.vy*=.68;label="CADDY'S CORNER!";}
        if(label&&now-lastGalleryBump>850){lastGalleryBump=now;popText(ball.x,ball.y,label);beep(155,.055,"square",.025);aceTalk("Easy there! The gallery is part of the course. I think.");}
      }
      function loop(now){
        if(!running)return;const dt=Math.min((now-last)/16.667,2);last=now;
        if(!paused&&moving){
          ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;keepOnGreen();keepClearOfCharacters(now);inSand=isSand(ball);const friction=inSand ? .82 : .968;ball.vx*=Math.pow(friction,dt);ball.vy*=Math.pow(friction,dt);place(ballEl,ball.x,ball.y,78);
          const speed=Math.hypot(ball.vx,ball.vy);if(distance(ball,greens[hole].cup)<4.2&&speed<1.1)sink();else if(speed<.035){moving=false;ball.vx=ball.vy=0;ballEl.classList.remove("moving");resetReadout();if(inSand){popText(ball.x,ball.y,"STUCK IN SAND!");aceTalk(pick(aceLines.sand),true);}else aceTalk(pick(aceLines.stopped),true);}
        }
        raf=runtime.frame(loop);
      }
      function resetReadout(){const r=$("powerReadout");if(r){r.querySelector("b").textContent=inSand?"Sand shot — use LONG power":"Touch the acorn to aim";const bar=$("puttPower");if(bar)bar.style.transform="scaleX(0)";}}
      function sink(){moving=false;ballEl.classList.add("collected");score+=Math.max(350,1800-holeStrokes*185);popText(ball.x,ball.y,holeStrokes<=greens[hole].par?"UNDER PAR!":"IN THE CUP!");aceTalk(pick(aceLines.sunk),true);beep(720,.12,"sine",.04);runtime.later(()=>{hole++;if(hole<greens.length){showRound(`Green ${hole} Complete`,`${holeStrokes} Strokes`,`Next is ${greens[hole].name}, par ${greens[hole].par}. Ace claims he remembers this one. He does not.`,`Play Green ${hole+1}`,()=>{roundOverlay.hidden=true;startHole();});}else finish();},650);}
      function update(){setHud("Green",`${hole+1}/3`,"Strokes",strokes,"Par",greens[hole]?.par||"—");}
      function finish(){running=false;score+=Math.max(0,3600-strokes*190);const stars=strokes<=9?3:strokes<=13?2:1;completeGame({score,stars,title:strokes<=9?"Squirrel Tour Qualified!":"Acorn Open Complete!",line:`“${strokes} strokes? That's exactly what I wrote down. Somewhere.”<br><b>— Ace the Forgetful Golfer</b>`});}
      return{start,stop(){running=false;},destroy(){running=false;coach.classList.remove("ace-golf-coach");runtime.clear();}};
    },

    paworder() {
      const runtime=makeRuntime();
      const cases=shuffle([
        {title:"The Crushed Cushion",answer:"Bootsie Belle",choices:["Honey Bear","Bootsie Belle","Nimble Nut"],clues:["Black fur caught in the seam","One long white whisker","A neat cat-sized sleeping dent"],props:[
          {icon:"🛋️",x:22,y:61,clue:2,label:"sofa cushion"},{icon:"🧶",x:34,y:72,label:"yarn ball"},{icon:"🪴",x:46,y:40,label:"plant"},{icon:"🖤",x:57,y:67,clue:0,label:"dark fuzz"},{icon:"📚",x:69,y:35,label:"books"},{icon:"〰️",x:79,y:57,clue:1,label:"something pale"},{icon:"🧸",x:86,y:76,label:"toy"}]},
        {title:"The Open Treat Jar",answer:"Honey Bear",choices:["Honey Bear","Caddy Hack","Maggie Jean"],clues:["Tiny treat crumbs under the table","A strand from a pink bow","Small dog paw prints by the jar"],props:[
          {icon:"🍪",x:24,y:70,clue:0,label:"crumbs"},{icon:"🥣",x:38,y:55,label:"bowl"},{icon:"🎀",x:51,y:34,clue:1,label:"ribbon"},{icon:"🪑",x:64,y:69,label:"chair"},{icon:"🐾",x:75,y:51,clue:2,label:"tracks"},{icon:"🧦",x:84,y:75,label:"sock"},{icon:"📦",x:31,y:35,label:"box"}]},
        {title:"The Acorn Golf Ball",answer:"Caddy Hack",choices:["Bootsie Belle","Caddy Hack","Nimble Nut"],clues:["A chewed golf scorecard","Mud from the practice green","A caddie-sized acorn tee"],props:[
          {icon:"⛳",x:21,y:40,clue:0,label:"scorecard"},{icon:"🌰",x:35,y:72,clue:2,label:"acorn"},{icon:"👟",x:48,y:60,label:"shoe"},{icon:"🟫",x:59,y:43,clue:1,label:"mud"},{icon:"🧢",x:72,y:67,label:"cap"},{icon:"📚",x:82,y:34,label:"books"},{icon:"🧶",x:88,y:74,label:"yarn"}]},
        {title:"The Birdseed Heist",answer:"Nimble Nut",choices:["Nimble Nut","Honey Bear","Maggie Jean"],clues:["Sunflower seeds leading toward the window","An empty acorn cap","Tiny squirrel claw marks on the sill"],props:[
          {icon:"🌻",x:20,y:63,clue:0,label:"seeds"},{icon:"🌰",x:33,y:37,clue:1,label:"acorn cap"},{icon:"🪟",x:48,y:30,clue:2,label:"window sill"},{icon:"🧸",x:61,y:72,label:"toy"},{icon:"📦",x:73,y:55,label:"box"},{icon:"🧺",x:84,y:70,label:"basket"},{icon:"🧶",x:89,y:39,label:"yarn"}]},
        {title:"The Slow Delivery",answer:"Maggie Jean",choices:["Caddy Hack","Bootsie Belle","Maggie Jean"],clues:["A damp corner on the parcel","A shiny trail across the floor","A shell-shaped impression in the wrapping"],props:[
          {icon:"📦",x:22,y:68,clue:0,label:"parcel"},{icon:"💧",x:37,y:47,clue:1,label:"shiny trail"},{icon:"🐚",x:52,y:73,clue:2,label:"shell mark"},{icon:"🪴",x:65,y:40,label:"plant"},{icon:"📚",x:77,y:67,label:"books"},{icon:"🧦",x:86,y:44,label:"sock"},{icon:"🧸",x:32,y:31,label:"toy"}]},
        {title:"The Unraveled Yarn",answer:"Bootsie Belle",choices:["Honey Bear","Bootsie Belle","Caddy Hack"],clues:["Loose yarn snagged high on the shelf","Black fur tangled in the fibers","A single white whisker beside the spool"],props:[
          {icon:"🧶",x:22,y:72,clue:0,label:"yarn"},{icon:"🖤",x:38,y:51,clue:1,label:"dark fur"},{icon:"〰️",x:53,y:65,clue:2,label:"pale strand"},{icon:"📚",x:67,y:32,label:"shelf"},{icon:"🪑",x:78,y:70,label:"chair"},{icon:"🧸",x:87,y:48,label:"toy"},{icon:"📦",x:33,y:33,label:"box"}]}
      ]).slice(0,5);
      let index=0,correct=0,score=0,time=30,streak=0,running=false,answered=false,clockActive=false,found=0,inspected=0;
      function start(){world.innerHTML="";running=true;showCase();runtime.every(()=>{if(paused||!running||answered||!clockActive)return;time--;update();const fill=$("caseTimerFill");if(fill)fill.style.transform=`scaleX(${time/30})`;if(time<=6)document.querySelector(".case-clock")?.classList.add("urgent");if(time<=0){answered=true;clockActive=false;streak=0;popText(50,20,"CASE WENT COLD!");runtime.later(next,900);}},1000);}
      function showCase(){
        world.innerHTML="";answered=false;clockActive=false;found=0;inspected=0;time=30;const item=cases[index];
        const guide=create("div","case-guide mystery-guide");guide.innerHTML=`<b>CASE ${index+1}/5 · ${item.title}</b><span>Search ordinary objects. Three hide real evidence.</span>`;
        const dossier=create("div","case-dossier");dossier.innerHTML=`<div class="case-dossier-head"><div><small>EVIDENCE FILE</small><strong>${item.title}</strong></div><span id="inspectCount">0 inspected</span></div><div class="evidence-slots" id="evidenceSlots"><span>Clue 1: ?</span><span>Clue 2: ?</span><span>Clue 3: ?</span></div><div class="deduction-row"><div class="case-clock"><span id="caseClockText">Search first · accusation clock is stopped</span><i><em id="caseTimerFill"></em></i></div><div class="suspects" id="suspects"></div></div>`;
        const suspects=dossier.querySelector("#suspects");
        shuffle(item.choices).forEach((name)=>{const btn=document.createElement("button");btn.type="button";btn.className="suspect-button";btn.textContent=name;btn.disabled=true;suspects.appendChild(btn);runtime.on(btn,"click",()=>answer(name,btn,dossier));});
        item.props.forEach((prop)=>{const btn=create("button","scene-prop");btn.type="button";btn.innerHTML=`<span>${prop.icon}</span>`;btn.setAttribute("aria-label",`Inspect ${prop.label}`);const sceneY=10+prop.y*.62;place(btn,prop.x,sceneY,44+Math.round(sceneY/8));runtime.on(btn,"click",()=>inspect(btn,prop,dossier));});
        update();
      }
      function inspect(button,prop,dossier){
        if(paused||answered||button.classList.contains("checked"))return;button.classList.add("checked");inspected++;button.setAttribute("aria-label",`${prop.label} inspected`);const count=$("inspectCount");if(count)count.textContent=`${inspected} inspected`;
        if(Number.isInteger(prop.clue)){found++;score+=140;button.classList.add("evidence");button.innerHTML=`<span>${prop.icon}</span><b>CLUE</b>`;const slots=[...dossier.querySelectorAll("#evidenceSlots span")];slots[prop.clue].textContent=`Clue ${prop.clue+1}: ${cases[index].clues[prop.clue]}`;popText(prop.x,parseFloat(button.style.top)-7,"EVIDENCE!");beep(560+found*70,.08,"sine",.04);}else{button.classList.add("dead-end");popText(prop.x,parseFloat(button.style.top)-6,"Nothing useful");beep(190,.035,"square",.016);}
        if(found===3){clockActive=true;dossier.classList.add("ready");dossier.querySelectorAll(".suspect-button").forEach(btn=>btn.disabled=false);const t=$("caseClockText");if(t)t.textContent="All evidence secured · 30 seconds to accuse";document.querySelector(".mystery-guide").innerHTML=`<b>DEDUCTION TIME</b><span>Read the three clues and name the only suspect who fits.</span>`;popText(50,18,"SOLVE THE CASE!");}update();
      }
      function answer(name,button,dossier){
        if(answered||paused||!clockActive)return;answered=true;clockActive=false;const item=cases[index];dossier.querySelectorAll("button").forEach(btn=>btn.disabled=true);const right=name===item.answer;
        if(right){correct++;streak++;score+=650+time*28+streak*90;button.classList.add("correct");popText(50,20,streak>=2?`${streak}× DETECTIVE STREAK!`:"CASE CLOSED!");beep(680,.1,"sine",.045);}else{streak=0;button.classList.add("wrong");[...dossier.querySelectorAll(".suspect-button")].find(btn=>btn.textContent===item.answer)?.classList.add("correct");popText(50,20,"WRONG SUSPECT!");beep(120,.14,"sawtooth",.04);}runtime.later(next,1100);
      }
      function next(){index++;if(index>=cases.length)finish();else showCase();}
      function update(){setHud("Case",`${index+1}/5`,`Evidence`,`${found}/3`,clockActive?"Time":"Inspected",clockActive?time:inspected);}
      function finish(){running=false;score+=correct*250;const stars=correct===5?3:correct>=4?2:correct>=3?1:0;completeGame({score,stars,title:correct===5?"Master Detective!":"Court Is Adjourned!",line:correct===5?"“Annoyingly competent. You may keep the badge.”<br><b>— Bootsie Belle</b>":`“${correct} cases solved. The remaining suspects have retained counsel.”<br><b>— Bootsie Belle</b>`});}
      return{start,stop(){running=false;},destroy(){running=false;runtime.clear();}};
    },

    watch() {
      const runtime=makeRuntime();
      const spots=[{x:18,y:33,icon:"🧺",label:"laundry basket"},{x:31,y:58,icon:"📦",label:"moving box"},{x:44,y:37,icon:"🎁",label:"large gift box"},{x:55,y:66,icon:"🧳",label:"suitcase"},{x:67,y:37,icon:"🪴",label:"large plant"},{x:80,y:55,icon:"🛍️",label:"shopping bags"},{x:22,y:73,icon:"🧺",label:"blanket basket"},{x:40,y:76,icon:"📦",label:"storage box"},{x:61,y:76,icon:"🧳",label:"travel bag"},{x:76,y:72,icon:"🎁",label:"package"},{x:88,y:34,icon:"🧥",label:"coat pile"},{x:51,y:24,icon:"🪴",label:"floor plant"}];
      let room=0,score=0,running=false,time=0,timer=null,target=-1,moves=0,hints=0,found=false;
      function start(){backgroundLayer.style.backgroundImage='url("assets/bootsie-search-room.webp")';running=true;timer=runtime.every(tick,1000);startRoom();}
      function startRoom(){
        world.innerHTML="";found=false;moves=0;time=38-room*3;target=Math.floor(Math.random()*(7+room));const count=8+room;
        const status=create("div","watch-status");status.id="watchStatus";status.innerHTML=`<b>Room ${room+1}/5:</b> Move the clutter. Then tap Bootsie!`;
        const hint=create("button","hint-button");hint.type="button";hint.textContent="💡 Hint −200";runtime.on(hint,"click",useHint);
        const cat=create("button","hidden-bootsie");cat.type="button";cat.innerHTML='<img src="assets/bootsie.webp" alt="Bootsie Belle">';cat.setAttribute("aria-label","Bootsie Belle—found her!");place(cat,spots[target].x,spots[target].y,34);runtime.on(cat,"click",catchBootsie);
        shuffle(spots.slice(0,count).map((spot,i)=>({...spot,original:i}))).forEach((spot)=>{const btn=create("button","search-object");btn.type="button";btn.innerHTML=`<span>${spot.icon}</span>`;btn.setAttribute("aria-label",`Move the ${spot.label} and look behind it`);place(btn,spot.x,spot.y,spot.original===target?48:42+spot.original);runtime.on(btn,"click",()=>moveObject(btn,spot.original===target));});
        update();
      }
      function moveObject(button,isTarget){
        if(paused||!running||found||button.classList.contains("moved"))return;moves++;button.classList.add("moved");button.style.setProperty("--move-x",`${button.offsetLeft<stage.clientWidth/2?-95:95}px`);score=Math.max(0,score-8);
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

    gooserescue() {
      const runtime = makeRuntime();
      const clues = [
        {x:30,y:70,icon:"feather",name:"A goose feather",message:"A feather on the trail. Radar has a scent!"},
        {x:51,y:54,icon:"line",name:"Discarded fishing line",message:"Fishing line leads toward the reeds. Someone needs help."},
        {x:74,y:44,icon:"paws",name:"A distressed honk",message:"Beau is tangled at the pond bank! Go back and alert Meemaw."}
      ];
      const rocks = [{x:40,y:64,r:4},{x:64,y:57,r:4}];
      const home = {x:13,y:81}, goose = {x:84,y:45};
      let running=false, phase=0, clue=0, score=0, errors=0, barks=0, cuts=0, elapsed=0;
      let clock=0, last=0, hitAt=-10, cooldown=0, meter=.5, radar, worker, meemaw, beau, belle;
      let target={x:18,y:82}, trail=[], leadWaiting=false, clueEl, marker, action, heading, message, meterBox, needle, meterWindow;
      let walking=false, pressing=false, settle=0;
      const phaseNames=["Find Beau","Fetch Meemaw","Raise the alarm","Lead the rescuer","Free Beau","Beau is safe"];
      function actor(file,name,x,y,cls){
        const el=create("div",`pond-actor ${cls}`);el.innerHTML=`<img src="assets/${file}" alt="${name}"><span>${name}</span>`;
        const a={el,x,y};draw(a);return a;
      }
      function draw(a){place(a.el,a.x,a.y,Math.round(a.y));}
      function dist(a,b){return Math.hypot((a.x-b.x)*1.35,a.y-b.y);}
      function hint(text){message.textContent=text;announcement.textContent=text;}
      function setPhase(next,text){
        phase=next;world.dataset.rescuePhase=String(phase);heading.textContent=phaseNames[phase];hint(text);
        radar.el.classList.remove("walking");walking=false;target={x:radar.x,y:radar.y};pressing=false;cooldown=0;
        meterBox.hidden=phase!==2&&phase!==4;
        marker.hidden=phase===2||phase>=4;
        if(phase===1)place(marker,home.x,home.y,3);
        if(phase===3)place(marker,76,48,3);
        action.disabled=false;update();
      }
      function start(){
        running=true;world.innerHTML="";world.classList.add("pond-world");stage.classList.add("pond-stage");coach.hidden=true;
        const brief=create("div","pond-brief");brief.innerHTML='<small>RADAR’S POND-BANK RESCUE</small><strong id="pondHeading"></strong><p id="pondMessage" role="status"></p>';
        heading=$("pondHeading");message=$("pondMessage");
        rocks.forEach(r=>{const rock=create("div","pond-rock pond-prop prop-rock");place(rock,r.x,r.y,Math.round(r.y));});
        marker=create("div","pond-destination");marker.innerHTML='<span class="pond-prop prop-paws"></span>';marker.setAttribute("aria-hidden","true");
        meemaw=actor("meemaw.png","Meemaw",home.x,home.y,"pond-meemaw pond-facing-opposite");
        beau=actor("beau.png","Beau",goose.x,goose.y,"pond-goose tangled");beau.el.hidden=true;
        belle=actor("belle.png","Belle",91,51,"pond-goose");belle.el.hidden=true;
        radar=actor("radar.png","Radar",18,82,"pond-radar pond-facing-opposite");
        const controls=create("div","pond-controls");
        meterBox=create("div","pond-meter-box",controls);meterBox.innerHTML='<small id="pondMeterLabel">Tap when the marker reaches the gold zone</small><div class="pond-meter"><i class="pond-meter-window"></i><b class="pond-meter-needle"></b></div>';meterBox.hidden=true;
        needle=meterBox.querySelector(".pond-meter-needle");meterWindow=meterBox.querySelector(".pond-meter-window");
        action=create("button","pond-action",controls);action.type="button";runtime.on(action,"click",interact);
        const help=create("span","pond-control-help",controls);help.textContent="Tap the trail or drag to move · Arrow keys / WASD · Timed taps stay at the bottom";
        runtime.on(stage,"pointerdown",e=>{if(!running||paused||e.target.closest("button,.overlay,.pond-controls,.pond-brief"))return;pressing=true;moveTarget(e);stage.setPointerCapture?.(e.pointerId);});
        runtime.on(stage,"pointermove",e=>{if(pressing&&!paused)moveTarget(e);});
        runtime.on(stage,"pointerup",()=>{pressing=false;});runtime.on(stage,"pointercancel",()=>{pressing=false;});
        runtime.on(window,"keydown",e=>{if(e.key==="Enter"&&!e.repeat&&document.activeElement!==action)interact();});
        setPhase(0,"Steer Radar to the feather on the dirt trail. The clue triggers when he reaches it.");showClue();last=performance.now();runtime.frame(loop);
      }
      function moveTarget(e){if(![0,1,3].includes(phase))return;const p=eventPoint(e);target={x:Math.max(8,Math.min(92,p.x)),y:Math.max(39,Math.min(84,p.y))};}
      function showClue(){
        clueEl?.remove();const c=clues[clue];clueEl=create("div","pond-clue");clueEl.innerHTML=`<span class="pond-prop prop-${c.icon}"></span><small>${c.name}</small>`;place(clueEl,c.x,c.y,8);place(marker,c.x,c.y,3);
      }
      function stepActor(a,destination,speed,dt){
        const dx=destination.x-a.x,dy=destination.y-a.y,d=Math.hypot(dx,dy);if(d<.2)return false;
        const amount=Math.min(speed*dt,d);let nx=a.x+dx/d*amount,ny=a.y+dy/d*amount;
        for(const r of rocks){const vx=(nx-r.x)*1.35,vy=ny-r.y,rd=Math.hypot(vx,vy);if(rd<r.r){
          nx=r.x+(vx/(rd||1))*(r.r+.05)/1.35;ny=r.y+(vy/(rd||1))*(r.r+.05);
          if(a===radar&&clock-hitAt>2){errors++;hitAt=clock;score=Math.max(0,score-35);popText(a.x,a.y-7,"AROUND THE ROCK!");}
        }}
        a.x=Math.max(8,Math.min(92,nx));a.y=Math.max(39,Math.min(84,ny));draw(a);return true;
      }
      function interact(){
        if(!running||paused||cooldown>0||action.disabled)return;
        if(phase===0&&dist(radar,clues[clue])<7){
          score+=350;beep(640+clue*70,.1);hint(clues[clue].message);clue++;
          if(clue<3)showClue();else{clueEl.remove();beau.el.hidden=false;belle.el.hidden=false;setPhase(1,"Beau’s foot is caught in fishing line. Leave him where he is—run back along the trail to Meemaw!");}
        }else if(phase===1&&dist(radar,home)<10){
          barks=0;setPhase(2,"Meemaw hasn’t noticed the emergency. Time three barks in the gold zone to get her attention.");
        }else if(phase===2){
          if(meter>=.32&&meter<=.68){barks++;score+=250;popText(radar.x,radar.y-10,"WOOF!");beep(230,.09,"square",.035);cooldown=.5;
            if(barks===3){cooldown=2;action.disabled=true;hint("Meemaw: “Something’s wrong? I’m calling wildlife rescue. Show us the way, Radar!”");}}
          else{errors++;cooldown=.55;hint("Try again when the marker reaches the gold zone. Three clear barks will get her attention.");beep(150,.08);}
        }else if(phase===3&&dist(radar,{x:76,y:48})<10&&dist(worker,goose)<19){
          worker.x=75;worker.y=49;draw(worker);meemaw.x=68;meemaw.y=62;draw(meemaw);radar.x=62;radar.y=75;draw(radar);
          setPhase(4,"The rescuer is beside Beau. Keep Radar still: tap Steady when the marker is in the gold zone so she can make four careful snips.");
        }else if(phase===4){
          const half=.20-cuts*.025;
          if(meter>=.5-half&&meter<=.5+half){cuts++;score+=600;cooldown=.75;beau.el.style.setProperty("--line-opacity",String(1-cuts/4));worker.el.classList.add("snipping");settle=.5;
            popText(goose.x,goose.y-8,"SNIP!");beep(760,.1);hint(`${cuts} of 4 loops removed. ${cuts<4?"Let the rescuer settle, then time the next steady moment.":"The fishing line is off! Beau can stand freely again."}`);
            if(cuts===4){beau.el.classList.remove("tangled");setPhase(5,"Beau is free! Belle hurries over while the rescue worker checks him. Good boy, Radar!");cooldown=2;}}
          else{errors++;cooldown=.65;hint("Radar fidgeted. The rescuer waits—no harm done. Try again inside the gold zone.");beep(150,.08);}
        }else if(phase===5){finish();}
        update();
      }
      function checkArrival(){
        if(cooldown>0)return;
        if(phase===0&&dist(radar,clues[clue])<7)interact();
        else if(phase===1&&dist(radar,home)<10)interact();
        else if(phase===3&&dist(radar,{x:76,y:48})<10&&dist(worker,goose)<19)interact();
      }
      function arrive(){
        worker=actor("wildlife-rescuer.png","Wildlife rescue",15,81,"pond-worker pond-facing-opposite");
        trail=[{x:radar.x,y:radar.y}];setPhase(3,"The rescue worker has arrived! Lead her to Beau’s paw marker. If you run too far ahead, return to her so she can follow.");
      }
      function loop(now){
        if(!running)return;const dt=Math.min((now-last)/1000,.05);last=now;
        if(!paused&&roundOverlay.hidden&&resultOverlay.hidden){
          clock+=dt;elapsed+=dt;cooldown=Math.max(0,cooldown-dt);settle=Math.max(0,settle-dt);worker?.el.classList.toggle("snipping",settle>0);
          if([0,1,3].includes(phase)){
            let kx=0,ky=0;if(heldKeys.has("ArrowLeft")||heldKeys.has("a"))kx--;if(heldKeys.has("ArrowRight")||heldKeys.has("d"))kx++;if(heldKeys.has("ArrowUp")||heldKeys.has("w"))ky--;if(heldKeys.has("ArrowDown")||heldKeys.has("s"))ky++;
            if(kx||ky)target={x:radar.x+kx*8,y:radar.y+ky*8};
            walking=stepActor(radar,target,phase===3?18:24,dt);radar.el.classList.toggle("walking",walking);
          }
          if(phase===3){
            const tail=trail[trail.length-1];if(!tail||dist(radar,tail)>1.5)trail.push({x:radar.x,y:radar.y});
            const gap=dist(radar,worker);const waiting=gap>(leadWaiting?23:30);
            if(waiting!==leadWaiting){leadWaiting=waiting;hint(waiting?"She lost sight of Radar! Go back closer to the rescue worker, then lead her onward.":"She can see Radar again. Lead her along the dirt trail to Beau.");}
            if(!leadWaiting&&trail.length){const p=trail[0];if(dist(worker,p)<2)trail.shift();else if(gap>6)stepActor(worker,p,13,dt);}
            meemaw.x=worker.x-5;meemaw.y=Math.min(84,worker.y+5);draw(meemaw);
          }
          if([0,1,3].includes(phase))checkArrival();
          if(phase===2||phase===4){meter=.5+Math.sin(clock*(phase===2?2.5:2.7+cuts*.28))*.47;needle.style.left=`${meter*100}%`;const half=phase===2?.18:.20-cuts*.025;meterWindow.style.left=`${(0.5-half)*100}%`;meterWindow.style.width=`${half*200}%`;}
          if(phase===2&&barks===3&&cooldown===0)arrive();
          if(phase===5){belle.x=Math.max(89,belle.x-dt*2);belle.y=Math.max(46,belle.y-dt*2);draw(belle);}
          update();
        }
        runtime.frame(loop);
      }
      function update(){
        const values=[`${clue}/3 clues`,"Find Meemaw",`${barks}/3 barks`,leadWaiting?"Come back!":"Stay together",`${cuts}/4 snips`,"Reunited"];
        setHud("Rescue",`${phase<2?phase+1:phase===2?2:phase===3?3:4}/4`,"Goal",values[phase],"Score",score);
        const labels=["Sniff the clue","Alert Meemaw",barks===3?"Calling wildlife rescue…":`Bark! (${barks}/3)`,"Show her Beau","Steady, Radar!","Celebrate the rescue"];
        action.textContent=labels[phase];
        action.hidden=phase===0||phase===1||phase===3;
        action.disabled=cooldown>0||(phase===0&&dist(radar,clues[clue])>=7)||(phase===1&&dist(radar,home)>=10)||(phase===3&&(dist(radar,{x:76,y:48})>=10||dist(worker,goose)>=19));
        if(phase===0&&action.disabled)action.textContent="Move Radar closer to sniff";
        if(phase===1&&action.disabled)action.textContent="Return to Meemaw on the left";
        if(phase===3&&action.disabled)action.textContent=leadWaiting?"Go back for the rescue worker":"Lead her to Beau’s paw marker";
        if(phase===4&&cooldown>0)action.textContent="The rescuer is settling Beau…";
      }
      function finish(){if(!running)return;running=false;score+=Math.max(0,1200-Math.floor(elapsed)*5);const stars=errors<=2?3:errors<=6?2:1;
        completeGame({score,stars,title:"A GOOD DOG. A GOOSE SAVED.",line:`Radar found Beau, fetched Meemaw, and led the wildlife rescuer to the pond bank.<br><b>Beau and Belle are together again!</b><br><small>${errors} misstep${errors===1?"":"s"} · ${Math.round(elapsed)} seconds · ${stars===3?"Excellent rescue teamwork!":"Try again for a smoother rescue."}</small>`});}
      return{start,stop(){running=false;},destroy(){running=false;runtime.clear();world.classList.remove("pond-world");delete world.dataset.rescuePhase;stage.classList.remove("pond-stage");}};
    },

    snailmail() {
      const runtime=makeRuntime();
      const levels=[
        {name:"Porch Launch",time:34,mail:5,turbos:2,hazards:1,blockers:0,max:1.02},
        {name:"Sprinkler Speedway",time:31,mail:6,turbos:3,hazards:2,blockers:1,max:1.10},
        {name:"Parcel Hyperdrive",time:29,mail:7,turbos:4,hazards:3,blockers:2,max:1.18}
      ];
      const spots=[{x:16,y:30},{x:27,y:43},{x:39,y:56},{x:51,y:35},{x:61,y:65},{x:72,y:45},{x:82,y:70},{x:33,y:72},{x:47,y:77},{x:68,y:27},{x:84,y:38},{x:20,y:63},{x:56,y:52},{x:75,y:78},{x:43,y:27},{x:13,y:48},{x:89,y:57},{x:58,y:82},{x:31,y:22}];
      let level=0,running=false,time=0,score=0,player,mail=[],boosts=[],hazards=[],blockers=[],mailHit=0,chain=0,bestChain=0,turboUntil=0,last=0,totalHits=0;
      function start(){running=true;runtime.every(tick,1000);startLevel();}
      function startLevel(){
        world.innerHTML="";const cfg=levels[level];time=cfg.time;mailHit=0;chain=0;turboUntil=0;mail=[];boosts=[];hazards=[];blockers=[];
        player=movingCharacter(runtime,{image:"assets/maggie-jean.webp",className:"maggie-player turbo-maggie",x:10,y:82,speed:.34,maxSpeed:cfg.max,minX:6,maxX:94,minY:16,maxY:89});
        const needed=cfg.mail+cfg.turbos+cfg.hazards+cfg.blockers;
        const chosen=shuffle(spots);let cursor=0;
        if(chosen.length<needed){running=false;completeGame({score,stars:0,title:"Delivery Route Needs Repair",line:"Maggie Jean found more deliveries than route locations. Please restart the game."});return;}
        for(let i=0;i<cfg.mail;i++){const pos=chosen[cursor++];const el=create("div","mail-item turbo-mail");el.textContent=i%3===2?"📦":"✉️";place(el,pos.x,pos.y,34);mail.push({...pos,hit:false,el,parcel:i%3===2});}
        for(let i=0;i<cfg.turbos;i++){const pos=chosen[cursor++];const el=create("div","turbo-stamp");el.innerHTML="⚡<b>TURBO</b>";place(el,pos.x,pos.y,36);boosts.push({...pos,hit:false,el});}
        for(let i=0;i<cfg.hazards;i++){const pos=chosen[cursor++];const el=create("div","sprinkler turbo-hazard");el.textContent="💦";place(el,pos.x,pos.y,31);hazards.push({...pos,baseX:pos.x,phase:i*2.2,hitAt:0,el});}
        for(let i=0;i<cfg.blockers;i++){const pos=chosen[cursor++];const el=create("div","route-blocker turbo-blocker");el.textContent="🐿️";place(el,pos.x,pos.y,40);blockers.push({...pos,baseY:pos.y,phase:i*2.7,hitAt:0,el});}
        const goal=create("div","turbo-mailbox");goal.textContent="📫";place(goal,90,20,48);
        const banner=create("div","route-banner turbo-banner");banner.innerHTML=`Sprint ${level+1}/3 · <b>${cfg.name}</b><span id="turboReadout">Find a TURBO stamp!</span>`;
        update();last=performance.now();runtime.frame(loop);
      }
      function tick(){if(paused||!running)return;time--;if(time<=8)document.querySelector(".turbo-banner")?.classList.add("urgent");update();if(time<=0)finish(false);}
      function loop(now){
        if(!running)return;const dt=Math.min((now-last)/16.667,2.2);last=now;if(!paused){const cfg=levels[level];const turbo=now<turboUntil;player.update(dt, turbo ? .58 : .34, turbo ? cfg.max*1.85 : cfg.max);player.el.classList.toggle("turboing",turbo);
          mail.forEach(item=>{if(!item.hit&&distance(player.state,item)<7){item.hit=true;item.el.classList.add("collected");mailHit++;chain++;bestChain=Math.max(bestChain,chain);const gain=(item.parcel?420:260)*(1+Math.min(chain-1,4)*.25);score+=gain;popText(item.x,item.y,chain>=3?`${chain}× MAIL CHAIN!`:item.parcel?"PARCEL!":"DELIVERED!");beep(610+chain*35,.065,"sine",.035);update();}});
          boosts.forEach(boost=>{if(!boost.hit&&distance(player.state,boost)<8){boost.hit=true;boost.el.classList.add("used");turboUntil=Math.max(turboUntil,now)+3800;score+=350;time=Math.min(time+2,cfg.time+5);const read=$("turboReadout");if(read)read.textContent="⚡ TURBO ACTIVE!";popText(boost.x,boost.y,"TURBOOO!");beep(820,.13,"square",.045);}});
          hazards.forEach(h=>{h.x=h.baseX+Math.sin(now/620+h.phase)*(6+level*1.4);place(h.el,h.x,h.y);if(now-h.hitAt>1050&&distance(player.state,h)<8)hit(h,"SPLASH!",2);});
          blockers.forEach(h=>{h.y=h.baseY+Math.sin(now/540+h.phase)*8;place(h.el,h.x,h.y);if(now-h.hitAt>1050&&distance(player.state,h)<8)hit(h,"SQUIRREL JAM!",2);});
          if(now>=turboUntil){const read=$("turboReadout");if(read)read.textContent=boosts.some(b=>!b.hit)?"Find a TURBO stamp!":"Turbo spent — finish the mail!";}
          if(mailHit===cfg.mail&&distance(player.state,{x:90,y:20})<8)completeLevel();
        }runtime.frame(loop);
      }
      function hit(h,label,penalty){h.hitAt=performance.now();totalHits++;chain=0;time=Math.max(0,time-penalty);score=Math.max(0,score-100);player.state.vx*=-1.8;player.state.vy*=-1.8;popText(h.x,h.y,label);beep(115,.12,"sawtooth",.04);update();}
      function completeLevel(){if(!running)return;const cfg=levels[level];score+=time*45+bestChain*90;const finished=level+1;if(finished>=levels.length){finish(true);return;}level=finished;running=false;showRound(`Sprint ${finished} Delivered`,"Mailbox Slammed!",`Next: ${levels[level].name}. More mail, more TURBO stamps, and more things trying to ruin Maggie Jean's land-speed record.`,`Launch Sprint ${level+1}`,()=>{roundOverlay.hidden=true;running=true;startLevel();});}
      function update(){const need=levels[level]?.mail||0;const turbo=Math.max(0,Math.ceil((turboUntil-performance.now())/1000));setHud("Sprint",`${Math.min(level+1,3)}/3`,"Mail",`${mailHit}/${need}`,turbo>0?"TURBO":"Time",turbo>0?`${turbo}s`:time);}
      function finish(won){if(!running)return;running=false;const stars=won?(totalHits===0&&bestChain>=5?3:totalHits<=3?2:1):(level>=1?1:0);completeGame({score,stars,kicker:won?"Three Sprints Delivered":"Delivery Run Ended",title:won?"SNAIL MAIL WENT SUPERSONIC!":"Turbo Delivery Wipeout!",line:won?`“I have filed a formal complaint with the laws of physics.”<br><b>— Bootsie Belle</b><br><small>What would you like to play next?</small>`:`“At least traditional snail mail has fewer sprinkler incidents.”<br><b>— Bootsie Belle</b>`,playAgainLabel:"Play Snail Mail Again",arcadeLabel:"Play a Different Game"});}
      return{start,stop(){running=false;},destroy(){running=false;runtime.clear();}};
    },


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
  document.addEventListener("fullscreenchange",()=>{updateArcadeViewportHeight();if(!document.fullscreenElement&&currentModule)document.body.classList.add("game-fullscreen");});
  document.addEventListener("webkitfullscreenchange",()=>{updateArcadeViewportHeight();if(!document.webkitFullscreenElement&&currentModule)document.body.classList.add("game-fullscreen");});
  document.addEventListener("visibilitychange",()=>{
    if(Date.now()<ignoreVisibilityPauseUntil||!document.hidden||!currentModule||paused||!resultOverlay.hidden||!roundOverlay.hidden||!instructionOverlay.hidden)return;
    setTimeout(()=>{if(Date.now()>=ignoreVisibilityPauseUntil&&document.hidden&&currentModule&&!paused&&resultOverlay.hidden&&roundOverlay.hidden&&instructionOverlay.hidden)togglePause(true);},250);
  });

  window.addEventListener("popstate",()=>{
    const requested = new URLSearchParams(window.location.search).get("game");
    if (requested && games.some((game)=>game.id===requested)) openGame(requested,false);
    else showArcade(false);
  });

  renderArcade();
  const requestedGame = new URLSearchParams(window.location.search).get("game");
  if (requestedGame && !openGame(requestedGame,false)) setGameUrl(null);
  if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js?v=24").catch(()=>{}));
})();
