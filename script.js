// Game state
const gameState = {
    currentLevel: 0,
    maxUnlockedLevel: 0,
    startTime: 0,
    levelTimes: [],
    totalLevels: 5,
    isPlaying: false
};

// Level data for multiple mazes
const levelData = [
    {
        entryPoint: { x: 0, y: 0.5 },
        exitPoint: { x: 1, y: 0.5 },
        difficulty: "easy",
        timeLimit: 30
    },
    {
        entryPoint: { x: 0, y: 0.3 },
        exitPoint: { x: 1, y: 0.7 },
        difficulty: "easy",
        timeLimit: 40
    },
    {
        entryPoint: { x: 0, y: 0.2 },
        exitPoint: { x: 1, y: 0.8 },
        difficulty: "medium",
        timeLimit: 50
    },
    {
        entryPoint: { x: 0, y: 0.1 },
        exitPoint: { x: 1, y: 0.9 },
        difficulty: "medium",
        timeLimit: 60
    },
    {
        entryPoint: { x: 0, y: 0.05 },
        exitPoint: { x: 1, y: 0.95 },
        difficulty: "hard",
        timeLimit: 70
    }
];

// DOM Elements - Screens
const screens = {
    mainMenu: document.getElementById("main-menu"),
    levelSelect: document.getElementById("level-select-screen"),
    howToPlay: document.getElementById("how-to-play-screen"),
    game: document.getElementById("game-screen"),
    levelComplete: document.getElementById("level-complete"),
    gameComplete: document.getElementById("game-complete")
};

// DOM Elements - Buttons
const buttons = {
    startGame: document.getElementById("start-game"),
    levelSelectBtn: document.getElementById("level-select"),
    howToPlayBtn: document.getElementById("how-to-play"),
    backToMenu: document.getElementById("back-to-menu"),
    backFromHelp: document.getElementById("back-from-help"),
    backFromGame: document.getElementById("back-to-menu-from-game"),
    nextLevel: document.getElementById("next-level"),
    replayLevel: document.getElementById("replay-level"),
    menuFromComplete: document.getElementById("menu-from-complete"),
    restartGame: document.getElementById("restart-game"),
    menuFromCompleteGame: document.getElementById("menu-from-complete-game")
};

// DOM Elements - Game
const gameElements = {
    currentLevelDisplay: document.getElementById("current-level"),
    timerDisplay: document.getElementById("timer"),
    completionTime: document.getElementById("completion-time"),
    starRating: document.getElementById("star-rating"),
    levelsGrid: document.getElementById("levels-grid")
};

// DOM Elements - Maze
const mazeElements = {
    container: document.getElementById("container"),
    maze: document.getElementById("maze"),
    thingie: document.getElementById("thingie"),
    home: document.getElementById("home"),
    emo: document.getElementById("emo")
};

// DOM Elements - Controls
const controlButtons = {
    up: document.getElementById("bu"),
    down: document.getElementById("bd"),
    left: document.getElementById("bl"),
    right: document.getElementById("br")
};

// Maze game variables
const step = 20;
const size = 20;
const bwidth = 2;
const mazeHeight = 200;
const mazeWidth = 300;
let nogoX = [];
let nogoX2 = [];
let nogoY = [];
let nogoY2 = [];
let prevDist = mazeWidth * 2;
let maxl = 0;
let prevl = 0;

// Tilt variables
let lastUD = 0;
let lastLR = 0;
const mThreshold = 15;
let firstMove = true;
let allowTilt = true;

// Swipe variables
const sThreshold = 15;

// Scroll variables
const scThreshold = 20;
let lastscrollpY = 0;
let lastscrollpX = 0;

// Screen management
function showScreen(screenId) {
    // Hide all screens
    Object.values(screens).forEach(screen => {
        screen.classList.remove("active");
    });
    
    // Show the requested screen
    screens[screenId].classList.add("active");
}

// Initialize level selection grid
function initLevelSelectGrid() {
    gameElements.levelsGrid.innerHTML = "";
    
    for (let i = 0; i < gameState.totalLevels; i++) {
        const levelItem = document.createElement("div");
        levelItem.classList.add("level-item");
        
        if (i <= gameState.maxUnlockedLevel) {
            levelItem.textContent = i + 1;
            levelItem.addEventListener("click", () => {
                startLevel(i);
            });
        } else {
            levelItem.textContent = "🔒";
            levelItem.classList.add("locked");
        }
        
        gameElements.levelsGrid.appendChild(levelItem);
    }
}

// Maze generation functions
function resetMaze() {
    // Clear all existing barriers except top and bottom
    const barriers = document.getElementsByClassName("barrier");
    const staticBarriers = ["top", "bottom"];
    
    // Use a reverse loop because we're removing elements
    for (let i = barriers.length - 1; i >= 0; i--) {
        if (!staticBarriers.includes(barriers[i].id)) {
            barriers[i].remove();
        }
    }
    
    // Reset arrays
    nogoX = [];
    nogoX2 = [];
    nogoY = [];
    nogoY2 = [];
    prevDist = mazeWidth * 2;
    maxl = 0;
    prevl = 0;
    
    // Reset emoji
    mazeElements.emo.innerHTML = "🥺";
}

// Generate maze for a specific level
function generateMazeForLevel(levelIndex) {
    const level = levelData[levelIndex];
    
    // Calculate entry and exit points
    const entryY = Math.floor(level.entryPoint.y * mazeHeight);
    const exitY = Math.floor(level.exitPoint.y * mazeHeight);
    
    // Generate sides with entry and exit points
    genSides(entryY, exitY);
    
    // Define size
    let my = mazeHeight / step;
    let mx = mazeWidth / step;
    
    // Create full grid
    let grid = [];
    for (let i = 0; i < my; i++) {
        let sg = [];
        for (let a = 0; a < mx; a++) {
            sg.push({ u: 0, d: 0, l: 0, r: 0, v: 0 });
        }
        grid.push(sg);
    }
    
    // Create direction arrays
    let dirs = ["u", "d", "l", "r"];
    let modDir = {
        u: { y: -1, x: 0, o: "d" },
        d: { y: 1, x: 0, o: "u" },
        l: { y: 0, x: -1, o: "r" },
        r: { y: 0, x: 1, o: "l" }
    };
    
    // Generate maze using recursive backtracking
    genMaze(0, 0, 0, grid, dirs, modDir, mx, my);
    
    // Draw the maze
    drawMaze(grid, mx, my);
    
    // Get all barriers for collision detection
    const barriers = document.getElementsByClassName("barrier");
    for (let b = 0; b < barriers.length; b++) {
        nogoX.push(barriers[b].offsetLeft);
        nogoX2.push(barriers[b].offsetLeft + barriers[b].clientWidth);
        nogoY.push(barriers[b].offsetTop);
        nogoY2.push(barriers[b].offsetTop + barriers[b].clientHeight);
    }
}

// Generate sides with specific entry and exit points
function genSides(entryY, exitY) {
    // Adjust points to align with the grid
    let entryPoint = Math.floor(entryY / step) * step;
    let exitPoint = Math.floor(exitY / step) * step;
    
    // Make sure they're within bounds
    entryPoint = Math.max(step, Math.min(entryPoint, mazeHeight - 2 * step));
    exitPoint = Math.max(step, Math.min(exitPoint, mazeHeight - 2 * step));
    
    let l1 = entryPoint;
    let l2 = mazeHeight - step - l1;
    
    // Create left barriers (with entry point)
    let lb1 = document.createElement("div");
    lb1.style.top = step + "px";
    lb1.style.left = step + "px";
    lb1.style.height = l1 + "px";
    
    let lb2 = document.createElement("div");
    lb2.style.top = l1 + step * 2 + "px";
    lb2.style.left = step + "px";
    lb2.style.height = l2 + "px";
    
    // Create right barriers (with exit point)
    let rb1 = document.createElement("div");
    rb1.style.top = step + "px";
    rb1.style.left = mazeWidth + step + "px";
    rb1.style.height = exitPoint + "px";
    
    let rb2 = document.createElement("div");
    rb2.style.top = exitPoint + step * 2 + "px";
    rb2.style.left = mazeWidth + step + "px";
    rb2.style.height = (mazeHeight - exitPoint - step) + "px";
    
    // Create invisible barriers
    nogoX.push(0, mazeWidth + 2 * step, 0, 0, mazeWidth + step, mazeWidth + step);
    nogoX2.push(
        0 + bwidth,
        mazeWidth + 2 * step + bwidth,
        step,
        step,
        mazeWidth + 2 * step,
        mazeWidth + 2 * step
    );
    nogoY.push(
        l1 + step,
        exitPoint + step,
        l1 + step,
        l1 + 2 * step,
        exitPoint + step,
        exitPoint + 2 * step
    );
    nogoY2.push(
        l1 + 2 * step,
        exitPoint + 2 * step,
        l1 + step + bwidth,
        l1 + 2 * step + bwidth,
        exitPoint + step + bwidth,
        exitPoint + 2 * step + bwidth
    );
    
    // Set start position
    mazeElements.thingie.style.top = l1 + step + "px";
    mazeElements.thingie.style.left = 0 + "px";
    
    // Set end position
    mazeElements.home.style.top = exitPoint + step + "px";
    mazeElements.home.style.left = mazeWidth + step + "px";
    
    // Style and append elements
    let els = [lb1, lb2, rb1, rb2];
    for (let i = 0; i < els.length; i++) {
        confSideEl(els[i]);
        mazeElements.maze.appendChild(els[i]);
    }
}

// Configure side element
function confSideEl(el) {
    el.setAttribute("class", "barrier");
    el.style.width = bwidth + "px";
}

// Generate maze using Recursive Backtracking
function genMaze(cx, cy, s, grid, dirs, modDir, mx, my) {
    // Shuffle unchecked directions
    let d = limShuffle(dirs, s);
    
    for (let i = 0; i < d.length; i++) {
        let nx = cx + modDir[d[i]].x;
        let ny = cy + modDir[d[i]].y;
        grid[cy][cx].v = 1;
        
        if (nx >= 0 && nx < mx && ny >= 0 && ny < my && grid[ny][nx].v === 0) {
            grid[cy][cx][d[i]] = 1;
            grid[ny][nx][modDir[d[i]].o] = 1;
            genMaze(nx, ny, i, grid, dirs, modDir, mx, my);
        }
    }
}

// Limit shuffle to keep some order
function limShuffle(array, s) {
    let con = array.slice(0, s);
    let ran = array.slice(s, array.length);
    
    for (let i = ran.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ran[i], ran[j]] = [ran[j], ran[i]];
    }
    
    return con.concat(ran);
}

// Draw maze
function drawMaze(grid, mx, my) {
    for (let x = 0; x < mx; x++) {
        for (let y = 0; y < my; y++) {
            let l = grid[y][x].l;
            let r = grid[y][x].r;
            let u = grid[y][x].u;
            let d = grid[y][x].d;
            
            drawLines(x, y, l, r, u, d);
        }
    }
}

// Draw maze lines
function drawLines(x, y, l, r, u, d) {
    let top = (y + 1) * step;
    let left = (x + 1) * step;
    
    if (l === 0 && x > 0) {
        let el = document.createElement("div");
        el.style.left = left + "px";
        el.style.height = step + "px";
        el.style.top = top + "px";
        el.setAttribute("class", "barrier");
        el.style.width = bwidth + "px";
        mazeElements.maze.appendChild(el);
    }
    
    if (d === 0 && y < my - 1) {
        let el = document.createElement("div");
        el.style.left = left + "px";
        el.style.height = bwidth + "px";
        el.style.top = top + step + "px";
        el.setAttribute("class", "barrier");
        el.style.width = step + bwidth + "px";
        mazeElements.maze.appendChild(el);
    }
}

// Animation for control buttons
function animKeys(key) {
    if (key.id === "bu") {
        key.style.border = "3px #fff solid";
        key.style.borderTop = "1px #fff solid";
        key.style.borderBottom = "4px #fff solid";
        key.style.transform = "translateY(-2px)";
    }
    if (key.id === "bd") {
        key.style.border = "3px #fff solid";
        key.style.borderBottom = "1px #fff solid";
        key.style.borderTop = "4px #fff solid";
        key.style.transform = "translateY(2px)";
    }
    if (key.id === "bl") {
        key.style.border = "3px #fff solid";
        key.style.borderLeft = "1px #fff solid";
        key.style.borderRight = "4px #fff solid";
        key.style.transform = "translateX(-2px)";
    }
    if (key.id === "br") {
        key.style.border = "3px #fff solid";
        key.style.borderRight = "1px #fff solid";
        key.style.borderLeft = "4px #fff solid";
        key.style.transform = "translateX(2px)";
    }
    
    // Reset
    setTimeout(() => {
        key.style.border = "2px #fff solid";
        key.style.borderTop = "2px #fff solid";
        key.style.borderBottom = "2px #fff solid";
        key.style.borderLeft = "2px #fff solid";
        key.style.borderRight = "2px #fff solid";
        key.style.transform = "translateY(0px)";
        key.style.transform = "translateX(0px)";
    }, 150);
}

// Update emoji based on position
function updateEmo(lr) {
    if (lr) {
        if (mazeElements.thingie.offsetLeft < maxl) {
            mazeElements.emo.innerHTML = "🙄";
        }
        if (mazeElements.thingie.offsetLeft < maxl - 2 * step) {
            mazeElements.emo.innerHTML = "😒";
        }
        if (mazeElements.thingie.offsetLeft < maxl - 4 * step) {
            mazeElements.emo.innerHTML = "😣";
        }
        if (mazeElements.thingie.offsetLeft < maxl - 6 * step) {
            mazeElements.emo.innerHTML = "🤬";
        }
        if (mazeElements.thingie.offsetLeft > prevl) {
            mazeElements.emo.innerHTML = "😐";
        }
        if (mazeElements.thingie.offsetLeft >= maxl) {
            if (mazeElements.thingie.offsetLeft > mazeWidth * 0.6) {
                mazeElements.emo.innerHTML = "😀";
            } else {
                mazeElements.emo.innerHTML = "🙂";
            }
            maxl = mazeElements.thingie.offsetLeft;
        }
        if (mazeElements.thingie.offsetLeft === 0) {
            mazeElements.emo.innerHTML = "😢";
        }
        if (
            mazeElements.thingie.offsetLeft > mazeWidth - step &&
            mazeElements.thingie.offsetTop === mazeElements.home.offsetTop
        ) {
            mazeElements.emo.innerHTML = "🤗";
            mazeElements.home.innerHTML = "🏠";
            
            // Level completed
            setTimeout(() => {
                levelComplete();
            }, 500);
        }
        if (mazeElements.thingie.offsetLeft > mazeWidth) {
            mazeElements.emo.innerHTML = "";
            mazeElements.home.innerHTML = "🥳";
        }
        prevl = mazeElements.thingie.offsetLeft;
    } else {
        if (mazeElements.thingie.offsetLeft > (mazeWidth - step) && mazeElements.thingie.offsetTop === mazeElements.home.offsetTop) {
            mazeElements.emo.innerHTML = "🤗";
        } else {
            if (mazeElements.thingie.offsetLeft > (mazeWidth - step) && mazeElements.thingie.offsetTop !== mazeElements.home.offsetTop) {
                mazeElements.emo.innerHTML = "🙄";
            }
        }
    }
}

// Level completion logic
function levelComplete() {
    gameState.isPlaying = false;
    const completionTime = stopTimer();
    gameState.levelTimes[gameState.currentLevel] = completionTime;
    
    // Update UI elements
    gameElements.completionTime.textContent = `${completionTime}s`;
    
    // Calculate star rating based on time limit
    const timeLimit = levelData[gameState.currentLevel].timeLimit;
    let stars = 3;
    if (completionTime > timeLimit * 0.8) {
        stars = 2;
    }
    if (completionTime > timeLimit) {
        stars = 1;
    }
    
    // Display stars
    gameElements.starRating.innerHTML = '⭐'.repeat(stars);
    
    // Unlock next level if this is the highest level completed
    if (gameState.currentLevel === gameState.maxUnlockedLevel && gameState.currentLevel < gameState.totalLevels - 1) {
        gameState.maxUnlockedLevel++;
    }
    
    // Check if this was the final level
    if (gameState.currentLevel === gameState.totalLevels - 1) {
        setTimeout(() => {
            showScreen("gameComplete");
        }, 1500);
    } else {
        setTimeout(() => {
            showScreen("levelComplete");
        }, 1500);
    }
}

// Start a specific level
function startLevel(levelIndex) {
    gameState.currentLevel = levelIndex;
    gameState.isPlaying = true;
    gameState.startTime = Date.now();
    
    // Update UI
    gameElements.currentLevelDisplay.textContent = `Level ${levelIndex + 1}`;
    gameElements.timerDisplay.textContent = "Time: 0s";
    
    // Generate maze for the level
    resetMaze();
    generateMazeForLevel(levelIndex);
    
    // Start timer
    startTimer();
    
    // Show game screen
    showScreen("game");
}

// Timer functionality
let timerInterval;

function startTimer() {
    clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        if (gameState.isPlaying) {
            const elapsedTime = Math.floor((Date.now() - gameState.startTime) / 1000);
            gameElements.timerDisplay.textContent = `Time: ${elapsedTime}s`;
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    return Math.floor((Date.now() - gameState.startTime) / 1000);
}

// Movement functions
function up() {
    animKeys(controlButtons.up);
    if (checkYboundry("u")) {
        mazeElements.thingie.style.top = mazeElements.thingie.offsetTop - step + "px";
        updateEmo(false);
    }
}

function down() {
    animKeys(controlButtons.down);
    if (checkYboundry("d")) {
        mazeElements.thingie.style.top = mazeElements.thingie.offsetTop + step + "px";
        updateEmo(false);
    }
}

function left() {
    animKeys(controlButtons.left);
    if (checkXboundry("l")) {
        mazeElements.thingie.style.left = mazeElements.thingie.offsetLeft - step + "px";
    }
    updateEmo(true);
}

function right() {
    animKeys(controlButtons.right);
    if (checkXboundry("r")) {
        mazeElements.thingie.style.left = mazeElements.thingie.offsetLeft + step + "px";
    }
    updateEmo(true);
}

// Check if one can move horizontally
function checkXboundry(dir) {
    let x = mazeElements.thingie.offsetLeft;
    let y = mazeElements.thingie.offsetTop;
    let ok = [];
    let len = Math.max(nogoX.length, nogoX2.length, nogoY.length, nogoY2.length);

    let check = 0;
    for (let i = 0; i < len; i++) {
        check = 0;
        if (y < nogoY[i] || y > nogoY2[i] - size) {
            check = 1;
        }
        if (dir === "r") {
            if (x < nogoX[i] - size || x > nogoX2[i] - size) {
                check = 1;
            }
        }
        if (dir === "l") {
            if (x < nogoX[i] || x > nogoX2[i]) {
                check = 1;
            }
        }
        ok.push(check);
    }
    
    //check what to return
    let res = ok.every(function (e) {
        return e > 0;
    });
    return res;
}

// Check if one can move vertically
function checkYboundry(dir) {
    let x = mazeElements.thingie.offsetLeft;
    let y = mazeElements.thingie.offsetTop;
    let ok = [];
    let len = Math.max(nogoX.length, nogoX2.length, nogoY.length, nogoY2.length);

    let check = 0;
    for (let i = 0; i < len; i++) {
        check = 0;
        if (x < nogoX[i] || x > nogoX2[i] - size) {
            check = 1;
        }
        if (dir === "u") {
            if (y < nogoY[i] || y > nogoY2[i]) {
                check = 1;
            }
        }
        if (dir === "d") {
            if (y < nogoY[i] - size || y > nogoY2[i] - size) {
                check = 1;
            }
        }
        ok.push(check);
    }
    
    //check what to return
    let res = ok.every(function (e) {
        return e > 0;
    });
    return res;
}

// Set up input event listeners
function setupInputHandlers() {
    // Keyboard controls
    document.addEventListener("keydown", keys);
    
    // On-screen button controls
    controlButtons.up.addEventListener("click", () => {
        up();
        firstMove = true;
    });
    
    controlButtons.down.addEventListener("click", () => {
        down();
        firstMove = true;
    });
    
    controlButtons.left.addEventListener("click", () => {
        left();
        firstMove = true;
    });
    
    controlButtons.right.addEventListener("click", () => {
        right();
        firstMove = true;
    });
    
    // Tilt controls (mobile)
    window.addEventListener("deviceorientation", handleOrientation);
    
    // Swipe controls (mobile)
    mazeElements.container.addEventListener("touchstart", (e) => {
        lasttouchpY = e.changedTouches[0].pageY;
        lasttouchpX = e.changedTouches[0].pageX;
    });
    
    mazeElements.container.addEventListener("touchmove", (e) => {
        e.preventDefault();
        let diffY = e.changedTouches[0].pageY - lasttouchpY;
        let diffX = e.changedTouches[0].pageX - lasttouchpX;
        
        if (diffY > sThreshold) {
            down();
            lasttouchpY = e.changedTouches[0].pageY;
        } else if (diffY < -1 * sThreshold) {
            up();
            lasttouchpY = e.changedTouches[0].pageY;
        }
        
        if (diffX > sThreshold) {
            right();
            lasttouchpX = e.changedTouches[0].pageX;
        } else if (diffX < -1 * sThreshold) {
            left();
            lasttouchpX = e.changedTouches[0].pageX;
        }
    });
    
    // Scroll controls
    mazeElements.container.addEventListener("wheel", (e) => {
        // Handle Y scrolling
        lastscrollpY = lastscrollpY + e.deltaY;
        if (lastscrollpY > 0 && e.deltaY < 0) {
            lastscrollpY = 0;
        }
        if (lastscrollpY < 0 && e.deltaY > 0) {
            lastscrollpY = 0;
        }
        
        if (lastscrollpY > scThreshold) {
            up();
            lastscrollpY = 0;
        }
        if (lastscrollpY < (-1 * scThreshold)) {
            down();
            lastscrollpY = 0;
        }
        
        // Handle X scrolling
        lastscrollpX = lastscrollpX + e.deltaX;
        if (lastscrollpX > 0 && e.deltaX < 0) {
            lastscrollpX = 0;
        }
        if (lastscrollpX < 0 && e.deltaX > 0) {
            lastscrollpX = 0;
        }
        
        if (lastscrollpX > scThreshold) {
            left();
            lastscrollpX = 0;
        }
        if (lastscrollpX < (-1 * scThreshold)) {
            right();
            lastscrollpX = 0;
        }
    });
}

// Handle keyboard input
function keys(e) {
    let code = e.code;
    switch (code) {
        //arrows
        case "ArrowUp":
            up();
            break;
        case "ArrowDown":
            down();
            break;
        case "ArrowLeft":
            left();
            break;
        case "ArrowRight":
            right();
            break;
        //wasd
        case "KeyW":
            up();
            break;
        case "KeyS":
            down();
            break;
        case "KeyA":
            left();
            break;
        case "KeyD":
            right();
            break;
    }
}

// Device tilt controls
function tiltTimer() {
    allowTilt = false;
    setTimeout(() => {
        allowTilt = true;
    }, 200);
}

function handleOrientation(e) {
    //up/down = beta (smaller = up)
    //left/right = gamma (neg = left)
    
    if (firstMove) {
        lastUD = e.beta;
        lastLR = e.gamma;
        firstMove = false;
    }
    
    if (allowTilt && gameState.isPlaying) {
        if (e.beta < lastUD - mThreshold) {
            up();
            tiltTimer();
        }
        if (e.beta > lastUD + mThreshold) {
            down();
            tiltTimer();
        }
        if (e.gamma < lastLR - mThreshold) {
            left();
            tiltTimer();
        }
        if (e.gamma > lastLR + mThreshold) {
            right();
            tiltTimer();
        }
    }
}

// Setup function for all event listeners
function setupEventListeners() {
    // Menu navigation
    buttons.startGame.addEventListener("click", () => {
        startLevel(gameState.maxUnlockedLevel);
    });
    
    buttons.levelSelectBtn.addEventListener("click", () => {
        initLevelSelectGrid();
        showScreen("levelSelect");
    });
    
    buttons.howToPlayBtn.addEventListener("click", () => {
        showScreen("howToPlay");
    });
    
    buttons.backToMenu.addEventListener("click", () => {
        showScreen("mainMenu");
    });
    
    buttons.backFromHelp.addEventListener("click", () => {
        showScreen("mainMenu");
    });
    
    buttons.backFromGame.addEventListener("click", () => {
        gameState.isPlaying = false;
        showScreen("mainMenu");
    });
    
    // Level completion
    buttons.nextLevel.addEventListener("click", () => {
        if (gameState.currentLevel < gameState.totalLevels - 1) {
            startLevel(gameState.currentLevel + 1);
        } else {
            showScreen("gameComplete");
        }
    });
    
    buttons.replayLevel.addEventListener("click", () => {
        startLevel(gameState.currentLevel);
    });
    
    buttons.menuFromComplete.addEventListener("click", () => {
        showScreen("mainMenu");
    });
    
    // Game completion
    buttons.restartGame.addEventListener("click", () => {
        gameState.currentLevel = 0;
        startLevel(0);
    });
    
    buttons.menuFromCompleteGame.addEventListener("click", () => {
        showScreen("mainMenu");
    });
    
    // Set up movement input handlers
    setupInputHandlers();
}

// Initialize the game
function initGame() {
    // Set up button event listeners
    setupEventListeners();
    
    // Initialize level selection grid
    initLevelSelectGrid();
    
    // Initially show the main menu
    showScreen("mainMenu");
    
    // Reset game state
    gameState.currentLevel = 0;
    gameState.maxUnlockedLevel = 0;
    gameState.startTime = 0;
    gameState.levelTimes = Array(gameState.totalLevels).fill(0);
    gameState.isPlaying = false;
    
    // Clean up any lingering maze elements
    resetMaze();
}

// Initialize the game when the page loads
document.addEventListener("DOMContentLoaded", initGame); 