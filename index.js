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

const MediaKnowledge = `
Kamu adalah asisten bot Discord komunitas FiveM pekerjaan Motion Line Media. Jawablah dengan bahasa yang santai, informatif, dan rapi menggunakan bullet points atau numbering jika perlu. Jangan menggunakan baris baru (enter) yang berlebihan.
Berikut adalah informasi inti server yang harus kamu jadikan acuan utama saat menjawab pertanyaan warga:

1. INFO SERVER ROLEPLAY
- Server IME Roleplay adalah komunitas FiveM terbesar di Indonesia yang didirkan oleh Windah Basudara dan Delwyn Sukamto

2. MOTION LINE MEDIA
- Motion Line Media adalah satu pekerjaan yang ada di IME Roleplay yang memiliki jobdesk membuat artikel yang dapat dinikmati masyarakat San Andreas

3. STAFF MOTION LINE MEDIA
- Decay Fury (BOS BESAR)
- Guntur Shiro (CEO)
- Isat Solihin (CEO)
- J Shireen (Cleaning Service Kantor)
- Sei A Vincere (Staff)
- Derrick Johnson (Staff)
- Vab Dul Ohvenzoy (Staff)
- Bell Von Volstaire (Staff)
- Reinhard Von Volstaire (Staff)
- Reyy Clinton (Staff)
- Camel Biruw (Staff)
- Jan Petter (Staff)
- Aksaja Prawira (Staff)
- Andra Wibawa (Staff)

4. LAYANAN MOTION LINE MEDIA
1. Advertising ($60.000)
2. News Coverage ($60.000)
3. News + Live Coverage (Start from $150.000)
4. Billboard Bundling Semua Titik 1 Hari ($100.000)
5. Billboard Bundling Semua Titik 3 Hari ($250.000)
6. Billboard Bundling Semua Titik 1 Hari (Discount Instansi $90.000)
7. Billboard Bundling Semua Titik 3 Hari (Discount Instansi $220.000)
8. Leaderboard Ads 1 Hari ($10.000)
9. Exclusive Billboard Semua Titik 1 Hari ($300.000)
10. Design Banner ($30.000)
11. Tablet Media ($1.000)
`

const model = genAI.getGenerativeModel({ 
    model: 'gemini-flash-latest', // Pastikan ini model yang sukses kamu pakai
    systemInstruction: MediaKnowledge
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