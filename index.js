require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 1. Inisialisasi Discord Client
// Menggunakan GatewayIntentBits yang benar untuk membaca pesan
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, 
    ],
    partials: [Partials.Channel],
});

// 2. Inisialisasi Gemini AI
// Kita paksa menggunakan model gemini-1.5-flash yang paling stabil
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Event: Bot Berhasil Online
client.once('ready', (c) => {
    console.log(`✅ Ready! Login sebagai ${c.user.tag}`);
});

// Event: Pesan Masuk
client.on('messageCreate', async (message) => {
    // 1. Abaikan jika pesan dari bot lain
    if (message.author.bot) return;

    // 2. Cek apakah pesan diawali dengan prefix !ai
    const prefix = "!ai";
    if (!message.content.toLowerCase().startsWith(prefix)) return;

    // Ambil teks setelah prefix
    const prompt = message.content.slice(prefix.length).trim();

    if (!prompt) {
        return message.reply("Halo! Mau tanya apa hari ini? Contoh: `!ai apa itu Motion Line Media?` ");
    }

    try {
        // Beri tanda bot sedang berpikir
        await message.channel.sendTyping();

        // 3. Proses ke Gemini
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // 4. Penanganan batas karakter Discord (Max 2000)
        if (text.length > 2000) {
            const chunks = text.match(/[\s\S]{1,2000}/g);
            for (const chunk of chunks) {
                await message.reply(chunk);
            }
        } else {
            await message.reply(text);
        }

    } catch (error) {
        console.error("Kesalahan Gemini API:", error);

        // Jika masih muncul 404, kita beri pesan yang jelas di log
        if (error.message.includes("404")) {
            message.reply("⚠️ Error 404: Model tidak ditemukan. Pastikan API Key aktif dan library @google/generative-ai sudah terupdate.");
        } else {
            message.reply("Maaf, otak AI-ku sedang panas. Coba lagi nanti ya!");
        }
    }
});

// Login ke Discord
client.login(process.env.DISCORD_TOKEN);