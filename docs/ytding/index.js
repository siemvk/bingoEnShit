// ytding/index.ts
var vragen = [
  {
    vraag: "Hoelang ben ik bezig geweest met deze websites",
    fotoUrl: "https://cdn.hackclub.com/019ef71a-b87d-7e90-a77d-f3de13357d18/image.png",
    goedAntwoord: "Vrijheidsbeeld",
    foutAntwoord: "Eiffeltoren"
  },
  {
    vraag: "Welk dier zie je op deze foto?",
    fotoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Lion_waiting_in_Namibia.jpg/800px-Lion_waiting_in_Namibia.jpg",
    goedAntwoord: "Leeuw",
    foutAntwoord: "Tijger"
  }
];
var code = document.getElementById("code");
var URL = "wss://ws.siemvk.nl";
if (localStorage.getItem("testing") !== null) {
  URL = "ws://localhost:8081";
}
var ws = new WebSocket(URL);
var adminWs = new WebSocket(URL);
var pin = "None";
var Apin = "None";
var players = [];
var admin = undefined;
var fase = "voorbereiden";
var currentQuestionIndex = 0;
var playerScores = {};
var playerAnswersThisRound = {};
function wsSend(ws2, data) {
  ws2.send(JSON.stringify(data));
}
ws.addEventListener("open", () => {
  wsSend(ws, { type: "newGame", name: "QUIZ!!!", public: true });
});
adminWs.addEventListener("open", () => {
  wsSend(adminWs, { type: "newGame", name: "QUIZ!!! (admin)", public: false });
});
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.type == "pin") {
    pin = msg.pin;
    updC();
  }
  if (msg.type == "playerUpdate") {
    if (msg.update == 1 /* connect */) {
      players.push(msg.player);
      if (playerScores[msg.player] === undefined) {
        playerScores[msg.player] = 0;
      }
      console.log("Connect: ", msg.player);
      sendUI(msg.player);
    } else {
      players = players.filter((v) => v !== msg.player);
      console.log("Disconnect: ", msg.player);
    }
    sendAdminState();
    updateHostUI();
  }
  if (msg.type == "UI-msg" && fase === "vraag") {
    if (msg.elementInteractedWith.id.startsWith("ans-")) {
      const answerText = msg.elementInteractedWith.id.substring(4);
      playerAnswersThisRound[msg.player] = answerText;
      sendUI(msg.player);
      updateHostUI();
    }
  }
});
adminWs.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.type == "pin") {
    Apin = msg.pin;
    updC();
  }
  if (msg.type == "playerUpdate") {
    if (msg.update == 1 /* connect */) {
      if (admin != null) {
        wsSend(adminWs, { type: "kick", player: msg.player });
      } else {
        admin = msg.player;
        sendAdminState();
      }
    } else if (msg.update == 0 /* disconnect */) {
      admin = undefined;
    }
  }
  if (msg.type == "UI-msg") {
    const id = msg.elementInteractedWith.id;
    if (id === "startQuiz") {
      fase = "vraag";
      currentQuestionIndex = 0;
      playerScores = {};
      players.forEach((p) => playerScores[p] = 0);
      playerAnswersThisRound = {};
      updateAlleSpelers();
      updateHostUI();
      sendAdminState();
    } else if (id === "toonUitslag") {
      fase = "uitslag";
      const q = vragen[currentQuestionIndex];
      for (const p in playerAnswersThisRound) {
        if (playerAnswersThisRound[p] === q.goedAntwoord) {
          playerScores[p] = (playerScores[p] || 0) + 1;
        }
      }
      updateAlleSpelers();
      updateHostUI();
      sendAdminState();
    } else if (id === "volgendeVraag") {
      currentQuestionIndex++;
      if (currentQuestionIndex >= vragen.length) {
        fase = "einde";
      } else {
        fase = "vraag";
        playerAnswersThisRound = {};
      }
      updateAlleSpelers();
      updateHostUI();
      sendAdminState();
    } else if (id === "resetQuiz") {
      fase = "voorbereiden";
      updateAlleSpelers();
      updateHostUI();
      sendAdminState();
    } else if (id == "toggelCodeView") {
      document.getElementById("modal1")?.togglePopover();
    } else if (id.startsWith("kick-")) {
      wsSend(ws, { type: "kick", player: id.split("-")[1] });
    }
  }
});
function updateAlleSpelers() {
  players.forEach((player) => sendUI(player));
}
function sendUI(player) {
  let elements = [];
  if (fase === "voorbereiden") {
    elements.push({ type: "txt", content: "Welkom! Wacht tot de admin de quiz start.", id: "wait" });
  } else if (fase === "vraag") {
    if (playerAnswersThisRound[player]) {
      elements.push({ type: "txt", content: "Antwoord verstuurd! Wacht op de rest...", id: "wait" });
    } else {
      const q = vragen[currentQuestionIndex];
      const answers = [q.goedAntwoord, q.foutAntwoord].sort(() => Math.random() - 0.5);
      elements.push({ type: "txt", content: "Kies je antwoord:", id: "qText" });
      answers.forEach((ans) => {
        elements.push({
          type: "button",
          content: ans,
          icon: "radio_button_unchecked",
          id: "ans-" + ans,
          interaction: "sendToHost"
        });
      });
    }
  } else if (fase === "uitslag") {
    const q = vragen[currentQuestionIndex];
    const answered = playerAnswersThisRound[player];
    const isCorrect = answered === q.goedAntwoord;
    elements.push({ type: "txt", content: `Het goede antwoord is: ${q.goedAntwoord}`, id: "res1" });
    if (answered) {
      elements.push({ type: "txt", content: isCorrect ? "✅ Jij had het GOED!" : "❌ Jij had het FOUT!", id: "res2" });
    } else {
      elements.push({ type: "txt", content: "Je was te laat met antwoorden!", id: "res2" });
    }
  } else if (fase === "einde") {
    const score = playerScores[player] || 0;
    elements.push({ type: "txt", content: `De quiz is afgelopen! Jij had er ${score} goed.`, id: "end" });
  }
  wsSend(ws, { type: "UI-set", player, elements });
}
function updateHostUI() {
  const codeCard = document.getElementById("code-card");
  const mainCard = document.getElementById("main-card");
  const eindCard = document.getElementById("eind-card");
  codeCard.hidden = true;
  mainCard.hidden = true;
  eindCard.hidden = true;
  if (fase === "voorbereiden") {
    codeCard.hidden = false;
  } else if (fase === "vraag") {
    mainCard.hidden = false;
    const q = vragen[currentQuestionIndex];
    document.getElementById("vraagTitel").innerText = `Vraag ${currentQuestionIndex + 1}: ${q.vraag}`;
    const img = document.getElementById("vraagFoto");
    img.src = q.fotoUrl;
    img.hidden = false;
    const answeredCount = Object.keys(playerAnswersThisRound).length;
    document.getElementById("vraagStatus").innerText = `${answeredCount} van de ${players.length} spelers hebben geantwoord.`;
  } else if (fase === "uitslag") {
    mainCard.hidden = false;
    const q = vragen[currentQuestionIndex];
    document.getElementById("vraagTitel").innerText = `Het antwoord was: ${q.goedAntwoord}`;
    document.getElementById("vraagStatus").innerText = "Wacht op de volgende vraag...";
  } else if (fase === "einde") {
    eindCard.hidden = false;
    const list = document.getElementById("scoreLijst");
    list.innerHTML = "";
    const sortedPlayers = Object.keys(playerScores).sort((a, b) => playerScores[b] - playerScores[a]);
    sortedPlayers.forEach((p) => {
      const li = document.createElement("li");
      li.className = "collection-item";
      li.innerText = `${p} had ${playerScores[p]} goed`;
      list.appendChild(li);
    });
  }
}
function sendAdminState() {
  if (admin == undefined)
    return;
  let elList = [
    { type: "button", id: "toggelCodeView", content: "Toggle code modal", icon: "qr_code", interaction: "sendToHost" }
  ];
  if (fase === "voorbereiden") {
    elList.push({ type: "button", id: "startQuiz", content: "Start Quiz", icon: "play_arrow", interaction: "sendToHost" });
  } else if (fase === "vraag") {
    elList.push({ type: "button", id: "toonUitslag", content: "Sluit vraag & Toon Antwoord", icon: "visibility", interaction: "sendToHost" });
  } else if (fase === "uitslag") {
    elList.push({ type: "button", id: "volgendeVraag", content: "Volgende Vraag / Afronden", icon: "navigate_next", interaction: "sendToHost" });
  } else if (fase === "einde") {
    elList.push({ type: "button", id: "resetQuiz", content: "Terug naar start", icon: "refresh", interaction: "sendToHost" });
  }
  players.forEach((p) => {
    elList.push({ type: "button", id: "kick-" + p, content: "Kick " + p, icon: "block", interaction: "sendToHost" });
  });
  wsSend(adminWs, { type: "UI-set", player: admin, elements: elList });
}
function updC() {
  code.innerHTML = "PIN: " + pin + `<br><span style="font-size: 14px; color: #888;">(Spelers: ${players.length})</span>`;
  document.getElementById("pin-pop").innerText = "De code is: " + pin;
  document.getElementById("adminPin").innerText = "De code is: " + Apin;
  sendAdminState();
  renderQR("my-canvas", pin);
  renderQR("my-canvas-popup", pin);
}
function renderQR(el, pin2) {
  const canvas = document.getElementById(el);
  if (!canvas)
    return;
  const textToEncode = `https://client.siemvk.nl/player/?p=${pin2}`;
  QRCode.toCanvas(canvas, textToEncode, {
    width: 200,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" }
  }, (error) => {
    if (error)
      console.error("Failed to generate QR:", error);
  });
}

//# debugId=D2EEC855E9ED818764756E2164756E21
//# sourceMappingURL=index.js.map
