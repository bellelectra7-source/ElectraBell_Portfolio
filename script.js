/* =========================================================
   ELECTRA BELL PORTFOLIO
   This file controls the interactive parts of my portfolio:
   - Automatic footer year
   - Project filters
   - Project detail buttons
   - Contact form email draft
   - Fruit Frenzy mini-game
   ========================================================= */


/* =========================================================
   1. AUTOMATIC FOOTER YEAR
   Gets the current year from the visitor's device.
   ========================================================= */

const currentYear = document.getElementById("currentYear");

if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
}


/* =========================================================
   2. PROJECT FILTERS
   Shows projects that match the selected category.
   ========================================================= */

const filterButtons = document.querySelectorAll(".filter-btn");
const projectItems = document.querySelectorAll(".project-item");

function filterProjects(selectedFilter) {
    projectItems.forEach(function (project) {
        const projectCategory = project.dataset.category;

        if (
            selectedFilter === "all" ||
            projectCategory === selectedFilter
        ) {
            project.classList.remove("project-hidden");
        } else {
            project.classList.add("project-hidden");
        }
    });
}

filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        const selectedFilter = button.dataset.filter;

        filterButtons.forEach(function (otherButton) {
            otherButton.classList.remove("active");
        });

        button.classList.add("active");
        filterProjects(selectedFilter);
    });
});


/* =========================================================
   3. PROJECT DETAILS
   Displays each project's title and description.
   ========================================================= */

const projectDetailButtons = document.querySelectorAll(
    ".project-details-btn"
);

projectDetailButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        const title = button.dataset.title;
        const description = button.dataset.description;

        alert(title + "\n\n" + description);
    });
});


/* =========================================================
   4. CONTACT FORM
   Opens an email draft addressed to Electra's email address.

   IMPORTANT:
   This does not send an email automatically. The visitor's
   email application opens with the message prepared, and
   the visitor must press Send themselves.
   ========================================================= */

const contactForm = document.getElementById("contactForm");
const formFeedback = document.getElementById("formFeedback");

const portfolioEmail = "bellelectra7@gmail.com";

if (contactForm && formFeedback) {
    contactForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const nameField = document.getElementById("contactName");
        const emailField = document.getElementById("contactEmail");
        const messageField = document.getElementById("contactMessage");

        // Check that all the required form elements exist.
        if (!nameField || !emailField || !messageField) {
            formFeedback.textContent =
                "Sorry, the contact form could not be loaded correctly.";
            return;
        }

        const name = nameField.value.trim();
        const email = emailField.value.trim();
        const message = messageField.value.trim();

        // Do not open an email draft if any field is empty.
        if (!name || !email || !message) {
            formFeedback.textContent =
                "Please complete all the fields before sending.";
            return;
        }

        // Use the browser's built-in email validation.
        if (!emailField.checkValidity()) {
            formFeedback.textContent =
                "Please enter a valid email address.";
            emailField.focus();
            return;
        }

        // Prepare the email subject and message.
        const subject = "Portfolio enquiry from " + name;

        const body =
            "Hello Electra,\n\n" +
            message +
            "\n\nKind regards,\n" +
            name +
            "\nReply to: " +
            email;

        // Encode the subject and body so spaces and special
        // characters are handled correctly in the email link.
        const mailtoLink =
            "mailto:" + portfolioEmail +
            "?subject=" + encodeURIComponent(subject) +
            "&body=" + encodeURIComponent(body);

        formFeedback.textContent =
            "Opening your email application. Please send the prepared message there.";

        // Open the visitor's default email application.
        window.location.href = mailtoLink;
    });
}


/* =========================================================
   5. FRUIT FRENZY MINI-GAME
   Collect the target number of fruits in 60 seconds.
   Avoid bombs: touching one ends the round.

   Controls:
   - WASD or arrow keys on desktop
   - On-screen directional buttons on touch devices

   Difficulty increases as the score rises.
   ========================================================= */


/* ---------------------------------------------------------
   A. FIND THE GAME ELEMENTS
   These IDs must match the updated index.html.
   --------------------------------------------------------- */

const gameArena = document.getElementById("gameArena");
const gamePlayer = document.getElementById("gamePlayer");

const gameScoreDisplay = document.getElementById("gameScore");
const gameTimerDisplay = document.getElementById("gameTimer");
const gameTargetDisplay = document.getElementById("gameTarget");
const gameDifficultyDisplay = document.getElementById("gameDifficulty");

const gameOverlay = document.getElementById("gameOverlay");
const gameOverlayTitle = document.getElementById("gameOverlayTitle");
const gameOverlayText = document.getElementById("gameOverlayText");
const startGameBtn = document.getElementById("startGameBtn");

// These buttons are created in the updated HTML for mobile controls.
const moveLeftBtn = document.getElementById("moveLeftBtn");
const moveRightBtn = document.getElementById("moveRightBtn");
const moveUpBtn = document.getElementById("moveUpBtn");
const moveDownBtn = document.getElementById("moveDownBtn");


/* ---------------------------------------------------------
   B. GAME SETTINGS
   These are the main settings for a round.
   --------------------------------------------------------- */

const GAME_DURATION = 60;
const FRUIT_TARGET = 30;

const FRUIT_TYPES = ["🍎", "🍊", "🍓", "🍇", "🍉", "🍍", "🍒", "🍐"];
const BOMB_EMOJI = "💣";

// All game positions use percentages so the game adapts
// to the size of the arena.
let playerX = 12;
let playerY = 50;

let gameScore = 0;
let gameTimeLeft = GAME_DURATION;
let gameIsRunning = false;

// Difficulty increases as the score rises.
let gameDifficulty = 1;
let playerSpeed = 1.1;
let bombSpawnChance = 0.25;

// The game creates and removes fruit and bomb elements.
let fruits = [];
let bombs = [];
let nextObjectId = 0;

// These variables store the timers so they can be stopped.
let countdownInterval = null;
let gameLoopInterval = null;
let spawnInterval = null;

// A Set remembers which movement keys are being held.
const keysPressed = new Set();

// Touch controls store which direction buttons are being held.
const touchDirections = new Set();


/* ---------------------------------------------------------
   C. ONLY RUN THE GAME WHEN ITS HTML ELEMENTS EXIST
   The rest of the portfolio can still work without the game.
   --------------------------------------------------------- */

if (
    gameArena &&
    gamePlayer &&
    gameScoreDisplay &&
    gameTimerDisplay &&
    startGameBtn &&
    gameOverlay &&
    gameOverlayTitle &&
    gameOverlayText
) {

    /* -----------------------------------------------------
       D. UPDATE THE PLAYER'S POSITION
       CSS positions the player using left and top percentages.
       ----------------------------------------------------- */

    function updatePlayerPosition() {
        gamePlayer.style.left = playerX + "%";
        gamePlayer.style.top = playerY + "%";
    }


    /* -----------------------------------------------------
       E. UPDATE THE GAME DISPLAY
       Shows the score, time, target and current difficulty.
       ----------------------------------------------------- */

    function updateGameDisplay() {
        gameScoreDisplay.textContent =
            gameScore + " / " + FRUIT_TARGET;

        gameTimerDisplay.textContent = gameTimeLeft + "s";

        if (gameTargetDisplay) {
            gameTargetDisplay.textContent = FRUIT_TARGET;
        }

        if (gameDifficultyDisplay) {
            const difficultyNames = [
                "Easy",
                "Medium",
                "Hard",
                "Expert"
            ];

            gameDifficultyDisplay.textContent =
                difficultyNames[Math.min(gameDifficulty - 1, 3)];
        }
    }


    /* -----------------------------------------------------
       F. CREATE A GAME OBJECT
       This creates a fruit or bomb at a chosen position.
       ----------------------------------------------------- */

    function createGameObject(type, x, y, emoji) {
        const object = document.createElement("div");

        object.className =
            type === "fruit" ? "game-fruit" : "game-bomb";

        object.textContent = emoji;

        // Each object gets a unique ID for easier tracking.
        object.dataset.objectId = String(nextObjectId++);

        object.style.left = x + "%";
        object.style.top = y + "%";

        object.setAttribute("aria-hidden", "true");

        gameArena.appendChild(object);

        return {
            id: object.dataset.objectId,
            type: type,
            x: x,
            y: y,
            element: object
        };
    }


    /* -----------------------------------------------------
       G. FIND A SAFE RANDOM POSITION
       Prevents new objects from appearing directly on top
       of the player whenever possible.
       ----------------------------------------------------- */

    function getRandomPosition() {
        let x = 10 + Math.random() * 80;
        let y = 12 + Math.random() * 76;

        let attempts = 0;

        while (
            Math.abs(x - playerX) < 14 &&
            Math.abs(y - playerY) < 18 &&
            attempts < 15
        ) {
            x = 10 + Math.random() * 80;
            y = 12 + Math.random() * 76;
            attempts++;
        }

        return { x: x, y: y };
    }


    /* -----------------------------------------------------
       H. SPAWN FRUIT
       Collecting fruit increases the score by one.
       ----------------------------------------------------- */

    function spawnFruit() {
        if (!gameIsRunning) {
            return;
        }

        const position = getRandomPosition();

        const emoji =
            FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];

        const fruit = createGameObject(
            "fruit",
            position.x,
            position.y,
            emoji
        );

        fruits.push(fruit);
    }


    /* -----------------------------------------------------
       I. SPAWN BOMBS
       Bombs become more common as difficulty increases.
       Touching a bomb ends the round.
       ----------------------------------------------------- */

    function spawnBomb() {
        if (!gameIsRunning) {
            return;
        }

        const position = getRandomPosition();

        const bomb = createGameObject(
            "bomb",
            position.x,
            position.y,
            BOMB_EMOJI
        );

        bombs.push(bomb);
    }


    /* -----------------------------------------------------
       J. REMOVE GAME OBJECTS
       Removes the visual element and its matching data entry.
       ----------------------------------------------------- */

    function removeGameObject(object, objectList) {
        if (object.element && object.element.parentNode) {
            object.element.parentNode.removeChild(object.element);
        }

        const objectIndex = objectList.findIndex(function (item) {
            return item.id === object.id;
        });

        if (objectIndex !== -1) {
            objectList.splice(objectIndex, 1);
        }
    }


    /* -----------------------------------------------------
       K. CLEAR ALL FRUITS AND BOMBS
       Used when a round ends or a new round starts.
       ----------------------------------------------------- */

    function clearGameObjects() {
        fruits.forEach(function (fruit) {
            if (fruit.element && fruit.element.parentNode) {
                fruit.element.parentNode.removeChild(fruit.element);
            }
        });

        bombs.forEach(function (bomb) {
            if (bomb.element && bomb.element.parentNode) {
                bomb.element.parentNode.removeChild(bomb.element);
            }
        });

        fruits = [];
        bombs = [];
    }


    /* -----------------------------------------------------
       L. CHECK IF THE PLAYER TOUCHES AN OBJECT
       Uses horizontal and vertical distances to detect contact.
       ----------------------------------------------------- */

    function objectsTouch(x1, y1, x2, y2, distanceNeeded) {
        return (
            Math.abs(x1 - x2) < distanceNeeded &&
            Math.abs(y1 - y2) < distanceNeeded
        );
    }


    /* -----------------------------------------------------
       M. UPDATE DIFFICULTY
       Every few fruits, the game becomes more challenging.
       Movement gets faster and bombs spawn more frequently.
       ----------------------------------------------------- */

    function updateDifficulty() {
        const previousDifficulty = gameDifficulty;

        gameDifficulty = Math.min(
            4,
            Math.floor(gameScore / 4) + 1
        );

        playerSpeed = 1.1 + (gameDifficulty - 1) * 0.15;

        bombSpawnChance = Math.min(
            0.65,
            0.25 + (gameDifficulty - 1) * 0.1
        );

        if (gameDifficulty !== previousDifficulty) {
            updateGameDisplay();
        }
    }


    /* -----------------------------------------------------
       N. HANDLE FRUIT COLLECTION
       Fruit disappears after collection and the score rises.
       ----------------------------------------------------- */

    function collectFruit(fruit) {
        removeGameObject(fruit, fruits);

        gameScore++;

        updateDifficulty();
        updateGameDisplay();

        // Reaching the target wins the game immediately.
        if (gameScore >= FRUIT_TARGET) {
            endGame(true, "win");
            return;
        }

        // Replace the collected fruit so there is always
        // something new for the player to collect.
        spawnFruit();
    }


    /* -----------------------------------------------------
       O. CHECK COLLISIONS
       Fruit adds points. Bombs cause an immediate loss.
       ----------------------------------------------------- */

    function checkCollisions() {
        if (!gameIsRunning) {
            return;
        }

        // Check fruit collisions backwards because a collected
        // fruit is removed from the array.
        for (let i = fruits.length - 1; i >= 0; i--) {
            const fruit = fruits[i];

            if (
                objectsTouch(
                    playerX,
                    playerY,
                    fruit.x,
                    fruit.y,
                    5.5
                )
            ) {
                collectFruit(fruit);

                if (!gameIsRunning) {
                    return;
                }
            }
        }

        // Check bomb collisions. Touching any bomb ends the round.
        for (let i = 0; i < bombs.length; i++) {
            const bomb = bombs[i];

            if (
                objectsTouch(
                    playerX,
                    playerY,
                    bomb.x,
                    bomb.y,
                    5.5
                )
            ) {
                endGame(false, "bomb");
                return;
            }
        }
    }


    /* -----------------------------------------------------
       P. MOVE THE PLAYER
       Supports keyboard controls and held touch buttons.
       ----------------------------------------------------- */

    function moveGameObjects() {
        if (!gameIsRunning) {
            return;
        }

        let horizontalMovement = 0;
        let verticalMovement = 0;

        // Keyboard movement.
        if (keysPressed.has("arrowup") || keysPressed.has("w")) {
            verticalMovement -= 1;
        }

        if (keysPressed.has("arrowdown") || keysPressed.has("s")) {
            verticalMovement += 1;
        }

        if (keysPressed.has("arrowleft") || keysPressed.has("a")) {
            horizontalMovement -= 1;
        }

        if (keysPressed.has("arrowright") || keysPressed.has("d")) {
            horizontalMovement += 1;
        }

        // Touch movement.
        if (touchDirections.has("up")) {
            verticalMovement -= 1;
        }

        if (touchDirections.has("down")) {
            verticalMovement += 1;
        }

        if (touchDirections.has("left")) {
            horizontalMovement -= 1;
        }

        if (touchDirections.has("right")) {
            horizontalMovement += 1;
        }

        // Normalise diagonal movement so it is not faster.
        if (horizontalMovement !== 0 && verticalMovement !== 0) {
            horizontalMovement *= 0.7071;
            verticalMovement *= 0.7071;
        }

        playerX += horizontalMovement * playerSpeed;
        playerY += verticalMovement * playerSpeed;

        // Keep the basket inside the arena.
        playerX = Math.max(4, Math.min(96, playerX));
        playerY = Math.max(7, Math.min(93, playerY));

        updatePlayerPosition();
        checkCollisions();
    }


    /* -----------------------------------------------------
       Q. STOP GAME TIMERS
       Clears all active intervals so they cannot keep running
       after the game ends or restarts.
       ----------------------------------------------------- */

    function stopGameTimers() {
        clearInterval(countdownInterval);
        clearInterval(gameLoopInterval);
        clearInterval(spawnInterval);

        countdownInterval = null;
        gameLoopInterval = null;
        spawnInterval = null;
    }


    /* -----------------------------------------------------
       R. END THE ROUND
       Stops movement and displays the result.
       ----------------------------------------------------- */

    function endGame(playerWon, reason) {
        if (!gameIsRunning) {
            return;
        }

        gameIsRunning = false;

        stopGameTimers();

        keysPressed.clear();
        touchDirections.clear();

        gameOverlay.classList.remove("is-hidden");

        if (playerWon) {
            gameStatusText("You won!");

            gameOverlayTitle.textContent = "Fruit Frenzy Champion!";

            gameOverlayText.textContent =
                "Amazing! You collected all " +
                FRUIT_TARGET +
                " fruits with " +
                gameTimeLeft +
                " seconds left. Ready for another round?";

            startGameBtn.textContent = "Play again";
        } else {
            gameStatusText("Round over");

            gameOverlayTitle.textContent = "Game over!";

            if (reason === "bomb") {
                gameOverlayText.textContent =
                    "Oh no! You touched a bomb. You collected " +
                    gameScore +
                    " out of " +
                    FRUIT_TARGET +
                    " fruits. Try again!";
            } else {
                gameOverlayText.textContent =
                    "Time ran out! You collected " +
                    gameScore +
                    " out of " +
                    FRUIT_TARGET +
                    " fruits. Try again!";
            }

            startGameBtn.textContent = "Try again";
        }

        clearGameObjects();
    }


    /* -----------------------------------------------------
       S. UPDATE THE STATUS DISPLAY
       The updated HTML may not include a separate status field,
       so this checks for it safely before updating it.
       ----------------------------------------------------- */

    function gameStatusText(message) {
        const gameStatusDisplay = document.getElementById("gameStatus");

        if (gameStatusDisplay) {
            gameStatusDisplay.textContent = message;
        }
    }


    /* -----------------------------------------------------
       T. START OR RESTART THE GAME
       Resets the score, timer, player, difficulty and objects.
       ----------------------------------------------------- */

    function startGame() {
        stopGameTimers();

        keysPressed.clear();
        touchDirections.clear();

        clearGameObjects();

        gameScore = 0;
        gameTimeLeft = GAME_DURATION;
        gameDifficulty = 1;
        playerSpeed = 1.1;
        bombSpawnChance = 0.25;

        playerX = 12;
        playerY = 50;

        gameIsRunning = true;

        updatePlayerPosition();
        updateGameDisplay();

        gameStatusText("Playing");

        gameOverlay.classList.add("is-hidden");

        // Spawn a few objects to give the player something to do.
        spawnFruit();
        spawnFruit();
        spawnFruit();
        spawnBomb();

        // Focus the arena for keyboard movement on desktop.
        gameArena.focus({ preventScroll: true });

        // The game loop updates movement around 30 times per second.
        gameLoopInterval = setInterval(
            moveGameObjects,
            1000 / 30
        );

        // Every second, update the remaining time.
        countdownInterval = setInterval(function () {
            if (!gameIsRunning) {
                return;
            }

            gameTimeLeft--;

            if (gameTimeLeft <= 0) {
                gameTimeLeft = 0;
                updateGameDisplay();
                endGame(false, "time");
                return;
            }

            updateGameDisplay();
        }, 1000);

        // Spawn new bombs over time. Higher difficulty increases
        // the chance that each spawn will be a bomb.
        spawnInterval = setInterval(function () {
            if (!gameIsRunning) {
                return;
            }

            if (Math.random() < bombSpawnChance) {
                spawnBomb();
            } else {
                spawnFruit();
            }
        }, 1800);
    }


    /* -----------------------------------------------------
       U. KEYBOARD CONTROLS
       WASD and arrow keys work while the game is active.
       ----------------------------------------------------- */

    const movementKeys = [
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright",
        "w",
        "a",
        "s",
        "d"
    ];

    document.addEventListener("keydown", function (event) {
        const key = event.key.toLowerCase();

        if (!gameIsRunning || !movementKeys.includes(key)) {
            return;
        }

        // Only stop page scrolling for arrow keys while playing.
        if (key.startsWith("arrow")) {
            event.preventDefault();
        }

        keysPressed.add(key);
    });

    document.addEventListener("keyup", function (event) {
        keysPressed.delete(event.key.toLowerCase());
    });

    // Prevent stuck movement if the visitor changes tabs.
    window.addEventListener("blur", function () {
        keysPressed.clear();
        touchDirections.clear();
    });


    /* -----------------------------------------------------
       V. MOBILE TOUCH CONTROLS
       Holding a direction button keeps the player moving.
       Both pointer and touch-friendly browser events are used
       through pointer events.
       ----------------------------------------------------- */

    function connectTouchButton(button, direction) {
        if (!button) {
            return;
        }

        button.addEventListener("pointerdown", function (event) {
            if (!gameIsRunning) {
                return;
            }

            event.preventDefault();

            touchDirections.add(direction);

            // Capture the pointer so releasing outside the button
            // can still stop movement correctly.
            if (button.setPointerCapture) {
                button.setPointerCapture(event.pointerId);
            }
        });

        function stopDirection(event) {
            touchDirections.delete(direction);

            if (
                event &&
                button.hasPointerCapture &&
                button.hasPointerCapture(event.pointerId)
            ) {
                button.releasePointerCapture(event.pointerId);
            }
        }

        button.addEventListener("pointerup", stopDirection);
        button.addEventListener("pointercancel", stopDirection);
        button.addEventListener("lostpointercapture", function () {
            touchDirections.delete(direction);
        });

        // Avoid unwanted browser actions when holding the controls.
        button.addEventListener("contextmenu", function (event) {
            event.preventDefault();
        });
    }

    connectTouchButton(moveLeftBtn, "left");
    connectTouchButton(moveRightBtn, "right");
    connectTouchButton(moveUpBtn, "up");
    connectTouchButton(moveDownBtn, "down");


    /* -----------------------------------------------------
       W. INITIAL GAME STATE
       Show the player and prepare the HUD without starting
       the countdown until the visitor presses Start.
       ----------------------------------------------------- */

    updatePlayerPosition();
    updateGameDisplay();

    gameStatusText("Ready");

    gameOverlayTitle.textContent = "Fruit Frenzy!";
    gameOverlayText.textContent =
        "Collect " +
        FRUIT_TARGET +
        " fruits in 60 seconds. Avoid the bombs!";

    startGameBtn.textContent = "Start game";

    // Start and restart button.
    startGameBtn.addEventListener("click", startGame);
}