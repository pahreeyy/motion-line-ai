require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 1. Inisialisasi Discord Client dengan Intent yang dibutuhkan
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // Wajib diaktifkan di Discord Developer Portal
    ],
    partials: [Partials.Channel],
});

// 2. Inisialisasi Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Menggunakan model gemini-1.5-flash untuk respon teks yang cepat dan optimal
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Event saat bot berhasil online
client.once('ready', () => {
    console.log(`✅ Bot berhasil login sebagai ${client.user.tag}!`);
});

// Event saat ada pesan masuk
client.on('messageCreate', async (message) => {
    // Abaikan pesan dari bot lain untuk mencegah infinite loop
    if (message.author.bot) return;

    // Trigger bot jika pesan diawali dengan "!ai "
    const prefix = '!ai ';
    
    if (message.content.startsWith(prefix)) {
        const prompt = message.content.slice(prefix.length).trim();

        if (!prompt) {
            return message.reply('Tolong berikan pertanyaan setelah command !ai. Contoh: `!ai buktikan bumi itu bulat`');
        }

        try {
            // Tampilkan indikator "Bot is typing..."
            await message.channel.sendTyping();

            // Minta respon dari Gemini
            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();

            // Discord memiliki batas maksimal 2000 karakter per pesan.
            // Jika lebih dari 2000 karakter, potong pesannya.
            if (text.length > 2000) {
                text = text.substring(0, 1996) + '...';
            }

            // Kirim balasan ke Discord
            await message.reply(text);

        } catch (error) {
            console.error('Terjadi kesalahan:', error);
            message.reply('Maaf, terjadi kesalahan pada server AI saat memproses permintaanmu.');
        }
    }
});

// Login ke Discord
client.login(process.env.DISCORD_TOKEN);    