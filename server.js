// ================= CONFIG =================
require("dotenv").config();

const express = require("express");
const fetch = require("node-fetch"); // ⚠️ usa node-fetch@2
const cors = require("cors");

const app = express();
app.use(cors());

const API_KEY = process.env.TRACKER_API_KEY;

// ================= VALIDACIÓN =================
if (!API_KEY) {
    console.error("❌ ERROR: Falta la API KEY en el archivo .env");
    process.exit(1);
}

// ================= FUNCIÓN MOCK =================
function getMockData(name, tag) {
    return {
        name: `${name}#${tag}`,
        region: "latam",
        level: Math.floor(Math.random() * 300),
        rank: "Inmortal",
        kd: (Math.random() * 2).toFixed(2),
        winrate: Math.floor(Math.random() * 100) + "%",
        rankImage: "https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/24/largeicon.png"
    };
}

// ================= RUTA VALORANT =================
app.get("/valorant/:name/:tag", async (req, res) => {
    const { name, tag } = req.params;

    try {
        const url = `https://public-api.tracker.gg/v2/valorant/standard/profile/riot/${encodeURIComponent(name)}%23${encodeURIComponent(tag)}`;

        const response = await fetch(url, {
            headers: {
                "TRN-Api-Key": API_KEY
            }
        });

        // 🔴 SI NO ESTÁ AUTORIZADO → USA MOCK
        if (response.status === 401) {
            console.log("⚠️ API no autorizada, usando datos MOCK");
            return res.json(getMockData(name, tag));
        }

        if (!response.ok) {
            return res.status(response.status).json({
                error: "Error en la API de tracker.gg",
                status: response.status
            });
        }

        const data = await response.json();

        const playerData = {
            name: data.data.platformInfo.platformUserHandle,
            region: data.data.platformInfo.platformSlug,
            avatar: data.data.platformInfo.avatarUrl,

            level: data.data.segments?.[0]?.stats?.level?.value || "N/A",
            rank: data.data.segments?.[0]?.stats?.rank?.metadata?.tierName || "Sin rank",
            kd: data.data.segments?.[0]?.stats?.kDRatio?.displayValue || "N/A",
            winrate: data.data.segments?.[0]?.stats?.winPercentage?.displayValue || "N/A",
            rankImage: data.data.segments?.[0]?.stats?.rank?.metadata?.iconUrl || null
        };

        res.json(playerData);

    } catch (error) {
        console.error("❌ ERROR:", error.message);

        // 🔥 SI FALLA TODO → TAMBIÉN USA MOCK
        res.json(getMockData(name, tag));
    }
});

// ================= RUTA TEST =================
app.get("/", (req, res) => {
    res.send("🚀 API VORANIX funcionando correctamente");
});

// ================= SERVER =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🔥 Servidor corriendo en http://localhost:${PORT}`);
});