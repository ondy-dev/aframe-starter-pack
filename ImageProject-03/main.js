// ── Backrooms room builder ──────────────────────────────────────────────────
(function () {
  const COLS = 6;
  const ROWS = 6;
  const ROOM_W = 6.5;
  const ROOM_D = 6.5;
  const WALL_H = 2.55;
  const DOOR_W = 1.55;
  const EXTRA_OPENING_CHANCE = 0.35;

  const START_X = -(COLS * ROOM_W) / 2;
  const START_Z = 0;

  const env = document.getElementById('env');

  function make(tag, attrs) {
    const el = document.createElement(tag);
    for (const key in attrs) el.setAttribute(key, attrs[key]);
    env.appendChild(el);
    return el;
  }

  function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // normal rooms are much more common than anomalies
  function getRoomType() {
    const types = [
      'normal','normal','normal','normal','normal',
      'normal','normal','normal','normal','normal',
      'low','low','high','pit','dark','flooded'
    ];
    return types[Math.floor(Math.random() * types.length)];
  }

  function getWallColor(type) {
    if (type === 'flooded') return '#9faa72';
    if (type === 'dark') return '#8b7748';
    return '#c8a42c';
  }

  function getFloorColor(type) {
    if (type === 'flooded') return '#1a2010';
    return '#3e3018';
  }

  function getCeilingHeight(type) {
    if (type === 'low') return 1.9;
    if (type === 'high') return 5.0;
    if (type === 'mega') return 4.0;
    if (type === 'supermega') return 7.0;
    return WALL_H;
  }

  function addFloor(x, z, type) {
    make('a-plane', {
      position: `${x} 0 ${z}`, rotation: '-90 0 0',
      width: ROOM_W, height: ROOM_D,
      material: `color: ${getFloorColor(type)}; roughness: 1; side: double`
    });
  }

  function addCeiling(x, z, height, type) {
    make('a-plane', {
      position: `${x} ${height} ${z}`, rotation: '90 0 0',
      width: ROOM_W, height: ROOM_D,
      material: `color: ${type === 'dark' ? '#111008' : '#d0c468'}; roughness: 0.75; side: double`
    });
  }

  function addWallNS(x, z, width, open, wallHeight, doorHeight, type) {
    const color = getWallColor(type);
    if (!open) {
      make('a-plane', {
        position: `${x} ${wallHeight / 2} ${z}`, rotation: '0 0 0',
        width, height: wallHeight,
        material: `color: ${color}; roughness: 0.9; side: double`
      });
      return;
    }
    const sideW = (width - DOOR_W) / 2;
    make('a-plane', {
      position: `${x - DOOR_W / 2 - sideW / 2} ${wallHeight / 2} ${z}`, rotation: '0 0 0',
      width: sideW, height: wallHeight,
      material: `color: ${color}; roughness: 0.9; side: double`
    });
    make('a-plane', {
      position: `${x + DOOR_W / 2 + sideW / 2} ${wallHeight / 2} ${z}`, rotation: '0 0 0',
      width: sideW, height: wallHeight,
      material: `color: ${color}; roughness: 0.9; side: double`
    });
    const topH = wallHeight - doorHeight;
    if (topH > 0) {
      make('a-plane', {
        position: `${x} ${doorHeight + topH / 2} ${z}`, rotation: '0 0 0',
        width: DOOR_W, height: topH,
        material: `color: ${color}; roughness: 0.9; side: double`
      });
    }
  }

  function addWallEW(x, z, depth, open, wallHeight, doorHeight, type) {
    const color = getWallColor(type);
    if (!open) {
      make('a-plane', {
        position: `${x} ${wallHeight / 2} ${z}`, rotation: '0 90 0',
        width: depth, height: wallHeight,
        material: `color: ${color}; roughness: 0.9; side: double`
      });
      return;
    }
    const sideD = (depth - DOOR_W) / 2;
    make('a-plane', {
      position: `${x} ${wallHeight / 2} ${z - DOOR_W / 2 - sideD / 2}`, rotation: '0 90 0',
      width: sideD, height: wallHeight,
      material: `color: ${color}; roughness: 0.9; side: double`
    });
    make('a-plane', {
      position: `${x} ${wallHeight / 2} ${z + DOOR_W / 2 + sideD / 2}`, rotation: '0 90 0',
      width: sideD, height: wallHeight,
      material: `color: ${color}; roughness: 0.9; side: double`
    });
    const topH = wallHeight - doorHeight;
    if (topH > 0) {
      make('a-plane', {
        position: `${x} ${doorHeight + topH / 2} ${z}`, rotation: '0 90 0',
        width: DOOR_W, height: topH,
        material: `color: ${color}; roughness: 0.9; side: double`
      });
    }
  }

  function addTrim(x, z, eastX, southZ) {
    make('a-box', {
      position: `${x} 0.06 ${southZ}`,
      width: ROOM_W, height: 0.12, depth: 0.04,
      material: 'color: #2a1e08'
    });
    make('a-box', {
      position: `${eastX} 0.06 ${z}`,
      width: 0.04, height: 0.12, depth: ROOM_D,
      material: 'color: #2a1e08'
    });
  }

  function addLight(x, z, height, type) {
    if (type === 'dark') {
      const light = make('a-light', {
        type: 'point', color: '#504010', intensity: 0.12,
        distance: ROOM_W, position: `${x} ${height - 0.3} ${z}`,
        animation: 'property: intensity; from: 0.12; to: 0; dur: 120; dir: alternate; loop: true'
      });
      light.classList.add('flicker-light');
      light.dataset.max = 0.12;
      return;
    }

    make('a-box', {
      position: `${x} ${height - 0.03} ${z}`,
      width: 0.55, height: 0.03, depth: 1.4,
      material: 'color: #fffee0; emissive: #fffcc0; emissiveIntensity: 1.2; shader: flat'
    });

    const max = 0.85;
    const light = make('a-light', {
      type: 'point',
      color: type === 'flooded' ? '#b0ffa0' : '#ffe898',
      intensity: max, distance: ROOM_W * 1.8, decay: 2,
      position: `${x} ${height - 0.1} ${z}`,
      animation: 'property: intensity; from: 0.85; to: 0.15; dur: 220; dir: alternate; loop: true'
    });
    light.classList.add('flicker-light');
    light.dataset.max = max;
  }

  function addPit(x, z) {
    make('a-plane', {
      position: `${x} 0.01 ${z}`, rotation: '-90 0 0',
      width: 1.8, height: 1.8,
      material: 'color: #000000; emissive: #000000; shader: flat; side: double'
    });
    make('a-light', {
      type: 'point', color: '#08031a', intensity: 0.5, distance: 5,
      position: `${x} -1.5 ${z}`
    });
  }

  function addStain(x, z, rotY, wallH) {
    const sw = 0.5 + Math.random() * 0.8;
    const sh = 0.3 + Math.random() * 0.5;
    const oy = 0.3 + Math.random() * (wallH * 0.45);
    const along = (Math.random() - 0.5) * 2;
    const px = rotY === 90 ? x : x + along;
    const pz = rotY === 90 ? z + along : z;
    make('a-plane', {
      position: `${px} ${oy} ${pz}`, rotation: `0 ${rotY} 0`,
      width: sw, height: sh,
      material: 'color: #1a2606; opacity: 0.45; transparent: true; shader: flat; side: double'
    });
  }

  function addFloodedFloor(x, z) {
    make('a-plane', {
      position: `${x} 0.015 ${z}`, rotation: '-90 0 0',
      width: ROOM_W - 0.1, height: ROOM_D - 0.1,
      material: 'color: #060f08; opacity: 0.7; transparent: true; shader: flat; side: double'
    });
  }

  function addMonster(modelId, x, z, scale, rotationY, animName, animValue) {
    const monster = make('a-entity', {
      'gltf-model': modelId, position: `${x} 0 ${z}`,
      scale, rotation: `0 ${rotationY} 0`,
      'animation-mixer': 'clip: *; loop: repeat'
    });
    if (animName && animValue) monster.setAttribute(animName, animValue);
  }

  function getRoomCenter(row, col) {
    return {
      x: START_X + col * ROOM_W + ROOM_W / 2,
      z: START_Z - row * ROOM_D - ROOM_D / 2
    };
  }

  function randomFloatAnim(x, z) {
    const amount = (0.12 + Math.random() * 0.1).toFixed(2);
    const dur = 2200 + Math.floor(Math.random() * 1600);
    return `property: position; from: ${x} 0 ${z}; to: ${x} ${amount} ${z}; dur: ${dur}; dir: alternate; loop: true; easing: easeInOutSine`;
  }

  function randomSwayAnim(rotationY) {
    const left = rotationY - (10 + Math.floor(Math.random() * 8));
    const right = rotationY + (10 + Math.floor(Math.random() * 8));
    const dur = 5000 + Math.floor(Math.random() * 3000);
    return `property: rotation; from: 0 ${left} 0; to: 0 ${right} 0; dur: ${dur}; dir: alternate; loop: true; easing: easeInOutSine`;
  }

  // ── Merged room definitions ────────────────────────────────────────────────
  // mega = 2×2 cells, supermega = 3×3 cells — both fit inside the 6×6 grid
  const MEGA      = { id: 'mega',      topR: 4, topC: 4, spanR: 2, spanC: 2, type: 'mega' };
  const SUPERMEGA = { id: 'supermega', topR: 1, topC: 1, spanR: 3, spanC: 3, type: 'supermega' };

  const merged = [];
  for (let r = 0; r < ROWS; r++) merged[r] = new Array(COLS).fill(null);
  [MEGA, SUPERMEGA].forEach(room => {
    for (let r = room.topR; r < room.topR + room.spanR; r++)
      for (let c = room.topC; c < room.topC + room.spanC; c++)
        merged[r][c] = room;
  });

  // ── Maze generation ────────────────────────────────────────────────────────
  const visited   = [];
  const openRight = [];
  const openDown  = [];
  const roomTypes = [];

  for (let r = 0; r < ROWS; r++) {
    visited[r] = []; openRight[r] = []; openDown[r] = []; roomTypes[r] = [];
    for (let c = 0; c < COLS; c++) {
      visited[r][c]   = false;
      openRight[r][c] = false;
      openDown[r][c]  = false;
      roomTypes[r][c] = merged[r][c] ? merged[r][c].type : getRoomType();
    }
  }

  // When entering a merged block, mark every cell in it visited at once
  function markVisited(r, c) {
    const block = merged[r][c];
    if (block) {
      for (let br = block.topR; br < block.topR + block.spanR; br++)
        for (let bc = block.topC; bc < block.topC + block.spanC; bc++)
          visited[br][bc] = true;
    } else {
      visited[r][c] = true;
    }
  }

  function carve(r, c) {
    markVisited(r, c);
    const dirs = shuffle([[0, 1], [1, 0], [0, -1], [-1, 0]]);
    for (const dir of dirs) {
      const nr = r + dir[0];
      const nc = c + dir[1];
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
      if (visited[nr][nc]) continue;
      if (dir[0] === 0 && dir[1] === 1)  openRight[r][c]   = true;
      if (dir[0] === 0 && dir[1] === -1) openRight[nr][nc] = true;
      if (dir[0] === 1 && dir[1] === 0)  openDown[r][c]    = true;
      if (dir[0] === -1 && dir[1] === 0) openDown[nr][nc]  = true;
      carve(nr, nc);
    }
  }

  carve(0, Math.floor(COLS / 2));

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (c < COLS - 1 && Math.random() < EXTRA_OPENING_CHANCE) openRight[r][c] = true;
      if (r < ROWS - 1 && Math.random() < EXTRA_OPENING_CHANCE) openDown[r][c]  = true;
    }
  }

  // Guarantee each merged room connects on all accessible sides
  [MEGA, SUPERMEGA].forEach(({ topR, topC, spanR, spanC }) => {
    const midC = topC + Math.floor(spanC / 2);
    const midR = topR + Math.floor(spanR / 2);
    if (topR > 0)           openDown[topR - 1][midC]       = true;
    if (topR + spanR < ROWS) openDown[topR + spanR - 1][midC] = true;
    if (topC > 0)           openRight[midR][topC - 1]      = true;
    if (topC + spanC < COLS) openRight[midR][topC + spanC - 1] = true;
  });

  // ── Void perimeter openings ────────────────────────────────────────────────
  const voidSouthCols = shuffle([...Array(COLS).keys()]).slice(0, 2);
  const voidEastRow   = 1 + Math.floor(Math.random() * (ROWS - 2));
  const voidWestRow   = 1 + Math.floor(Math.random() * (ROWS - 2));

  // ── Build one merged room ──────────────────────────────────────────────────
  function buildMergedRoom(room) {
    const { topR, topC, spanR, spanC, type } = room;
    const x0     = START_X + topC * ROOM_W;
    const z0     = START_Z - topR * ROOM_D;
    const totalW = ROOM_W * spanC;
    const totalD = ROOM_D * spanR;
    const cx     = x0 + totalW / 2;
    const cz     = z0 - totalD / 2;
    const southZ = z0 - totalD;
    const eastX  = x0 + totalW;
    const ceilH  = getCeilingHeight(type);
    const dh     = 2.15;

    // Single large floor and ceiling
    make('a-plane', {
      position: `${cx} 0 ${cz}`, rotation: '-90 0 0',
      width: totalW, height: totalD,
      material: 'color: #3e3018; roughness: 1; side: double'
    });
    make('a-plane', {
      position: `${cx} ${ceilH} ${cz}`, rotation: '90 0 0',
      width: totalW, height: totalD,
      material: 'color: #d0c468; roughness: 0.75; side: double'
    });

    // Perimeter walls — built as per-cell-column/row segments so door positions
    // match the maze exactly (same as normal rooms, just taller).

    // North wall segments — extend to taller of merged room or neighbor above
    for (let bc = topC; bc < topC + spanC; bc++) {
      const segCx      = START_X + bc * ROOM_W + ROOM_W / 2;
      const open       = topR > 0 && openDown[topR - 1][bc];
      const neighborH  = topR > 0 ? getCeilingHeight(roomTypes[topR - 1][bc]) : ceilH;
      const wallH      = Math.max(ceilH, neighborH);
      const doorH      = Math.min(dh, Math.min(2.15, neighborH - 0.08));
      addWallNS(segCx, z0, ROOM_W, open, wallH, doorH, 'normal');
    }

    // South wall segments
    for (let bc = topC; bc < topC + spanC; bc++) {
      const segCx     = START_X + bc * ROOM_W + ROOM_W / 2;
      const open      = topR + spanR < ROWS
        ? openDown[topR + spanR - 1][bc]
        : voidSouthCols.includes(bc);
      const neighborH = topR + spanR < ROWS ? getCeilingHeight(roomTypes[topR + spanR][bc]) : ceilH;
      const wallH     = Math.max(ceilH, neighborH);
      const doorH     = Math.min(dh, Math.min(2.15, neighborH - 0.08));
      addWallNS(segCx, southZ, ROOM_W, open, wallH, doorH, 'normal');
    }

    // West wall segments
    for (let br = topR; br < topR + spanR; br++) {
      const segCz     = START_Z - br * ROOM_D - ROOM_D / 2;
      const open      = topC === 0 ? br === voidWestRow : openRight[br][topC - 1];
      const neighborH = topC > 0 ? getCeilingHeight(roomTypes[br][topC - 1]) : ceilH;
      const wallH     = Math.max(ceilH, neighborH);
      const doorH     = Math.min(dh, Math.min(2.15, neighborH - 0.08));
      addWallEW(x0, segCz, ROOM_D, open, wallH, doorH, 'normal');
    }

    // East wall segments
    for (let br = topR; br < topR + spanR; br++) {
      const segCz     = START_Z - br * ROOM_D - ROOM_D / 2;
      const open      = topC + spanC >= COLS ? br === voidEastRow : openRight[br][topC + spanC - 1];
      const neighborH = topC + spanC < COLS ? getCeilingHeight(roomTypes[br][topC + spanC]) : ceilH;
      const wallH     = Math.max(ceilH, neighborH);
      const doorH     = Math.min(dh, Math.min(2.15, neighborH - 0.08));
      addWallEW(eastX, segCz, ROOM_D, open, wallH, doorH, 'normal');
    }

    // Light grid spread across the room
    const lightCols = Math.max(1, Math.round(spanC / 2));
    const lightRows = Math.max(1, Math.round(spanR / 2));
    for (let li = 0; li < lightCols; li++) {
      for (let lj = 0; lj < lightRows; lj++) {
        const lx = x0 + ((li + 0.5) / lightCols) * totalW;
        const lz = z0 - ((lj + 0.5) / lightRows) * totalD;
        addLight(lx, lz, ceilH, 'normal');
      }
    }
  }

  // ── Main room build loop ───────────────────────────────────────────────────
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const block = merged[r][c];

      // Merged cells: build once at top-left, skip the rest
      if (block) {
        if (r === block.topR && c === block.topC) buildMergedRoom(block);
        continue;
      }

      const type    = roomTypes[r][c];
      const x0      = START_X + c * ROOM_W;
      const z0      = START_Z - r * ROOM_D;
      const centerX = x0 + ROOM_W / 2;
      const centerZ = z0 - ROOM_D / 2;
      const eastX   = x0 + ROOM_W;
      const southZ  = z0 - ROOM_D;

      const ceilingH = getCeilingHeight(type);
      const doorH    = Math.min(2.15, ceilingH - 0.08);

      const southNeighborH = r < ROWS - 1 ? getCeilingHeight(roomTypes[r + 1][c]) : ceilingH;
      const southWallH     = Math.max(ceilingH, southNeighborH);
      const southDoorH     = Math.min(doorH, Math.min(2.15, southNeighborH - 0.08));

      const eastNeighborH = c < COLS - 1 ? getCeilingHeight(roomTypes[r][c + 1]) : ceilingH;
      const eastWallH     = Math.max(ceilingH, eastNeighborH);
      const eastDoorH     = Math.min(doorH, Math.min(2.15, eastNeighborH - 0.08));

      addFloor(centerX, centerZ, type);
      addCeiling(centerX, centerZ, ceilingH, type);

      // North perimeter wall
      if (r === 0) {
        addWallNS(centerX, z0, ROOM_W, false, ceilingH, doorH, type);
        if (Math.random() < 0.25) addStain(centerX, z0, 0, ceilingH);
      }

      // South wall — skip if the merged room to the south builds its own north wall
      const southIsMerged = r < ROWS - 1 && merged[r + 1][c] !== null;
      if (!southIsMerged) {
        const southOpen = (r < ROWS - 1 && openDown[r][c]) || (r === ROWS - 1 && voidSouthCols.includes(c));
        addWallNS(centerX, southZ, ROOM_W, southOpen, southWallH, southDoorH, type);
        if (!southOpen && Math.random() < 0.25) addStain(centerX, southZ, 0, southWallH);
      }

      // West perimeter wall
      if (c === 0) {
        const westOpen = r === voidWestRow;
        addWallEW(x0, centerZ, ROOM_D, westOpen, ceilingH, doorH, type);
        if (!westOpen && Math.random() < 0.25) addStain(x0, centerZ, 90, ceilingH);
      }

      // East wall — skip if the merged room to the east builds its own west wall
      const eastIsMerged = c < COLS - 1 && merged[r][c + 1] !== null;
      if (!eastIsMerged) {
        const eastOpen = (c < COLS - 1 && openRight[r][c]) || (c === COLS - 1 && r === voidEastRow);
        addWallEW(eastX, centerZ, ROOM_D, eastOpen, eastWallH, eastDoorH, type);
        if (!eastOpen && Math.random() < 0.25) addStain(eastX, centerZ, 90, eastWallH);
      }

      addTrim(centerX, centerZ, eastX, southZ);
      addLight(centerX, centerZ, ceilingH, type);

      if (type === 'pit')     addPit(centerX, centerZ);
      if (type === 'flooded') addFloodedFloor(centerX, centerZ);
    }
  }

  // ── Monster placement ──────────────────────────────────────────────────────
  const safeRooms = [];
  for (let r = 1; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (merged[r][c]) continue;
      if (r === 1 && c <= 1) continue;
      safeRooms.push({ row: r, col: c });
    }
  }

  const shuffledRooms = shuffle(safeRooms);
  const monsterPlan = [
    { model: '#model-bacteria',  scale: '0.6 0.6 0.6'  },
    { model: '#model-bacteria',  scale: '0.55 0.55 0.55' },
    { model: '#model-bacteria',  scale: '0.65 0.65 0.65' },
    { model: '#model-bacteria',  scale: '0.6 0.6 0.6'  },
    { model: '#model-partygoer', scale: '0.85 0.85 0.85' },
    { model: '#model-partygoer', scale: '0.85 0.85 0.85' }
  ];

  for (let i = 0; i < monsterPlan.length; i++) {
    const room    = shuffledRooms[i];
    const monster = monsterPlan[i];
    const center  = getRoomCenter(room.row, room.col);
    const rotation = Math.floor(Math.random() * 360);

    if (monster.model === '#model-partygoer') {
      addMonster(monster.model, center.x, center.z, monster.scale, rotation,
        'animation__sway', randomSwayAnim(rotation));
    } else {
      addMonster(monster.model, center.x, center.z, monster.scale, rotation,
        'animation__float', randomFloatAnim(center.x, center.z));
    }
  }
})();


// Glitch canvas overlay
(function () {
  const canvas = document.getElementById('glitch-overlay');
  const ctx = canvas.getContext('2d');
  let width, height;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    drawIdle();
  }

  function drawIdle() {
    ctx.clearRect(0, 0, width, height);
    for (let y = 0; y < height; y += 4) {
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      ctx.fillRect(0, y, width, 2);
    }
  }

  function drawGlitch(alpha) {
    drawIdle();
    const strips = 3 + Math.floor(Math.random() * 9);
    for (let i = 0; i < strips; i++) {
      const stripY = Math.random() * height;
      const stripH = 1 + Math.random() * 10;
      ctx.fillStyle = `rgba(255,0,80,${alpha * 0.4})`;
      ctx.fillRect(-4, stripY, width, stripH);
      ctx.fillStyle = `rgba(0,240,255,${alpha * 0.3})`;
      ctx.fillRect(4, stripY, width, stripH);
      ctx.fillStyle = `rgba(255,255,0,${alpha * 0.2})`;
      ctx.fillRect(0, stripY, width, stripH);
    }
  }

  function scheduleGlitch() {
    setTimeout(() => {
      let frame = 0;
      const total = 2 + Math.floor(Math.random() * 5);
      function next() {
        if (frame >= total) { drawIdle(); scheduleGlitch(); return; }
        frame++;
        drawGlitch(0.12 + Math.random() * 0.4);
        setTimeout(next, 35 + Math.random() * 70);
      }
      next();
    }, 4000 + Math.random() * 10000);
  }

  window.addEventListener('resize', resize);
  resize();
  scheduleGlitch();
})();


// Random hard light jolts
document.querySelector('a-scene').addEventListener('loaded', () => {
  function joltLights() {
    const lights = document.querySelectorAll('.flicker-light');
    if (!lights.length) { setTimeout(joltLights, 2000); return; }

    const count = Math.random() < 0.25 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const light = lights[Math.floor(Math.random() * lights.length)];
      const max = parseFloat(light.dataset.max) || 0.8;
      light.setAttribute('animation', 'enabled', false);
      light.setAttribute('light', 'intensity', 0);
      setTimeout(() => {
        light.setAttribute('light', 'intensity', max);
        light.setAttribute('animation', 'enabled', true);
      }, 40 + Math.random() * 100);
    }

    setTimeout(joltLights, 700 + Math.random() * 2500);
  }

  setTimeout(joltLights, 2500);
});
