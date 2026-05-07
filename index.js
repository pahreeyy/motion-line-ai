require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Events } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ==========================================
// 1. INISIALISASI DISCORD CLIENT
// ==========================================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // Pastikan ini sudah aktif di Discord Developer Portal
    ],
    partials: [Partials.Channel],
});

// ==========================================
// 2. INISIALISASI GEMINI AI
// ==========================================
// Memanggil API Key dari file .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Menggunakan model stabil terbaru (gemini-1.5-flash)
const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash'
});

// ==========================================
// 3. EVENT: BOT ONLINE
// ==========================================
// Menggunakan Events.ClientReady untuk menghindari DeprecationWarning di log PM2
client.once(Events.ClientReady, (readyClient) => {
    console.log(`✅ Bot berhasil login sebagai ${readyClient.user.tag}!`);
    console.log(`🚀 Sistem AI siap menerima perintah di Discord.`);
});

// ==========================================
// 4. EVENT: PESAN MASUK
// ==========================================
client.on(Events.MessageCreate, async (message) => {
    // Abaikan pesan yang dikirim oleh bot (termasuk bot ini sendiri) untuk mencegah loop
    if (message.author.bot) return;

    // Tentukan prefix command
    const prefix = '!ai ';
    
    if (message.content.startsWith(prefix)) {
        // Ambil teks setelah prefix '!ai '
        const prompt = message.content.slice(prefix.length).trim();

        // Cek jika user hanya mengetik '!ai' tanpa pertanyaan
        if (!prompt) {
            return message.reply('Tolong berikan pertanyaan setelah command. Contoh: `!ai buktikan bumi itu bulat`');
        }

        try {
            // Tampilkan indikator "Bot is typing..." di Discord
            await message.channel.sendTyping();

            // Kirim prompt ke server Google Gemini
            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();

            // Limit karakter Discord per pesan adalah 2000 karakter.
            // Jika balasan AI terlalu panjang, kita potong agar tidak error.
            if (text.length > 2000) {
                text = text.substring(0, 1995) + '\n...';
            }

            // Balas pesan user
            await message.reply(text);

        } catch (error) {
            // Tangkap dan log error ke terminal VPS jika terjadi masalah
            console.error('❌ Terjadi kesalahan Gemini API:', error);
            message.reply('Maaf, terjadi kesalahan saat menghubungi server AI. Coba lagi nanti atau cek log servermu.');
        }
    }
});

// ==========================================
// 5. JALANKAN BOT
// ==========================================
// Login menggunakan Token Discord dari file .env
client.login(process.env.DISCORD_TOKEN);