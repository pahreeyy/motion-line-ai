require('dotenv').config();
// Tambahkan EmbedBuilder di baris pertama ini
const { Client, GatewayIntentBits, Partials, Events, EmbedBuilder } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ 
    model: 'gemini-flash-latest', // Pastikan ini model yang sukses kamu pakai
    systemInstruction: "Kamu adalah asisten bot Discord. Jawablah dengan bahasa yang santai, informatif. Jangan menggunakan baris baru (enter) yang berlebihan."
});

client.once(Events.ClientReady, (readyClient) => {
    console.log(`✅ Bot berhasil login sebagai ${readyClient.user.tag}!`);
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    const prefix = '! ';
    
    if (message.content.startsWith(prefix)) {
        const prompt = message.content.slice(prefix.length).trim();

        if (!prompt) {
            return message.reply('Tolong berikan pertanyaan setelah command. Contoh: `! jelaskan apa itu motion line media`');
        }

        try {
            await message.channel.sendTyping();

            // Minta respon dari Gemini
            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();

            // Filter Spasi Berlebih
            text = text.trim().replace(/\n{3,}/g, '\n\n');

            // Limit karakter deskripsi Embed Discord adalah 4096.
            if (text.length > 4096) {
                text = text.substring(0, 4090) + '\n...';
            }

            // ==========================================
            // MEMBUAT LAYOUT EMBED
            // ==========================================
            const aiEmbed = new EmbedBuilder()
                .setColor('#1E90FF') // Warna garis pinggir (Orange-Red, sesuaikan selera)
                .setDescription(text) // Isi pesan AI diletakkan di dalam deskripsi
                .setFooter({ 
                    text: 'IME Roleplay | Motion Line Media AI', // Footer di bagian bawah
                    iconURL: client.user.displayAvatarURL() // Menampilkan avatar bot di footer
                })
                .setTimestamp(); // Menambahkan waktu pesan dikirim

            // Kirim balasan menggunakan format Embed
            await message.reply({ embeds: [aiEmbed] });

        } catch (error) {
            console.error('❌ Terjadi kesalahan Gemini API:', error);
            message.reply('Maaf, terjadi kesalahan saat menghubungi server AI. Coba lagi nanti.');
        }
    }
});

client.login(process.env.DISCORD_TOKEN);