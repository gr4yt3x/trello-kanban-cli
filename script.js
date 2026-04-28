const fs = require("fs");

function buildBoardFromCards(raw) {
  const cards = raw.cards || [];
  const lists = raw.lists || [];

  // Map listId -> listName
  const listMap = {};
  lists.forEach(list => {
    listMap[list.id] = list.name;
  });

  const board = {};

  cards.forEach(card => {
    // skip archived cards
    if (card.closed) return;

    const listName = listMap[card.idList] || "Unknown";

    if (!board[listName]) board[listName] = [];
    board[listName].push(card.name);
  });

  return board;
}

function buildBoardFromActions(actions) {
  const cards = {};

  actions.forEach(action => {
    const { type, data } = action;

    if (type === "createCard") {
      cards[data.card.id] = {
        name: data.card.name,
        list: data.list.name
      };
    }

    if (type === "updateCard" && data.listAfter) {
      const id = data.card.id;

      if (!cards[id]) {
        cards[id] = {
          name: data.card.name,
          list: data.listAfter.name
        };
      }

      cards[id].list = data.listAfter.name;
    }
  });

  const board = {};
  Object.values(cards).forEach(card => {
    if (!board[card.list]) board[card.list] = [];
    board[card.list].push(card.name);
  });

  return board;
}

function printBoard(board) {
  const order = ["Backlog", "To Do", "Doing", "Done"];
  const printed = new Set();

  order.forEach(list => {
    if (!board[list]) return;

    console.log(`\n${list.toUpperCase()}`);
    console.log('─'.repeat(list.length));
    board[list].forEach(name => console.log(`• ${name}`));
    printed.add(list);
  });

  Object.keys(board).forEach(list => {
    if (printed.has(list)) return;

    console.log(`\n${list.toUpperCase()}`);
    console.log('─'.repeat(list.length));
    board[list].forEach(name => console.log(`• ${name}`));
  });
}

const raw = JSON.parse(fs.readFileSync("trello.json", "utf-8"));

let board;

// Prefer real snapshot
if (raw.cards && raw.lists) {
  board = buildBoardFromCards(raw);
}
// ⚠️ fallback to actions (less reliable)
else if (raw.actions) {
  board = buildBoardFromActions(raw.actions);
} else if (Array.isArray(raw)) {
  board = buildBoardFromActions(raw);
} else {
  throw new Error("Unsupported Trello JSON format");
}

printBoard(board);
