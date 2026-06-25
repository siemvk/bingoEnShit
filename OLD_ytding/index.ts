// Hi reader of this code.
// This is not finished.
// its still in dutch
// and i want to redo it since its vibe coded slop
// - siemvk







import { playerStateUpdate, type element, type playerId, type toClient, type toServer } from "../packet.js"
/// <reference types="qrcode" />
import type typesForQR from 'qrcode';
declare const QRCode: typeof typesForQR;

// ---- CONFIGURATIE VRAGEN ---- //
interface Question {
    vraag: string;
    fotoUrl: string;
    goedAntwoord: string;
    fouteAntwoorden: string[]; // <-- Dit is nu een lijst
}

const vragen: Question[] = [
    {
        "vraag": "Wat is de naam van het district dat bekend staat om de mijnbouw en waar de 'Vlammende Vrouw' (Girl on Fire) vandaan komt?",
        "fotoUrl": "https://upload.wikimedia.org/wikipedia/commons/e/e9/Coal_mine_Wyoming.jpg",
        "goedAntwoord": "District 12",
        "fouteAntwoorden": [
            "District 1",
            "District 11",
            "District 4"
        ]
    },
    {
        "vraag": "Hoe heet de vogel die door middel van genetische manipulatie is ontstaan en het symbool wordt van de opstand?",
        "fotoUrl": "https://upload.wikimedia.org/wikipedia/commons/b/b3/Northern_Mockingbird.jpg",
        "goedAntwoord": "Spottegaai (Mockingjay)",
        "fouteAntwoorden": [
            "Nachtegaal",
            "Raaf",
            "Vuurvogel"
        ]
    },
    {
        "vraag": "Wie is de kille, genadeloze president van Panem die altijd een witte roos draagt?",
        "fotoUrl": "https://upload.wikimedia.org/wikipedia/commons/4/4e/White_Rose.jpg",
        "goedAntwoord": "President Snow",
        "fouteAntwoorden": [
            "President Coin",
            "President Heavensbee",
            "President Crane"
        ]
    },
    {
        "vraag": "Welk wapen wordt in de fatale arena voornamelijk gebruikt door Katniss om te jagen en te overleven?",
        "fotoUrl": "https://upload.wikimedia.org/wikipedia/commons/e/eb/Bow_and_arrow_2.jpg",
        "goedAntwoord": "Pijl en boog",
        "fouteAntwoorden": [
            "Zwaard",
            "Speer",
            "Werpmessen"
        ]
    },
    {
        "vraag": "Hoe heten de dodelijke, gemuteerde wespen die hallucinaties veroorzaken als je gestoken wordt?",
        "fotoUrl": "https://upload.wikimedia.org/wikipedia/commons/2/24/Vespula_germanica_Richard_Bartz.jpg",
        "goedAntwoord": "Tracker Jackers",
        "fouteAntwoorden": [
            "Killer Bees",
            "Venom Wasps",
            "Death Stingers"
        ]
    },
    {
        "vraag": "Welk zeldzaam materiaal uit de 'Nether' wordt gebruikt om diamanten uitrusting te upgraden?",
        "fotoUrl": "https://upload.wikimedia.org/wikipedia/commons/1/1d/Gold_ingots.jpg",
        "goedAntwoord": "Netherite",
        "fouteAntwoorden": [
            "Obsidian",
            "Quartz",
            "Glowstone"
        ]
    },
    {
        "vraag": "Hoe heet het groene wezen dat stilletjes op je afkomt en ontploft als het dichtbij genoeg is?",
        "fotoUrl": "https://upload.wikimedia.org/wikipedia/commons/c/c8/Explosion_icon.svg",
        "goedAntwoord": "Creeper",
        "fouteAntwoorden": [
            "Zombie",
            "Enderman",
            "Skeleton"
        ]
    },
    {
        "vraag": "Wat moet je bouwen met minimaal 10 blokken obsidiaan en aansteken met een vuursteen om naar een andere dimensie te reizen?",
        "fotoUrl": "https://upload.wikimedia.org/wikipedia/commons/7/7b/Obsidian_1.jpg",
        "goedAntwoord": "Nether Portal",
        "fouteAntwoorden": [
            "End Portal",
            "Aether Portal",
            "Twilight Portal"
        ]
    },
    {
        "vraag": "Welk gereedschap is het meest efficiënt om stenen blokken en ertsen te breken?",
        "fotoUrl": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Pickaxe.jpg",
        "goedAntwoord": "Houweel (Pickaxe)",
        "fouteAntwoorden": [
            "Bijl",
            "Schep",
            "Zwaard"
        ]
    },
    {
        "vraag": "Hoe heet de eindbaas, een gigantisch vliegend beest, dat je in de 'End' dimensie moet verslaan?",
        "fotoUrl": "https://upload.wikimedia.org/wikipedia/commons/d/da/Welsh_Dragon.svg",
        "goedAntwoord": "Ender Dragon",
        "fouteAntwoorden": [
            "Wither",
            "Elder Guardian",
            "Warden"
        ]
    },
    {
        "vraag": "In welk gevallen, ondergronds insectenrijk speelt het verhaal zich af?",
        "fotoUrl": "https://upload.wikimedia.org/wikipedia/commons/4/4b/Stag_beetle_1.jpg",
        "goedAntwoord": "Hallownest",
        "fouteAntwoorden": [
            "Deepnest",
            "Pharloom",
            "Dirtmouth"
        ]
    },
    {
        "vraag": "Hoe heet het wapen, dat sprekend op een stuk gereedschap lijkt, dat de zwijgende ridder hanteert?",
        "fotoUrl": "https://upload.wikimedia.org/wikipedia/commons/1/13/Nails.jpg",
        "goedAntwoord": "Nail (Spijker)",
        "fouteAntwoorden": [
            "Sword",
            "Needle",
            "Sting"
        ]
    },
    {
        "vraag": "Welk materiaal of valuta verzamel je door vijanden te verslaan om kaarten en upgrades te kunnen kopen?",
        "fotoUrl": "https://upload.wikimedia.org/wikipedia/commons/6/67/Ammonite.jpg",
        "goedAntwoord": "Geo",
        "fouteAntwoorden": [
            "Souls",
            "Essence",
            "Charms"
        ]
    },
    {
        "vraag": "Hoe heet de witte energie die je uit vijanden slaat en verzamelt om jezelf te genezen of spreuken te gebruiken?",
        "fotoUrl": "https://upload.wikimedia.org/wikipedia/commons/f/ff/Solid_white.svg",
        "goedAntwoord": "Soul",
        "fouteAntwoorden": [
            "Void",
            "Essence",
            "Lifeblood"
        ]
    },
    {
        "vraag": "Wie is het vriendelijke, oude personage dat altijd achterblijft in het troosteloze bovengrondse dorpje?",
        "fotoUrl": "https://upload.wikimedia.org/wikipedia/commons/6/6b/Bug_icon.svg",
        "goedAntwoord": "Elderbug",
        "fouteAntwoorden": [
            "Cornifer",
            "Sly",
            "Hornet"
        ]
    },
    {
        "vraag": "Hoe heette het invloedrijke satirische nieuwsprogramma dat deze presentator jarenlang op de NPO presenteerde aan het eind van het weekend?",
        "fotoUrl": "https://upload.wikimedia.org/wikipedia/commons/6/65/TV_icon.svg",
        "goedAntwoord": "Zondag met Lubach",
        "fouteAntwoorden": [
            "De Avondshow",
            "Dit was het nieuws",
            "Even tot hier"
        ]
    },
    {
        "vraag": "Met welke titel wilde deze satiricus zichzelf in 2015 via een burgerinitiatief laten bekronen?",
        "fotoUrl": "https://upload.wikimedia.org/wikipedia/commons/2/23/Tutanchamun_Maske.jpg",
        "goedAntwoord": "Farao der Nederlanden",
        "fouteAntwoorden": [
            "Keizer der Lage Landen",
            "Koning van de Televisie",
            "President van de NPO"
        ]
    },
    {
        "vraag": "Welk succesvol dagelijks actualiteitenprogramma ging hij presenteren nadat hij stopte met zijn wekelijkse format?",
        "fotoUrl": "https://upload.wikimedia.org/wikipedia/commons/e/e1/FullMoon2010.jpg",
        "goedAntwoord": "De Avondshow",
        "fouteAntwoorden": [
            "Laat op Eén",
            "Lubach Late Night",
            "De Dagelijkse Show"
        ]
    },
    {
        "vraag": "Met welke bekende kreet in een virale video introduceerde hij zijn land aan de toenmalige Amerikaanse president Donald Trump?",
        "fotoUrl": "https://upload.wikimedia.org/wikipedia/commons/2/20/Flag_of_the_Netherlands.svg",
        "goedAntwoord": "The Netherlands Second",
        "fouteAntwoorden": [
            "The Netherlands Best",
            "Dutch First",
            "We Are Second"
        ]
    },
    {
        "vraag": "Onder welk pseudoniem had deze komiek en presentator in 2001 een nummer 1-hit in de Top 40 met het nummer 'Jelle'?",
        "fotoUrl": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Musical_notes.svg",
        "goedAntwoord": "Slimme Schemer",
        "fouteAntwoorden": [
            "MC Lubach",
            "Hartebreker",
            "De Satiricus"
        ]
    }
]

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

            // Gooi het goede antwoord en de lijst foute antwoorden in één lijst en schud deze
            const answers = [q.goedAntwoord, ...q.fouteAntwoorden].sort(() => Math.random() - 0.5);

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
        const q = vragen[currentQuestionIndex]!;

        // --- Toon vraag en antwoorden aan de Admin ---
        elList.push({ type: "txt", id: "admin-vraag", content: `Huidige vraag: ${q.vraag}` });
        elList.push({ type: "txt", id: "admin-goed", content: `✅ ${q.goedAntwoord}` });
        q.fouteAntwoorden.forEach((fout, index) => {
            elList.push({ type: "txt", id: `admin-fout-${index}`, content: `❌ ${fout}` });
        });
        // ---------------------------------------------

        elList.push({ type: "button", id: "toonUitslag", content: "Sluit vraag & Toon Antwoord", icon: "visibility", interaction: "sendToHost" });
    } else if (fase === "uitslag") {
        elList.push({ type: "button", id: "volgendeVraag", content: "Volgende Vraag / Afronden", icon: "navigate_next", interaction: "sendToHost" });
    } else if (fase === "einde") {
        elList.push({ type: "button", id: "resetQuiz", content: "Terug naar start", icon: "refresh", interaction: "sendToHost" });
    }
    elList.push({
        type: "txt",
        content: "Players:",
        id: "uaweiufhaw",
    })
    players.forEach((p) => {
        elList.push({ type: 'button', id: "kick-" + p, content: "Kick " + p, icon: "block", interaction: "sendToHost" })
    });

    wsSend(adminWs, { type: "UI-set", player: admin, elements: elList });
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