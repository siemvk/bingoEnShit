import { playerStateUpdate, type element, type playerId, type toClient, type toServer } from "../packet.js"
/// <reference types="qrcode" />
import type typesForQR from 'qrcode';
declare const QRCode: typeof typesForQR;

// ---- CONFIGURATIE VRAGEN ---- //
interface Question {
    vraag: string;
    fotoUrl: string;
    goedAntwoord: string;
    foutAntwoord: string;
}

const vragen: Question[] = [
    {
        vraag: "Hoelang ben ik bezig geweest met deze websites",
        fotoUrl: "https://cdn.hackclub.com/019ef71a-b87d-7e90-a77d-f3de13357d18/image.png",
        goedAntwoord: "11h",
        foutAntwoord: "13h"
    },
    {
        vraag: "Welk video is meer bekeken?",
        fotoUrl: "https://cdn.nest.rip/uploads/bb365825-c5d3-4fcc-98de-8fdb0c30952d.png",
        goedAntwoord: "mark v poetin",
        foutAntwoord: "meest beken sloplive"
    },
    {
        vraag: "Welk jaar was de eerste aflevering van KOEKELOERE",
        fotoUrl: "https://cdn.hackclub.com/019eea86-330b-76f2-a4fb-ef73ef81a974/image.png",
        goedAntwoord: '1992',
        foutAntwoord: "1994"
    },
    {
        fotoUrl: "https://media.tenor.com/NvNNaFdUvTMAAAAM/scottthewoz-scott.gif",
        vraag: "Hoe heet deze gast (idfk man het is 3:10)",
        goedAntwoord: "scott the woz",
        foutAntwoord: "scott the waz"
    }
];
// ----------------------------- //

const code = document.getElementById("code");
let URL = "wss://ws.siemvk.nl"

if (localStorage.getItem("testing") !== null) {
    URL = "ws://localhost:8081"
}

const ws = new WebSocket(URL)
const adminWs = new WebSocket(URL)

let pin = "None"
let Apin = "None"
let players: string[] = []
let admin: string | undefined = undefined

// Game State
let fase: "voorbereiden" | "vraag" | "uitslag" | "einde" = "voorbereiden";
let currentQuestionIndex = 0;
let playerScores: Record<string, number> = {};
let playerAnswersThisRound: Record<string, string> = {};

function wsSend(ws: WebSocket, data: toServer) {
    ws.send(JSON.stringify(data))
}

ws.addEventListener("open", () => {
    wsSend(ws, { type: "newGame", name: "QUIZ!!!", public: true })
})

adminWs.addEventListener("open", () => {
    wsSend(adminWs, { type: "newGame", name: "QUIZ!!! (admin)", public: false })
})

ws.addEventListener("message", (ev) => {
    const msg: toClient = JSON.parse(ev.data)

    if (msg.type == "pin") {
        pin = msg.pin
        updC();
    }

    if (msg.type == "playerUpdate") {
        if (msg.update == playerStateUpdate.connect) {
            players.push(msg.player)
            if (playerScores[msg.player] === undefined) {
                playerScores[msg.player] = 0;
            }
            console.log("Connect: ", msg.player)
            sendUI(msg.player)
        } else {
            players = players.filter(v => v !== msg.player)
            console.log("Disconnect: ", msg.player)
        }
        sendAdminState();
        updateHostUI();
    }

    // Ontvang antwoorden van spelers
    if (msg.type == "UI-msg" && fase === "vraag") {
        if (msg.elementInteractedWith.id.startsWith("ans-")) {
            const answerText = msg.elementInteractedWith.id.substring(4); // Haal antwoord uit ID
            playerAnswersThisRound[msg.player] = answerText;
            sendUI(msg.player); // Zet naar wachttraject
            updateHostUI();     // Update x/y hebben geantwoord teller
        }
    }
})

adminWs.addEventListener("message", (ev) => {
    const msg: toClient = JSON.parse(ev.data)

    if (msg.type == "pin") {
        Apin = msg.pin
        updC();
    }

    if (msg.type == "playerUpdate") {
        if (msg.update == playerStateUpdate.connect) {
            if (admin != undefined) {
                wsSend(adminWs, { type: "kick", player: msg.player })
            } else {
                admin = msg.player
                sendAdminState()
            }
        } else if (msg.update == playerStateUpdate.disconnect) {
            admin = undefined
        }
    }

    // Admin bediening
    if (msg.type == "UI-msg") {
        const id = msg.elementInteractedWith.id;

        if (id === "startQuiz") {
            fase = "vraag";
            currentQuestionIndex = 0;
            playerScores = {};
            players.forEach(p => playerScores[p] = 0);
            playerAnswersThisRound = {};
            updateAlleSpelers();
            updateHostUI();
            sendAdminState();
        } else if (id === "toonUitslag") {
            fase = "uitslag";
            const q = vragen[currentQuestionIndex]!;
            // Bereken score
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
            wsSend(ws, { type: "kick", player: id.split("-")[1]! })
        }
    }
})

function updateAlleSpelers() {
    players.forEach(player => sendUI(player));
}

// Client UI (Knoppen voor telefoonscherm)
function sendUI(player: playerId) {
    let elements: element[] = [];

    if (fase === "voorbereiden") {
        elements.push({ type: "txt", content: "Welkom! Wacht tot de admin de quiz start.", id: "wait" });
    } else if (fase === "vraag") {
        if (playerAnswersThisRound[player]) {
            elements.push({ type: "txt", content: "Antwoord verstuurd! Wacht op de rest...", id: "wait" });
        } else {
            const q = vragen[currentQuestionIndex]!;
            // Schud de 2 antwoorden zodat de juiste niet altijd bovenaan staat
            const answers = [q.goedAntwoord, q.foutAntwoord].sort(() => Math.random() - 0.5);

            elements.push({ type: "txt", content: "Kies je antwoord:", id: "qText" });
            answers.forEach(ans => {
                elements.push({
                    type: "button",
                    content: ans,
                    icon: "radio_button_unchecked", // <-- Deze eigenschap is verplicht
                    id: "ans-" + ans,
                    interaction: "sendToHost"
                });
            });
        }
    } else if (fase === "uitslag") {
        const q = vragen[currentQuestionIndex]!;
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

// Host UI (Dit is wat iedereen op het grote scherm ziet)
function updateHostUI() {
    const codeCard = document.getElementById("code-card")!;
    const mainCard = document.getElementById("main-card")!;
    const eindCard = document.getElementById("eind-card")!;

    codeCard.hidden = true;
    mainCard.hidden = true;
    eindCard.hidden = true;

    if (fase === "voorbereiden") {
        codeCard.hidden = false;
    } else if (fase === "vraag") {
        mainCard.hidden = false;
        const q = vragen[currentQuestionIndex];
        document.getElementById("vraagTitel")!.innerText = `Vraag ${currentQuestionIndex + 1}: ${q!.vraag}`;

        const img = document.getElementById("vraagFoto") as HTMLImageElement;
        img.src = q!.fotoUrl;
        img.hidden = false;

        const answeredCount = Object.keys(playerAnswersThisRound).length;
        document.getElementById("vraagStatus")!.innerText = `${answeredCount} van de ${players.length} spelers hebben geantwoord.`;
    } else if (fase === "uitslag") {
        mainCard.hidden = false;
        const q = vragen[currentQuestionIndex];
        document.getElementById("vraagTitel")!.innerText = `Het antwoord was: ${q!.goedAntwoord}`;
        document.getElementById("vraagStatus")!.innerText = "Wacht op de volgende vraag...";
    } else if (fase === "einde") {
        eindCard.hidden = false;
        const list = document.getElementById("scoreLijst")!;
        list.innerHTML = "";

        // Sorteer spelers op hoogste score
        const sortedPlayers = Object.keys(playerScores).sort((a, b) => playerScores[b]! - playerScores[a]!);
        sortedPlayers.forEach(p => {
            const li = document.createElement("li");
            li.className = "collection-item";
            li.innerText = `${p} had ${playerScores[p]} goed`;
            list.appendChild(li);
        });
    }
}

// Admin Controles
function sendAdminState() {
    if (admin == undefined) return;

    let elList: element[] = [
        { type: "button", id: "toggelCodeView", content: "Toggle code modal", icon: "qr_code", interaction: "sendToHost" }
    ];

    // Flow controls afhankelijk van de fase
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
        elList.push({ type: 'button', id: "kick-" + p, content: "Kick " + p, icon: "block", interaction: "sendToHost" })
    })

    wsSend(adminWs, { type: "UI-set", player: admin, elements: elList })
}

function updC() {
    code!.innerHTML = "PIN: " + pin + `<br><span style="font-size: 14px; color: #888;">(Spelers: ${players.length})</span>`;
    document.getElementById("pin-pop")!.innerText = "De code is: " + pin;
    document.getElementById("adminPin")!.innerText = "De code is: " + Apin;
    sendAdminState();
    renderQR('my-canvas', pin);
    renderQR('my-canvas-popup', pin);
}

function renderQR(el: string, pin: string) {
    const canvas = document.getElementById(el) as HTMLCanvasElement;
    if (!canvas) return;

    const textToEncode = `https://client.siemvk.nl/player/?p=${pin}`;
    QRCode.toCanvas(canvas, textToEncode, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' }
    }, (error: Error | null | undefined) => {
        if (error) console.error('Failed to generate QR:', error);
    });
}