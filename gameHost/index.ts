import { playerStateUpdate, type element, type playerId, type toClient, type toServer } from "../packet.js"
import QRCode from 'qrcode';

let URL = "wss://ws.siemvk.nl"

if (localStorage.getItem("testing") !== null) {
    URL = "ws://localhost:8081"
}

const ws = new WebSocket(URL)
const adminWs = new WebSocket(URL)

let pin = "None"
let Apin = "None"

let fase: "preparing" | "playingBingo" | "bingo" = "preparing"
let players: string[] = []
let admin: string | undefined = undefined

let drawnNumbers: number[] = [];
let playerCards: Record<string, (number | "FREE")[][]> = {};
let playerMarked: Record<string, number[]> = {};
let bingoMode: "row" | "full" = "row";
let bingoClaims: string[] = [];
let falseBingos: string[] = [];

function generateBingoCard(): (number | "FREE")[][] {
    const card: (number | "FREE")[][] = [[], [], [], [], []];
    const colRanges = [
        { min: 1, max: 15 },
        { min: 16, max: 30 },
        { min: 31, max: 45 },
        { min: 46, max: 60 },
        { min: 61, max: 75 }
    ];

    for (let c = 0; c < 5; c++) {
        const nums = new Set<number>();
        while (nums.size < 5) {
            nums.add(Math.floor(Math.random() * 15) + colRanges[c]!.min);
        }
        const col = Array.from(nums);
        for (let r = 0; r < 5; r++) {
            card[r]![c] = col![r]!;
        }
    }
    card[2]![2] = "FREE";
    return card;
}

function setFase(newFase: "preparing" | "playingBingo" | "bingo" = "preparing") {
    if (newFase === "playingBingo" && fase === "preparing") {
        drawnNumbers = [];
        falseBingos = [];
        bingoClaims = [];
        players.forEach(p => {
            if (!playerCards[p]) playerCards[p] = generateBingoCard();
            if (!playerMarked[p]) playerMarked[p] = [];
        });
    }

    if (newFase == "playingBingo") {
        const codeCard = document.getElementById("code-card");
        const mainCard = document.getElementById("main-card");
        if (codeCard) codeCard.hidden = true;
        if (mainCard) mainCard.hidden = false;
    }

    fase = newFase;
    players.forEach(sendUI);
    sendAdminState();
}

function wsSend(ws: WebSocket, data: toServer) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
    }
}

ws.addEventListener("open", () => {
    const startKnop = document.getElementById("start-knop");
    if (startKnop) startKnop.onclick = init;

    wsSend(ws, {
        type: "newGame",
        name: "BINGO!!!",
        public: true
    })
})

adminWs.addEventListener("open", () => {
    wsSend(adminWs, {
        type: "newGame",
        name: "BINGO!!! (admin)",
        public: false
    })
})

function init() {
    setFase("playingBingo")
}

ws.addEventListener("message", (ev) => {
    const msg: toClient = JSON.parse(ev.data)

    if (msg.type == "pin") {
        pin = msg.pin
        updC();
    }

    if (msg.type == "playerUpdate") {
        if (msg.update == playerStateUpdate.connect) {
            players.push(msg.player)
            if (!playerCards[msg.player]) playerCards[msg.player] = generateBingoCard();
            if (!playerMarked[msg.player]) playerMarked[msg.player] = [];
            console.log("Connect: ", msg.player)
            sendUI(msg.player)
        } else {
            players = players.filter(v => v !== msg.player)
            console.log("Disconnect: ", msg.player)
        }
        sendAdminState();
    }

    if (msg.type == "UI-msg") {
        if (msg.elementInteractedWith.id == "bingo-knop") {
            if (!bingoClaims.includes(msg.player)) {
                bingoClaims.push(msg.player);
            }
            sendUI(msg.player);
            sendAdminState();
        }

        if (msg.elementInteractedWith.id == "markBtn") {
            const markInput = msg.elementData?.find(el => el.id == "markInput");
            if (markInput!.type !== "field") {
                return
            }
            if (markInput && markInput.value) {
                const num = parseInt(markInput.value as string, 10);
                const playerCard = playerCards[msg.player];
                const marks = playerMarked[msg.player];

                if (playerCard && marks && !isNaN(num)) {
                    const isOnCard = playerCard.some(row => row.includes(num));
                    const isDrawn = drawnNumbers.includes(num);

                    if (!marks.includes(num) && isOnCard && isDrawn) {
                        marks.push(num);
                    }
                }
            }
            sendUI(msg.player);
        }
    }
})

function validateBingo(player: string): boolean {
    const card = playerCards[player];
    if (!card) return false;

    const marks = playerMarked[player] || [];

    const isValid = (cell: number | "FREE") =>
        cell === "FREE" || (marks.includes(cell as number) && drawnNumbers.includes(cell as number));

    if (bingoMode === "full") {
        return card.every(row => row.every(isValid));
    } else {
        for (let r = 0; r < 5; r++) if (card[r]!.every(isValid)) return true;
        for (let c = 0; c < 5; c++) {
            let colMarked = true;
            for (let r = 0; r < 5; r++) { if (!isValid(card[r]![c]!)) colMarked = false; }
            if (colMarked) return true;
        }
        let d1 = true, d2 = true;
        for (let i = 0; i < 5; i++) {
            if (!isValid(card![i]![i]!)) d1 = false;
            if (!isValid(card![i]![4 - i]!)) d2 = false;
        }
        return d1 || d2;
    }
}

function sendUI(player: playerId) {
    switch (fase) {
        case "preparing":
            wsSend(ws, {
                type: "UI-set",
                player,
                elements: [{ type: "txt", content: "Wait for the bingo to start!", id: "please-wait" }]
            });
            break;
        case "playingBingo":
            const card = playerCards[player] || generateBingoCard();
            const marks = playerMarked[player] || [];

            let tableHTML = `<table style="width:100%; text-align:center; border-collapse: collapse;" border="1">
                <tr><th>B</th><th>I</th><th>N</th><th>G</th><th>O</th></tr>`;
            for (const row of card) {
                tableHTML += `<tr>`;
                for (const cell of row) {
                    const isMarked = cell === "FREE" || marks.includes(cell as number);
                    const bgColor = isMarked ? '#a3e6a3' : 'transparent';
                    tableHTML += `<td sendData="1" blame="markBtn" extraData="${cell}" extraDataBlame="markInput" style="padding: 10px; background-color: ${bgColor};">${cell}</td>`;
                }
                tableHTML += `</tr>`;
            }
            tableHTML += `</table>`;

            const elementsList: element[] = [
                { type: "html-render", content: tableHTML, id: "bingo-card" },
                // { type: "field", fieldType: "txt", id: "markInput", content: "Nummer om af te strepen:", value: "", icon: "" },
                // { type: "button", id: "markBtn", content: "Streep af", icon: "edit", interaction: "sendToHost" }
            ];

            if (falseBingos.includes(player)) {
                elementsList.push({ type: "txt", content: "Valse Bingo!", id: "valse-bingo" });
            }

            if (bingoClaims.includes(player)) {
                elementsList.push({ type: "txt", content: "The admin is checking your card...", id: "wait-admin" });
            } else {
                elementsList.push({ type: "button", content: "BINGO!!!", icon: "celebration", id: "bingo-knop", interaction: "sendToHost" });
            }

            wsSend(ws, { type: "UI-set", player, elements: elementsList });
            break;
        case "bingo":
            wsSend(ws, {
                type: "UI-set",
                player,
                elements: [{ type: "txt", content: "WE HAVE A WINNER!!!", id: "winner-text" }]
            });
            break;
    }
}

adminWs.addEventListener("message", (ev) => {
    const msg: toClient = JSON.parse(ev.data)

    if (msg.type == "pin") {
        Apin = msg.pin
        updC();
    }

    if (msg.type == "playerUpdate" && msg.update == playerStateUpdate.connect) {
        if (admin != undefined) {
            wsSend(adminWs, { type: "kick", player: msg.player })
        } else {
            admin = msg.player
            sendAdminState()
        }
    } else if (msg.type == "playerUpdate" && msg.update == playerStateUpdate.disconnect) {
        admin = undefined
    }

    if (msg.type == "UI-msg") {
        if (msg.elementInteractedWith.id == "setFase") {
            const newFaseEl = msg.elementData?.find(el => el.id == "faseSelector");
            const newModeEl = msg.elementData?.find(el => el.id == "modeSelector");

            if (newModeEl?.type == "field" && newModeEl.value) {
                bingoMode = newModeEl.value as "row" | "full";
            }
            if (newFaseEl?.type == "field" && newFaseEl.value) {
                setFase(newFaseEl.value as "preparing" | "playingBingo" | "bingo");
            }

        } else if (msg.elementInteractedWith.id == "toggelCodeView") {
            const modal = document.getElementById("modal1");
            if (modal && 'togglePopover' in modal) {
                (modal as any).togglePopover();
            }
        } else if (msg.elementInteractedWith.id == "nextNum") {
            drawNextNumber();
        } else if (msg.elementInteractedWith.id.startsWith("checkBingo-")) {
            const parts = msg.elementInteractedWith.id.split("-");
            if (parts.length > 1) {
                const targetPlayer = parts[1]!;
                if (validateBingo(targetPlayer)) {
                    setFase("bingo");
                    bingoClaims = bingoClaims.filter(c => c !== targetPlayer);
                } else {
                    falseBingos.push(targetPlayer!);
                    bingoClaims = bingoClaims.filter(c => c !== targetPlayer);
                    players.forEach(sendUI);
                    sendAdminState();
                }
            }
        } else if (msg.elementInteractedWith.id.startsWith("kick-")) {
            const parts = msg.elementInteractedWith.id.split("-");
            if (parts.length > 1) {
                wsSend(ws, {
                    type: "kick",
                    player: parts[1]!
                });
            }
        }
    }
})
let nOud: number | "" = ""
function drawNextNumber() {
    if (drawnNumbers.length >= 75) return;
    if (nOud !== "") {
        document.getElementById("getalOud")!.innerHTML = nOud + "<br>" + document.getElementById("getalOud")!.innerHTML
    }
    let n: number;
    do {
        n = Math.floor(Math.random() * 75) + 1;
    } while (drawnNumbers.includes(n));

    drawnNumbers.push(n);
    falseBingos = [];

    players.forEach(sendUI);
    sendAdminState();

    document.getElementById("bingoGetal")!.innerText = n.toString();
    nOud = n;
}

function sendAdminState() {
    if (admin == undefined) return;

    let elList: element[] = [];

    bingoClaims.forEach(p => {
        elList.push({
            type: "button",
            id: "checkBingo-" + p,
            content: `Check Bingo of ${p}!`,
            icon: "gavel",
            interaction: "sendToHost"
        });
    });

    elList.push(
        {
            type: "field",
            fieldType: "radio",
            id: "modeSelector",
            icon: "settings",
            options: ["row", "full"],
            content: "Bingo mode (1 row or full card)",
            value: bingoMode
        },
        {
            type: "field",
            fieldType: "radio",
            id: "faseSelector",
            icon: "dns",
            options: ["preparing", "playingBingo", "bingo"],
            content: "fase",
            value: fase
        },
        { type: "button", id: "setFase", content: "Save (Set Fase/Mode)", icon: "save", interaction: "sendToHost" },
        { type: "button", id: "toggelCodeView", content: "Toggle code popup", icon: "dns", interaction: "sendToHost" }
    );

    if (fase == "playingBingo") {
        elList.push({ type: "button", id: "nextNum", content: "Next number", icon: "navigate_next", interaction: "sendToHost" })
        elList.push({ type: "txt", id: "drawn-list", content: `Drawn (${drawnNumbers.length}/75)` })
    }

    players.forEach((p) => {
        elList.push({ type: 'button', id: "kick-" + p, content: "Kick " + p, icon: "block", interaction: "sendToHost" })
    })

    wsSend(adminWs, { type: "UI-set", player: admin, elements: elList })
}

function updC() {
    const codeEl = document.getElementById("code");
    const pinPop = document.getElementById("pin-pop");
    const adminPin = document.getElementById("adminPin");

    if (codeEl) codeEl.innerText = "PIN: " + pin;
    if (pinPop) pinPop.innerText = "The code is: " + pin;
    if (adminPin) adminPin.innerText = "The code is: " + Apin;

    sendAdminState();
    renderQR('my-canvas', pin);
    renderQR('my-canvas-popup', pin);
    renderQR('my-canvas-popup-A', Apin);
}

function renderQR(elId: string, pinCode: string) {
    const canvas = document.getElementById(elId) as HTMLCanvasElement | null;
    if (!canvas) {
        console.error(`Canvas element ${elId} not found!`);
        return;
    }
    const textToEncode = `https://client.siemvk.nl/player/?p=${pinCode}`;

    QRCode.toCanvas(canvas, textToEncode, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' }
    }, (error: Error | null | undefined) => {
        if (error) console.error('Failed to generate QR code:', error);
    });
}