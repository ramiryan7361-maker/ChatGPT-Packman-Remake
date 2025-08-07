
// React & ReactDOM loaded via CDN in index.html

const { useState, useEffect } = React;

const gridSize = 10;
const initialGrid = Array(gridSize * gridSize).fill(0);
const walls = [12, 13, 14, 22, 32, 42, 52, 62, 72, 82];
const foodIndices = initialGrid.map((_, i) => (walls.includes(i) ? 0 : 1));
const ghostStartPositions = [99, 89, 79, 69];
const ghostColors = ["bg-red-500", "bg-blue-500", "bg-pink-500", "bg-green-500"];
const ghostFaces = ["😈", "👻", "😡", "💀"];

const cosmetics = [
  { id: "blue", name: "Blue Pacman", cost: 50, color: "bg-blue-400" },
  { id: "rainbow", name: "Rainbow Trail", cost: 100, color: "bg-gradient-to-r from-pink-500 via-yellow-500 to-blue-500" },
  { id: "crown", name: "Crown Pacman", cost: 150, color: "bg-yellow-300", emoji: "👑" }
];

const eatSound = new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_9bcd56e2a0.mp3?filename=video-game-coin-collect-retro-8-bit-sound-117566.mp3");
const gameOverSound = new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_b7029f5c88.mp3?filename=video-game-death-sound-117576.mp3");

function PacmanGame() {
  const [pacmanPos, setPacmanPos] = useState(0);
  const [food, setFood] = useState(foodIndices);
  const [score, setScore] = useState(0);
  const [ghostPositions, setGhostPositions] = useState(ghostStartPositions);
  const [gameOver, setGameOver] = useState(false);
  const [difficulty, setDifficulty] = useState("medium");
  const [lives, setLives] = useState(3);
  const [hunger, setHunger] = useState(100);
  const [points, setPoints] = useState(() => parseInt(localStorage.getItem("points")) || 0);
  const [ownedCosmetics, setOwnedCosmetics] = useState(() => JSON.parse(localStorage.getItem("ownedCosmetics")) || []);
  const [equippedCosmetic, setEquippedCosmetic] = useState(() => localStorage.getItem("equippedCosmetic") || "");

  const difficultySpeed = { easy: 800, medium: 500, hard: 250, hardcore: 250 };
  const difficultyMultiplier = { easy: 1, medium: 2, hard: 3, hardcore: 5 };
  const hungerDecrement = difficulty === "hardcore" ? 2 : 1;

  const movePacman = (direction) => {
    if (gameOver) return;
    let newPos = pacmanPos;
    if (direction === "ArrowUp" && pacmanPos >= gridSize) newPos -= gridSize;
    else if (direction === "ArrowDown" && pacmanPos < gridSize * (gridSize - 1)) newPos += gridSize;
    else if (direction === "ArrowLeft" && pacmanPos % gridSize !== 0) newPos -= 1;
    else if (direction === "ArrowRight" && (pacmanPos + 1) % gridSize !== 0) newPos += 1;

    if (!walls.includes(newPos)) {
      setPacmanPos(newPos);
      if (food[newPos]) {
        const newFood = [...food];
        newFood[newPos] = 0;
        setFood(newFood);
        const earned = 1 * difficultyMultiplier[difficulty];
        setScore(score + earned);
        setPoints((prev) => {
          const updated = prev + earned;
          localStorage.setItem("points", updated);
          return updated;
        });
        setHunger(100);
        eatSound.play();
      }
    }
  };

  const getNextGhostMove = (ghostIndex, currentPos) => {
    const directions = [-1, 1, -gridSize, gridSize];
    const validMoves = directions
      .map((dir) => currentPos + dir)
      .filter(
        (pos) =>
          pos >= 0 &&
          pos < gridSize * gridSize &&
          !walls.includes(pos) &&
          Math.abs((pos % gridSize) - (currentPos % gridSize)) <= 1
      );

    let bestMove = currentPos;
    let shortestDistance = Infinity;
    for (const move of validMoves) {
      const distance =
        Math.abs((move % gridSize) - (pacmanPos % gridSize)) +
        Math.abs(Math.floor(move / gridSize) - Math.floor(pacmanPos / gridSize));
      if (distance < shortestDistance) {
        shortestDistance = distance;
        bestMove = move;
      }
    }
    return bestMove;
  };

  const moveGhosts = () => {
    const newPositions = ghostPositions.map((pos, i) => getNextGhostMove(i, pos));
    setGhostPositions(newPositions);
    if (newPositions.includes(pacmanPos)) {
      if (lives > 1) {
        setLives(lives - 1);
        setPacmanPos(0);
      } else {
        setGameOver(true);
        gameOverSound.play();
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => movePacman(e.key);
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pacmanPos, food, gameOver]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!gameOver) moveGhosts();
    }, difficultySpeed[difficulty]);
    return () => clearInterval(interval);
  }, [ghostPositions, pacmanPos, gameOver, difficulty]);

  useEffect(() => {
    if (difficulty === "hardcore" && !gameOver) {
      const hungerInterval = setInterval(() => {
        setHunger((prev) => {
          if (prev <= hungerDecrement) {
            setGameOver(true);
            return 0;
          }
          return prev - hungerDecrement;
        });
      }, 1000);
      return () => clearInterval(hungerInterval);
    }
  }, [difficulty, gameOver]);

  const buyCosmetic = (id, cost) => {
    if (ownedCosmetics.includes(id) || points < cost) return;
    const updated = [...ownedCosmetics, id];
    setOwnedCosmetics(updated);
    localStorage.setItem("ownedCosmetics", JSON.stringify(updated));
    setPoints((p) => {
      const newPts = p - cost;
      localStorage.setItem("points", newPts);
      return newPts;
    });
  };

  const equipCosmetic = (id) => {
    setEquippedCosmetic(id);
    localStorage.setItem("equippedCosmetic", id);
  };

  const currentCosmetic = cosmetics.find((c) => c.id === equippedCosmetic);

  return React.createElement("div", { className: "flex flex-col items-center p-4" },
    React.createElement("h1", { className: "text-2xl font-bold mb-2" }, "Pacman Game"),
    gameOver && React.createElement("div", { className: "text-red-500 font-bold mb-2" }, "Game Over!"),
    React.createElement("div", { className: "mb-2" },
      `Score: ${score} | Lives: ${lives} | Points: ${points} `,
      difficulty === "hardcore" ? `| Hunger: ${hunger}` : null
    ),
    React.createElement("div", { className: "mb-4" },
      React.createElement("label", { className: "mr-2 font-semibold" }, "Difficulty:"),
      React.createElement("select", {
        value: difficulty,
        onChange: (e) => setDifficulty(e.target.value),
        className: "text-black px-2 py-1 rounded"
      },
        React.createElement("option", { value: "easy" }, "Easy"),
        React.createElement("option", { value: "medium" }, "Medium"),
        React.createElement("option", { value: "hard" }, "Hard"),
        React.createElement("option", { value: "hardcore" }, "Hardcore")
      )
    ),
    React.createElement("div", { className: "grid grid-cols-10 gap-1" },
      initialGrid.map((_, i) => {
        const ghostIndex = ghostPositions.indexOf(i);
        const classes = [
          "w-6 h-6 border flex items-center justify-center text-sm",
          walls.includes(i) ? "bg-gray-800" : "",
          pacmanPos === i ? (currentCosmetic?.color || "bg-yellow-300") : "",
          ghostIndex !== -1 ? ghostColors[ghostIndex] : "",
          food[i] && pacmanPos !== i && ghostIndex === -1 ? "bg-green-400" : ""
        ].join(" ");
        return React.createElement("div", { key: i, className: classes.trim() },
          pacmanPos === i && currentCosmetic?.emoji ? currentCosmetic.emoji : "",
          ghostIndex !== -1 ? ghostFaces[ghostIndex] : ""
        );
      })
    ),
    React.createElement("div", { className: "mt-4 w-full max-w-md" },
      React.createElement("h2", { className: "text-xl font-bold mb-2" }, "Cosmetics Store"),
      cosmetics.map((cos) =>
        React.createElement("div", { key: cos.id, className: "flex justify-between items-center bg-gray-700 p-2 mb-1 rounded" },
          React.createElement("span", null, cos.name),
          ownedCosmetics.includes(cos.id)
            ? React.createElement("button", {
              onClick: () => equipCosmetic(cos.id),
              className: "bg-blue-500 px-2 py-1 text-sm rounded"
            }, equippedCosmetic === cos.id ? "Equipped" : "Equip")
            : React.createElement("button", {
              onClick: () => buyCosmetic(cos.id, cos.cost),
              className: "bg-green-500 px-2 py-1 text-sm rounded"
            }, `Buy (${cos.cost})`)
        )
      )
    )
  );
}

ReactDOM.render(React.createElement(PacmanGame), document.getElementById("root"));
