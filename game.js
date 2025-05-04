// DOM Elements
const cont = document.getElementById("container");
const maze = document.getElementById("maze");
const thingie = document.getElementById("thingie");
const home = document.getElementById("home");
const emo = document.getElementById("emo");

const bu = document.getElementById("bu");
const bd = document.getElementById("bd");
const bl = document.getElementById("bl");
const br = document.getElementById("br");

const mainMenu = document.getElementById("main-menu");
const levelCompleteOverlay = document.getElementById("level-complete");
const pauseMenu = document.getElementById("pause-menu");
const btnStart = document.querySelector(".btn-start");
const btnNext = document.querySelector(".btn-next");
const btnMenu = document.querySelector(".btn-menu");
const levelBtns = document.querySelectorAll(".level-btn");
const btnPause = document.getElementById("btn-pause");
const levelNumber = document.getElementById("level-number");
const pauseLevelNumber = document.getElementById("pause-level-number");

// Pause menu buttons
const btnResume = document.getElementById("btn-resume");
const btnRestart = document.getElementById("btn-restart");
const btnSelectLevel = document.getElementById("btn-select-level");
const btnToMain = document.getElementById("btn-to-main");
const pauseLevelSelect = document.getElementById("pause-level-select");

// Game settings
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

// Game state
let currentLevel = 1;
let completedLevels = [];
let gameActive = false;

// Tilt vars
let lastUD = 0;
let lastLR = 0;
const mThreshold = 15;
let firstMove = true;
let allowTilt = true;

// Swipe vars
const sThreshold = 15;
let lasttouchpY = 0;
let lasttouchpX = 0;

// Scroll vars
const scThreshold = 20;
let lastscrollpY = 0;
let lastscrollpX = 0;

// Level configurations
const levels = [
    { // Level 1 - Easy
        complexity: 0,
        mazeWidth: 300,
        mazeHeight: 200
    },
    { // Level 2 - Medium
        complexity: 1,
        mazeWidth: 300,
        mazeHeight: 200
    },
    { // Level 3 - Hard
        complexity: 2,
        mazeWidth: 340,
        mazeHeight: 220
    },
    { // Level 4
        complexity: 2,
        mazeWidth: 340,
        mazeHeight: 240
    },
    { // Level 5
        complexity: 3,
        mazeWidth: 360,
        mazeHeight: 240
    },
    { // Level 6
        complexity: 3,
        mazeWidth: 380,
        mazeHeight: 260
    },
    { // Level 7
        complexity: 4,
        mazeWidth: 400,
        mazeHeight: 280
    },
    { // Level 8
        complexity: 4,
        mazeWidth: 420,
        mazeHeight: 300
    },
    { // Level 9
        complexity: 5,
        mazeWidth: 440,
        mazeHeight: 320
    }
];

// Initialize game
initGame();

function initGame() {
    // Load saved progress
    loadProgress();
    updateLevelButtons();
    
    // Event listeners for menu buttons
    btnStart.addEventListener("click", () => {
        startLevel(currentLevel);
    });
    
    btnNext.addEventListener("click", () => {
        if (currentLevel < levels.length) {
            startLevel(currentLevel + 1);
        } else {
            showMainMenu();
        }
    });
    
    btnMenu.addEventListener("click", showMainMenu);
    
    btnPause.addEventListener("click", togglePause);
    
    // Pause menu buttons
    btnResume.addEventListener("click", () => {
        togglePause(); // Resume game
    });
    
    btnRestart.addEventListener("click", () => {
        pauseMenu.style.display = "none";
        restartLevel(); // Restart current level without regenerating maze
    });
    
    btnSelectLevel.addEventListener("click", () => {
        // Toggle level selection visibility
        const levelSelect = document.getElementById("pause-level-select");
        if (levelSelect.style.display === "none" || !levelSelect.style.display) {
            levelSelect.style.display = "grid";
            btnSelectLevel.textContent = "Hide Levels";
        } else {
            levelSelect.style.display = "none";
            btnSelectLevel.textContent = "Select Level";
        }
    });
    
    btnToMain.addEventListener("click", () => {
        pauseMenu.style.display = "none";
        showMainMenu(); // Return to main menu
    });
    
    // Level selection buttons
    levelBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const level = parseInt(btn.getAttribute("data-level"));
            // Remove locked check to allow selecting any level
            currentLevel = level;
            startLevel(level);
        });
    });

    // Keyboard navigation
    document.addEventListener("keydown", handleKeydown);

    // Direction buttons
    bu.addEventListener("click", () => {
        up();
        firstMove = true;
    });
    bd.addEventListener("click", () => {
        down();
        firstMove = true;
    });
    bl.addEventListener("click", () => {
        left();
        firstMove = true;
    });
    br.addEventListener("click", () => {
        right();
        firstMove = true;
    });

    // Touch navigation
    cont.addEventListener("touchstart", (e) => {
        lasttouchpY = e.changedTouches[0].pageY;
        lasttouchpX = e.changedTouches[0].pageX;
    });

    cont.addEventListener("touchmove", handleTouchMove);

    // Scroll navigation
    cont.addEventListener("wheel", handleScroll);

    // Tilt navigation
    window.addEventListener("deviceorientation", handleOrientation);
    
    console.log("Game initialized successfully");
}

function loadProgress() {
    const savedProgress = localStorage.getItem("mazeGameProgress");
    if (savedProgress) {
        try {
            const progress = JSON.parse(savedProgress);
            completedLevels = progress.completedLevels || [];
            // Set current level but make sure it's valid (between 1 and levels.length)
            currentLevel = progress.currentLevel || 1;
            if (currentLevel < 1 || currentLevel > levels.length) {
                currentLevel = 1;
            }
            console.log("Loaded progress:", completedLevels, currentLevel);
        } catch (e) {
            console.error("Error loading saved progress:", e);
            resetProgress();
        }
    } else {
        resetProgress();
    }
}

function resetProgress() {
    completedLevels = [];
    currentLevel = 1;
}

function saveProgress() {
    const progress = {
        completedLevels: completedLevels,
        currentLevel: currentLevel
    };
    localStorage.setItem("mazeGameProgress", JSON.stringify(progress));
    console.log("Progress saved:", progress);
}

function updateLevelButtons() {
    levelBtns.forEach(btn => {
        const level = parseInt(btn.getAttribute("data-level"));
        
        // Reset classes
        btn.classList.remove("locked", "completed");
        
        // Mark completed levels with color
        if (completedLevels.includes(level)) {
            btn.classList.add("completed");
        }
    });
}

function showMainMenu() {
    mainMenu.style.display = "flex";
    levelCompleteOverlay.style.display = "none";
    gameActive = false;
    updateLevelButtons();
}

function togglePause() {
    if (gameActive) {
        gameActive = false;
        btnPause.textContent = "▶️";
        pauseLevelNumber.textContent = currentLevel;
        
        // Reset level select button text
        btnSelectLevel.textContent = "Select Level";
        
        // Hide level selection initially
        const levelSelect = document.getElementById("pause-level-select");
        levelSelect.style.display = "none";
        
        // Show level selection in pause menu
        updatePauseLevelSelect();
        pauseMenu.style.display = "flex";
    } else {
        gameActive = true;
        btnPause.textContent = "⏸️";
        pauseMenu.style.display = "none";
    }
}

function startLevel(level) {
    // Reset game state
    currentLevel = level;
    levelNumber.textContent = level;
    
    // Hide menu and show game
    mainMenu.style.display = "none";
    levelCompleteOverlay.style.display = "none";
    
    // Clear previous maze
    resetMaze();
    
    // Get level configuration
    const levelConfig = levels[level - 1] || levels[0];
    
    // Apply level configuration
    nogoX = [];
    nogoX2 = [];
    nogoY = [];
    nogoY2 = [];
    
    // Generate maze
    genSides();
    
    // Define maze dimensions
    const my = mazeHeight / step;
    const mx = mazeWidth / step;

    // Create grid
    grid = [];
    for (let i = 0; i < my; i++) {
        let sg = [];
        for (let a = 0; a < mx; a++) {
            sg.push({ u: 0, d: 0, l: 0, r: 0, v: 0 });
        }
        grid.push(sg);
    }

    // Generate maze with complexity
    genMaze(0, 0, levelConfig.complexity);
    drawMaze();

    // Get all barriers for collision detection
    const barriers = document.getElementsByClassName("barrier");
    for (let b = 0; b < barriers.length; b++) {
        nogoX.push(barriers[b].offsetLeft);
        nogoX2.push(barriers[b].offsetLeft + barriers[b].clientWidth);
        nogoY.push(barriers[b].offsetTop);
        nogoY2.push(barriers[b].offsetTop + barriers[b].clientHeight);
    }
    
    // Start the game
    gameActive = true;
    btnPause.textContent = "⏸️";
    
    console.log("Level started:", level);
}

function resetMaze() {
    // Remove all barriers except top and bottom
    const barriers = document.getElementsByClassName("barrier");
    const toRemove = [];
    
    for (let i = 0; i < barriers.length; i++) {
        if (barriers[i].id !== "top" && barriers[i].id !== "bottom") {
            toRemove.push(barriers[i]);
        }
    }
    
    toRemove.forEach(element => {
        element.parentNode.removeChild(element);
    });
    
    // Reset player emotion
    emo.innerHTML = "🥺";
    
    // Reset home emoji
    document.querySelector("#home .emo").innerHTML = "🏠";
    
    // Reset maximum progress tracking
    maxl = 0;
    prevl = 0;
    
    // Reset distance tracking
    prevDist = mazeWidth * 2;
}

function completeLevel() {
    gameActive = false;
    
    // Mark level as completed
    if (!completedLevels.includes(currentLevel)) {
        completedLevels.push(currentLevel);
    }
    
    // Update next level if this is the furthest
    if (currentLevel === Math.max(...completedLevels, 0) && currentLevel < levels.length) {
        currentLevel++;
    }
    
    // Save progress
    saveProgress();
    
    // Show completion screen
    levelCompleteOverlay.style.display = "flex";
    
    // Show appropriate buttons
    if (currentLevel > levels.length) {
        btnNext.textContent = "All Levels Completed!";
        btnNext.disabled = true;
    } else {
        btnNext.textContent = "Next Level";
        btnNext.disabled = false;
    }
    
    console.log("Level completed:", currentLevel - 1);
}

// Create direction arrays
let dirs = ["u", "d", "l", "r"];
let modDir = {
    u: { y: -1, x: 0, o: "d" },
    d: { y: 1, x: 0, o: "u" },
    l: { y: 0, x: -1, o: "r" },
    r: { y: 0, x: 1, o: "l" }
};

// Handle keyboard input
function handleKeydown(e) {
    let code = e.code;
    
    // Handle escape key for pause menu toggle
    if (code === "Escape") {
        togglePause();
        return;
    }
    
    // Skip other key handling if game is not active
    if (!gameActive) return;
    
    switch (code) {
        // arrows
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
        // wasd
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

function up() {
    if (!gameActive) return;
    animKeys(bu);
    if (checkYboundry("u")) {
        thingie.style.top = thingie.offsetTop - step + "px";
        updateEmo(false);
        checkCompletion();
    }
}

function down() {
    if (!gameActive) return;
    animKeys(bd);
    if (checkYboundry("d")) {
        thingie.style.top = thingie.offsetTop + step + "px";
        updateEmo(false);
        checkCompletion();
    }
}

function left() {
    if (!gameActive) return;
    animKeys(bl);
    if (checkXboundry("l")) {
        thingie.style.left = thingie.offsetLeft - step + "px";
    }
    updateEmo(true);
    checkCompletion();
}

function right() {
    if (!gameActive) return;
    animKeys(br);
    if (checkXboundry("r")) {
        thingie.style.left = thingie.offsetLeft + step + "px";
    }
    updateEmo(true);
    checkCompletion();
}

function checkCompletion() {
    if (
        thingie.offsetLeft > mazeWidth - step &&
        thingie.offsetTop === home.offsetTop
    ) {
        // Player has reached home
        emo.innerHTML = "🤗";
        home.querySelector(".emo").innerHTML = "🥳";
        
        setTimeout(() => {
            completeLevel();
        }, 500);
    }
}

// check if one can move horizontally
function checkXboundry(dir) {
    let x = thingie.offsetLeft;
    let y = thingie.offsetTop;
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
    // check what to return
    let res = ok.every(function (e) {
        return e > 0;
    });
    return res;
}

// check if one can move vertically
function checkYboundry(dir) {
    let x = thingie.offsetLeft;
    let y = thingie.offsetTop;
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
    // check what to return
    let res = ok.every(function (e) {
        return e > 0;
    });
    return res;
}

// generate sides with random entry and exit points
function genSides() {
    let max = mazeHeight / step;
    let l1 = Math.floor(Math.random() * max) * step;
    let l2 = mazeHeight - step - l1;

    let lb1 = document.createElement("div");
    lb1.style.top = step + "px";
    lb1.style.left = step + "px";
    lb1.style.height = l1 + "px";

    let lb2 = document.createElement("div");
    lb2.style.top = l1 + step * 2 + "px";
    lb2.style.left = step + "px";
    lb2.style.height = l2 + "px";

    let rb1 = document.createElement("div");
    rb1.style.top = step + "px";
    rb1.style.left = mazeWidth + step + "px";
    rb1.style.height = l2 + "px";

    let rb2 = document.createElement("div");
    rb2.style.top = l2 + step * 2 + "px";
    rb2.style.left = mazeWidth + step + "px";
    rb2.style.height = l1 + "px";

    // create invisible barriers for start and end: vertical left, vertical right, left top, left bottom, right top, right bottom
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
        l2 + step,
        l1 + step,
        l1 + 2 * step,
        l2 + step,
        l2 + 2 * step
    );
    nogoY2.push(
        l1 + 2 * step,
        l2 + 2 * step,
        l1 + step + bwidth,
        l1 + 2 * step + bwidth,
        l2 + step + bwidth,
        l2 + 2 * step + bwidth
    );
    // set start-pos
    thingie.style.top = l1 + step + "px";
    thingie.style.left = 0 + "px";
    // set end-pos & store height of end
    home.style.top = l2 + step + "px";
    home.style.left = mazeWidth + step + "px";

    // style & append
    let els = [lb1, lb2, rb1, rb2];
    for (let i = 0; i < els.length; i++) {
        confSideEl(els[i]);
        maze.appendChild(els[i]);
    }
}

function confSideEl(el) {
    el.setAttribute("class", "barrier");
    el.style.width = bwidth + "px";
}

// gen maze using Recursive Backtracking with complexity factor
function genMaze(cx, cy, complexity) {
    // shuffle unchecked directions
    let d = limShuffle(dirs, complexity);

    for (let i = 0; i < d.length; i++) {
        let nx = cx + modDir[d[i]].x;
        let ny = cy + modDir[d[i]].y;
        
        // Make sure we have a valid grid
        if (!grid[cy] || !grid[cy][cx]) continue;
        
        grid[cy][cx].v = 1;

        if (nx >= 0 && nx < grid[0].length && ny >= 0 && ny < grid.length && grid[ny][nx].v === 0) {
            grid[cy][cx][d[i]] = 1;
            grid[ny][nx][modDir[d[i]].o] = 1;
            // avoid shuffling d if d's not exhausted.. hence the i
            genMaze(nx, ny, i);
        }
    }
}

// Limit shuffle to keep some order based on complexity
function limShuffle(array, complexity) {
    let s = Math.min(complexity, array.length - 1);
    let con = array.slice(0, s);
    let ran = array.slice(s, array.length);
    
    for (let i = ran.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ran[i], ran[j]] = [ran[j], ran[i]];
    }
    
    return con.concat(ran);
}

// draw maze
function drawMaze() {
    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[0].length; x++) {
            if (!grid[y][x]) continue;
            
            let l = grid[y][x].l;
            let r = grid[y][x].r;
            let u = grid[y][x].u;
            let d = grid[y][x].d;

            drawLines(x, y, l, r, u, d);
        }
    }
}

// draw maze lines
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
        maze.appendChild(el);
    }
    
    if (d === 0 && y < grid.length - 1) {
        let el = document.createElement("div");
        el.style.left = left + "px";
        el.style.height = bwidth + "px";
        el.style.top = top + step + "px";
        el.setAttribute("class", "barrier");
        el.style.width = step + bwidth + "px";
        maze.appendChild(el);
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
        if (thingie.offsetLeft < maxl) {
            emo.innerHTML = "🙄";
        }
        if (thingie.offsetLeft < maxl - 2 * step) {
            emo.innerHTML = "😒";
        }
        if (thingie.offsetLeft < maxl - 4 * step) {
            emo.innerHTML = "😣";
        }
        if (thingie.offsetLeft < maxl - 6 * step) {
            emo.innerHTML = "🤬";
        }
        if (thingie.offsetLeft > prevl) {
            emo.innerHTML = "😐";
        }
        if (thingie.offsetLeft >= maxl) {
            if (thingie.offsetLeft > mazeWidth * 0.6) {
                emo.innerHTML = "😀";
            } else {
                emo.innerHTML = "🙂";
            }
            maxl = thingie.offsetLeft;
        }
        if (thingie.offsetLeft === 0) {
            emo.innerHTML = "😢";
        }
        if (
            thingie.offsetLeft > mazeWidth - step &&
            thingie.offsetTop === home.offsetTop
        ) {
            emo.innerHTML = "🤗";
            home.querySelector(".emo").innerHTML = "🏠";
        }
        if (thingie.offsetLeft > mazeWidth) {
            emo.innerHTML = "";
            home.querySelector(".emo").innerHTML = "🥳";
        }
        prevl = thingie.offsetLeft;
    } else {
        if (thingie.offsetLeft > (mazeWidth - step) && thingie.offsetTop === home.offsetTop) {
            emo.innerHTML = "🤗";
        } else {
            if (thingie.offsetLeft > (mazeWidth - step) && thingie.offsetTop !== home.offsetTop) {
                emo.innerHTML = "🙄";
            }
        }
    }
}

// Touch move handler
function handleTouchMove(e) {
    if (!gameActive) return;
    
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
}

// Handle scroll for mouse wheel controls
function handleScroll(e) {
    if (!gameActive) return;
    
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
}

// Tilt timer for device orientation controls
function tiltTimer() {
    allowTilt = false;
    setTimeout(() => {
        allowTilt = true;
    }, 200);
}

// Handle device orientation (tilt) for mobile devices
function handleOrientation(e) {
    if (!gameActive) return;
    
    // up/down = beta (smaller = up)
    // left/right = gamma (neg = left)
    
    if (firstMove) {
        lastUD = e.beta;
        lastLR = e.gamma;
        firstMove = false;
    }
    
    if (allowTilt) {
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

// Add pause menu level selection functionality
function updatePauseLevelSelect() {
    // Clear existing buttons
    pauseLevelSelect.innerHTML = "";
    
    // Create level buttons
    for (let i = 1; i <= levels.length; i++) {
        const button = document.createElement("button");
        button.className = "pause-level-btn";
        
        // Add classes based on level status
        if (i === currentLevel) {
            button.classList.add("current");
        }
        if (completedLevels.includes(i)) {
            button.classList.add("completed");
        }
        
        button.textContent = i;
        button.addEventListener("click", () => {
            pauseMenu.style.display = "none";
            startLevel(i);
        });
        pauseLevelSelect.appendChild(button);
    }
}

// Reset player position but keep maze
function restartLevel() {
    // Make sure game is active
    if (!gameActive) {
        gameActive = true;
    }
    
    // Reset player emotion
    emo.innerHTML = "🥺";
    
    // Find left vertical barrier to determine start position
    // (This assumes the maze structure follows pattern from genSides function)
    const barriers = document.getElementsByClassName("barrier");
    let leftBarrier = null;
    
    for (let i = 0; i < barriers.length; i++) {
        if (barriers[i].style.left === step + "px" && barriers[i].style.width === bwidth + "px") {
            leftBarrier = barriers[i];
            break;
        }
    }
    
    // If we found the left barrier, calculate starting position
    if (leftBarrier) {
        const barrierHeight = parseInt(leftBarrier.style.height);
        const barrierTop = parseInt(leftBarrier.style.top);
        // Start position is right after the barrier (gap in the left wall)
        thingie.style.top = (barrierTop + barrierHeight) + "px";
    } else {
        // Fallback to default if we can't find the barrier
        thingie.style.top = (step * 2) + "px";
    }
    
    // Reset to leftmost position
    thingie.style.left = "0px";
    
    // Reset maximum progress tracking
    maxl = 0;
    prevl = 0;
    
    // Reset distance tracking
    prevDist = mazeWidth * 2;
    
    // Make sure pause button shows correct icon
    btnPause.textContent = "⏸️";
}