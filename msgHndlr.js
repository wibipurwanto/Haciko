const { MessageMedia } = require("whatsapp-web.js");
const moment = require("moment-timezone");
const { IgApiClient } = require("instagram-private-api");
const { createCanvas, loadImage } = require("canvas");
const { color, humanFileSize, processTime } = require("./utils");
const axios = require("axios").default;
const fetch = require("node-fetch");
const syntaxerror = require("syntax-error");
const util = require("util");
const fs = require("fs");
const { menu, groupofc, infobot, owner, wait } = require("./lib/text");
const { apikey } = require("./config.json");
const qc = require("./lib/qc");
const yts = require("yt-search");
const gtts = require("google-tts-api");
const ytdl = require("ytdl-core");
const Menfess = require("./lib/Menfess");
const WP = require("wattpad.js");
const sharp = require("sharp");
const curhatStorage = new Map(); // Objek untuk menyimpan pesan curhat sementara
const wp = new WP();
let cooldown = new Map();
const {
  owners,
  stickerAuthor,
  stickerName,
  banchat,
} = require("./config.json");
const { Game, rewards } = require("./lib/Game");
const { mp3, mp4 } = require("./lib/YouTube");

moment.tz.setDefault("Asia/Jakarta").locale("id");
module.exports = msgHndlr = async (client, message) => {
  try {
    const { from, id, hasMedia, timestamp, type, hasQuotedMsg } = message;
    const { mentionedJidList } = message._data;
    let body = message.body || "";
    let quotedMsg = hasQuotedMsg ? await message.getQuotedMessage() : {};
    global.prefix = /^[./!#%^&=\,;:()]/.test(body)
      ? body.match(/^[./!#%^&=\,;:()]/gi)
      : "#";

    const sender = id.participant || from;
    const user = await client.getContactById(sender);
    const pushname = user.pushname || "Unknown";
    const chat = await message.getChat();
    const command = body.startsWith(prefix)
      ? body.slice(1).split(" ").shift().toLowerCase()
      : "";
    const isCmd = body.startsWith(prefix);
    const args = body.split(" ").slice(1);
    const q = args.join(" ");
    const groupMetadata = chat?.groupMetadata;
    const groupAdmins = groupMetadata?.participants
      .filter((x) => x.isAdmin)
      .map((x) => x.id._serialized);

    const isOwner = owners.includes(sender);
    const isBotAdmin = groupAdmins?.includes(client.info.me._serialized);
    const isAdmin = groupAdmins?.includes(sender);
    const apiKaguya = "https://proud-bear-baseball-cap.cyclic.app";

    // BanChat System
    if (banchat && !isOwner) return;

    // Game Variable
    const game = new Game(sender);
    const checkUser = Game.parseDB(sender).find((x) => x.jid == sender);
    const actionCmd = rewards().map((x) => x.action);

    await client.sendPresenceAvailable();
    await client.sendSeen(from);
    Menfess.createDirpath();

    // Menfess Chat
    if (!isCmd && !chat.isGroup) {
      let menUser =
        Menfess.getUser(sender) || (await Menfess.checkCrush(sender)) || {};
      let forWho =
        menUser.crushJid == sender ? menUser.userJid : menUser.crushJid;
      if (menUser.startChat) {
        await message.forward(forWho);
      }
    }

    // Game Functions
    if (actionCmd.includes(command)) {
      logMsg(command, pushname);
      if (chat.isGroup)
        return message.reply("Perintah hanya dapat dilakukan di personal chat");
      if (!checkUser)
        return message.reply("Akun anda tidak terdaftar di database");
      const didAction = Game.takeAction(sender, command);
      return message.reply(
        `Success!\nYou go ${command} and get ${didAction?.lengthItem} ${didAction?.item} and ${didAction?.xp} experience`
      );
    }

    // Functions
    function isRegistered(sender) {
      // Lakukan pengecekan apakah sender (nomor pengirim) telah terdaftar dalam database
      // Kembalikan true jika terdaftar, false jika tidak
      // Misalnya:
      // return registeredUsers.includes(sender);
      return true; // Ganti dengan logika sesuai kebutuhan
    }

    // Contoh implementasi isBanned
    function isBanned(sender) {
      // Lakukan pengecekan apakah sender (nomor pengirim) terdaftar dalam daftar banned
      // Kembalikan true jika terdaftar, false jika tidak
      // Misalnya:
      // return bannedUsers.includes(sender);
      return false; // Ganti dengan logika sesuai kebutuhan
    }

    // Contoh implementasi isLimit
    function isLimit(sender) {
      // Lakukan pengecekan apakah sender (nomor pengirim) telah mencapai batas penggunaan
      // Kembalikan true jika mencapai batas, false jika tidak
      // Misalnya:
      // return userLimits[sender] >= maxLimit;
      return false; // Ganti dengan logika sesuai kebutuhan
    }
    function reply(message) {
      // Di sini, Anda dapat menambahkan logika untuk mengirim pesan balasan
      console.log("Bot replied:", message);
    }

    function logMsg(cmd, pushname) {
      return console.log(
        color("[CMD]", "green"),
        color(moment(timestamp * 1000).format("DD/MM/YY HH:mm:ss"), "yellow"),
        "FROM",
        color(pushname, "green"),
        "=>",
        color(prefix + cmd, "green")
      );
    }

    function getFilesize(bs64) {
      return humanFileSize(Buffer.byteLength(Buffer.from(bs64, "base64")));
    }

    function monospace(text) {
      return "```" + text + "```";
    }

    // Anti-SPAM
    if (!cooldown.has(from)) {
      cooldown.set(from, new Map());
    }
    let now = Date.now();
    let time = cooldown.get(from);
    let cdAmount = [2000, 3000][Math.floor(Math.random() * 2)];
    if (time.has(from)) {
      let expiration = time.get(from) + cdAmount;
      if (now < expiration && isCmd) {
        return await message.reply(
          `Anda Terdeteksi Spam, Silahkan Kirim Ulang Perintah Dalam *${(
            (expiration - now) /
            1000
          ).toFixed(1)} detik*`
        );
      }
    }
    time.set(from, now);
    setTimeout(() => time.delete(from), cdAmount);

    switch (command) {
      // OWNER/UTILS

      case "help":
      case "menu":
        {
          logMsg(command, pushname);
          return message.reply(menu(pushname));
        }
        break;
      case "speed":
        {
          logMsg(command, pushname);
          return message.reply(
            `_Speed_\n${processTime(timestamp, moment())} second`
          );
        }
        break;
      case "groupofc":
      case "group":
        {
          logMsg(command, pushname);
          return message.reply(groupofc());
        }
        break;
      case "infobot":
      case "info":
        {
          logMsg(command, pushname);
          return message.reply(infobot());
        }
        break;
      case "owner":
      case "creator":
        {
          logMsg(command, pushname);
          return message.reply(owner());
        }
        break;
      case "ping":
        {
          logMsg(command, pushname);
          return message.reply("PONG!");
        }
        break;
      case ">":
        {
          logMsg(command, pushname);
          if (!isOwner) return message.reply("Khusus Owner!");
          let _return;
          let _syntax = "";
          let _text = body.slice(2);
          try {
            try {
              let i = 15;
              let exec = new (async () => {}).constructor(
                "print",
                "message",
                "require",
                "client",
                "from",
                "axios",
                "fs",
                "exec",
                "MessageMedia",
                "chat",
                _text
              );
              _return = await exec.call(
                client,
                (...args) => {
                  if (--i < 1) return;
                  console.log(...args);
                  return message.reply(util.format(...args));
                },
                message,
                require,
                client,
                from,
                axios,
                fs,
                exec,
                MessageMedia,
                chat
              );
            } catch (e) {
              let err = syntaxerror(_text, "Execution Function", {
                allowReturnOutsideFunction: true,
                allowAwaitOutsideFunction: true,
              });
              if (err) _syntax = "```" + err + "```\n\n";
              _return = e;
            } finally {
              return message.reply(_syntax + util.format(_return));
            }
          } catch (error) {
            message.reply(util.format(error));
            console.log(error);
          }
        }
        break;
      //yt
      case "cariyoutube":
      case "searchyoutube":
        {
          logMsg(command, pushname);
          if (args.length === 0) {
            return message.reply(
              "Masukkan kata kunci untuk pencarian video YouTube."
            );
          }

          const searchQuery = args.join(" ");
          try {
            const searchResults = await yts(searchQuery);
            const maxResults = 3; // Jumlah maksimal hasil pencarian yang ingin ditampilkan
            const resultsToShow = searchResults.videos.slice(0, maxResults);

            if (resultsToShow.length === 0) {
              return message.reply("Tidak ada hasil video yang ditemukan.");
            }

            let response = "Hasil Pencarian:\n";
            for (const result of resultsToShow) {
              response += `Judul: ${result.title}\nDurasi: ${result.timestamp}\nURL: ${result.url}\n\n`;
            }

            return message.reply(response);
          } catch (error) {
            console.error(error);
            return message.reply("Terjadi kesalahan saat mencari video.");
          }
        }
        break;
      // CREATOR
      // Menambahkan case untuk fitur peningkatan resolusi
      case "hd":
      case "highres":
        {
          logMsg(command, pushname);
          const quotedMsg = await message.getQuotedMessage();

          if (!quotedMsg) {
            return message.reply(
              "Balas pesan dengan gambar yang ingin diubah menjadi HD."
            );
          }

          if (!quotedMsg.hasMedia) {
            return message.reply(
              "Pesan yang dibalas tidak berisi media (gambar)."
            );
          }

          const media = await quotedMsg.downloadMedia();

          sharp(Buffer.from(media.data, "base64"))
            .resize({ width: 1920, height: 1080 }) // Ganti dengan ukuran resolusi yang diinginkan (HD)
            .toBuffer((err, buffer) => {
              if (err) {
                console.error(err);
                return message.reply("Terjadi kesalahan saat mengubah gambar.");
              }

              const mediaHD = new MessageMedia(
                "image/jpeg",
                buffer.toString("base64")
              );
              message.reply(mediaHD);
            });
        }
        break;
      //stiker
      case "sticker":
      case "stiker":
      case "stc":
      case "s":
        {
          logMsg(command, pushname);
          await message.reply(wait());
          if (hasMedia && (type == "image" || type == "video")) {
            let media = await message.downloadMedia();
            return message.reply(media, from, {
              sendMediaAsSticker: true,
              stickerAuthor,
              stickerName,
            });
          } else if (
            quotedMsg &&
            (quotedMsg.type == "image" || quotedMsg.type == "video")
          ) {
            let media = await (
              await message.getQuotedMessage()
            ).downloadMedia();
            return message.reply(media, from, {
              sendMediaAsSticker: true,
              stickerAuthor,
              stickerName,
            });
          } else {
            return message.reply(
              "Silahkan reply/kirim pesan media dengan caption *#sticker*"
            );
          }
        }
        break;
      case "qc":
        {
          logMsg(command, pushname);
          if (!q && !hasQuotedMsg)
            return message.reply("Silahkan kirim/balas pesan teks");
          if (q.length > 20) return message.reply("Maksimal 20 huruf!");
          if (q && !hasQuotedMsg) {
            let qcdata = await qc(client, message);
            let qcmedia = new MessageMedia(
              "image/jpeg",
              qcdata,
              "quotedC.webp"
            );
            return message.reply(qcmedia, from, {
              sendMediaAsSticker: true,
              stickerAuthor,
              stickerName,
            });
          } else if (hasQuotedMsg) {
            let qcdata = await qc(client, await message.getQuotedMessage());
            let qcmedia = new MessageMedia(
              "image/jpeg",
              qcdata,
              "quotedC.webp"
            );
            return message.reply(qcmedia, from, {
              sendMediaAsSticker: true,
              stickerAuthor,
              stickerName,
            });
          }
        }
        break;

      // DOWNLOADER
      case "ytmp3":
        {
          logMsg(command, pushname);
          if (args.length === 0) return message.reply("Masukkan link youtube");
          mp3(args[0]).then(async (mp3data) => {
            const media = await MessageMedia.fromFilePath(mp3data.path);
            const size = getFilesize(media.data);
            if (Number(size.split(" MB")[0]) >= 40.0)
              return message.reply("Ukuran Media Terlalu Besar");
            let caption = `*Title:* ${mp3data.meta.title}\n*Filesize:* ${size}\n\nSilahkan Tunggu Sebentar`;
            await message.reply(
              await MessageMedia.fromUrl(mp3data.meta.image, {
                unsafeMime: true,
              }),
              from,
              { caption }
            ),
              await message.reply(media, from, { sendMediaAsDocument: true });
          });
        }
        break;

      case "ytmp4":
      case "yt":
        {
          logMsg(command, pushname);
          if (args.length === 0) return message.reply("Masukkan link youtube");
          mp4(args[0]).then(async (mp4data) => {
            const media = await MessageMedia.fromUrl(mp4data.videoUrl, {
              unsafeMime: true,
              filename: mp4data.title,
            });
            const size = getFilesize(media.data);
            if (Number(size.split(" MB")[0]) >= 40.0)
              return message.reply("Ukuran Media Terlalu Besar");
            let caption = `*Title:* ${mp4data.title}\n*Size:* ${size}\n\nSilahkan Tunggu Sebentar`;
            await message.reply(
              await MessageMedia.fromUrl(mp4data.thumb.url, {
                unsafeMime: true,
              }),
              from,
              { caption }
            );
            await message.reply(media, from, {
              sendMediaAsDocument: size >= 16.0,
            });
          });
        }
        break;

      case "ig":
        {
          logMsg(command, pushname);
          if (args.length === 0) {
            return message.reply("Masukkan username pengguna Instagram.");
          }

          const username = args[0];

          try {
            const result = await axios.get(
              `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
              {
                headers: {
                  "x-ig-app-id": "936619743392459",
                  "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36",
                  "Accept-Language": "en-US,en;q=0.9,ru;q=0.8",
                  "Accept-Encoding": "gzip, deflate, br",
                  Accept: "*/*",
                },
              }
            );

            const data = result.data.data.user;

            const user_info = {
              username: data.username,
              full_name: data.full_name,
              biography: data.biography,
              follower_count: data.edge_followed_by.count,
              following_count: data.edge_follow.count,
              post_count: data.edge_owner_to_timeline_media.count,
              profile_pic_url: data.profile_pic_url_hd,
            };

            const response =
              `Informasi Pengguna Instagram:\n` +
              `Username: ${user_info.username}\n` +
              `Nama Lengkap: ${user_info.full_name}\n` +
              `Biografi: ${user_info.biography}\n` +
              `Pengikut: ${user_info.follower_count}\n` +
              `Mengikuti: ${user_info.following_count}\n` +
              `Jumlah Postingan: ${user_info.post_count}\n` +
              `URL Profil Gambar: ${user_info.profile_pic_url}`;

            return message.reply(response);
          } catch (error) {
            console.error(error);
            return message.reply(
              "Terjadi kesalahan saat mendapatkan informasi pengguna Instagram."
            );
          }
        }
        break;

      case "tiktok":
      case "tt":
        {
          logMsg(command, pushname);
          if (args.length === 0) return message.reply("Masukkan link tiktok");
          axios
            .get(`${apiKaguya}/api/tiktokdl?url=${args[0]}`)
            .then(async ({ data }) => {
              let ttdata = data.result;
              let caption = `*Author*: ${ttdata.username} (${
                ttdata.nickname
              })\n*Description*: ${ttdata.description?.trim()}`;
              let media = await MessageMedia.fromUrl(
                ttdata.url_download.server1 ||
                  ttdata.url_download.server2 ||
                  ttdata.url_download.server3,
                { unsafeMime: true, filename: ttdata.description?.trim() }
              );
              await message.reply(media, from, {
                caption,
                sendMediaAsDocument:
                  Number(await getFilesize(media.data).split(" MB")[0]) >= 16.0,
              });
            })
            .catch((err) => {
              console.log(err);
              message.reply("Error Ditemukan! Silahkan Hubungi Admin");
            });
        }
        break;

      case "play":
        {
          logMsg(command, pushname);
          if (args.length === 0)
            return message.reply("Masukkan kata kunci lagu");
          let vids = await yts(q);
          axios
            .get(`${apiKaguya}/api/youtubedl?url=${vids.videos[0].url}`)
            .then(async ({ data }) => {
              let mp3data = data.result;
              if (Number(mp3data.mp3.size.split(" MB")[0]) >= 40.0)
                return message.reply(
                  "Karena filesize/ukuran file besar, bot tidak bisa mengunduh audio"
                );
              let caption = `*Judul*: ${mp3data.title}\n*Filesize:* ${mp3data.mp3.size}\n\nSilahkan Tunggu Beberapa Menit...`;
              await message.reply(
                await MessageMedia.fromUrl(mp3data.thumbnail, {
                  unsafeMime: true,
                  filename: "thumbnail",
                }),
                from,
                { caption }
              );
              await message.reply(
                await MessageMedia.fromUrl(await mp3data.mp3.dlink, {
                  unsafeMime: true,
                  filename: mp3data.title + ".mp3",
                }),
                from,
                { sendMediaAsDocument: true }
              );
            })
            .catch((err) => {
              console.log(err);
              message.reply("Error Ditemukan! Silahkan Hubungi Admin");
            });
        }
        break;

      case "facebook":
      case "fb":
        {
          logMsg(command, pushname);
          if (args.length === 0) return message.reply("Masukkan url facebook");
          axios
            .get(`${apiKaguya}/api/facebookdl?url=${args[0]}`)
            .then(async ({ data }) => {
              let res = data.result;
              let media = await MessageMedia.fromUrl(
                res.hd.dlink || res.sd.dlink,
                { unsafeMime: true }
              );
              if (Number(getFilesize(media.data).split(" MB")[0]) >= 70.0)
                return message.reply("Filesize tidak ngotak");
              return message.reply(media, from, {
                sendMediaAsDocument: true,
                caption: `*Duration*: ${res.duration}`,
              });
            })
            .catch((err) => {
              console.log(err);
              message.reply("Error Ditemukan! Silahkan Hubungi Admin");
            });
        }
        break;
      case "pinterest":
      case "pin":
        {
          logMsg(command, pushname);
          if (args.length === 0) return message.reply("Masukkan url pinterest");
          axios
            .get(`${apiKaguya}/api/pinterestdl?url=${args[0]}`)
            .then(async ({ data }) => {
              let res = data.result;
              let media = await MessageMedia.fromUrl(res.dlink, {
                unsafeMime: true,
              });
              if (Number(getFilesize(media.data).split(" MB")[0]) >= 70.0)
                return message.reply("Filesize tidak ngotak");
              return message.reply(media, from, {
                sendMediaAsDocument:
                  Number(getFilesize(media.data).split(" MB")[0]) >= 15.0,
              });
            })
            .catch((err) => {
              console.log(err);
              message.reply("Error Ditemukan! Silahkan Hubungi Admin");
            });
        }
        break;

      // FUN
      case "menfess":
        {
          logMsg(command, pushname);
          if (args.length === 0)
            return message.reply(`Menfess adalah fitur untuk mengirimkan pesan yang berisi pernyataan suka terhadap crush. Contoh penggunaan ada dibawah

*${prefix}menfess* = Untuk mengirimkan pesan pernyataan suka kepada crush\nContoh : ${prefix}menfess target/nama_samaranmu/pesan\n${prefix}menfess 62xxxxxx|seseorang|hai aku suka kamu
*${prefix}menfess start* = Untuk memulai obrolan. (Hanya bisa dilakukan oleh si crush)\nContoh : ${prefix}menfess start
*${prefix}menfess stop* = Untuk mengakhiri obrolan. (Hanya bisa dilakukan oleh si crush)\nContoh : ${prefix}menfess stop
*${prefix}menfess reset* = Untuk mereset database menfess (Hanya bisa dilakukan oleh owner)\nContoh : ${prefix}menfess reset

Data anda akan sepenuhnya aman dan tidak akan mengalami kebocoran`);
          if (chat.isGroup)
            return message.reply("Khusus pesan pribadi (PC only !)");
          let [menArg, hisName, text] = q.split("/");
          const isOnWa =
            menArg !== "start" && menArg !== "stop" && menArg !== "reset"
              ? await client.isRegisteredUser(menArg)
              : false;
          if (
            !isOnWa &&
            menArg !== "start" &&
            menArg !== "stop" &&
            menArg !== "reset"
          )
            return message.reply("Targetmu tidak terdaftar di WhatsApp");
          const contactJid =
            menArg !== "start" && menArg !== "stop" && menArg !== "reset"
              ? await client.getNumberId(menArg)
              : false;
          const timeMsg = moment(timestamp * 1000).format("DD/MM/YY HH:mm:ss");
          const menCrush = await Menfess.checkCrush(sender);
          const menUser = Menfess.getUser(sender);
          const checkArg = Menfess.getUser(menArg + "@c.us");
          const textMen = `_Hai, kamu dapat pesan rahasia nih_

Waktu Dikirim : ${monospace(timeMsg)}
Pengirim (nama samaran) : ${monospace(hisName)}
Pesan :
${monospace(text)}

*${prefix}menfess start* = Untuk memulai obrolan
*${prefix}menfess stop* = Untuk mengakhiri obrolan`;
          if (menArg && isOnWa) {
            if (menArg == sender.split("@")[0])
              return message.reply(
                "Jangan jadikan diri sendiri sebagai target crush!"
              );
            if (menUser.crushJid && menUser.crushJid !== menArg + "@c.us")
              return message.reply("Anda sudah punya crush, ngotak dong!");
            if (menArg == client.info.me._serialized)
              return message.reply("Jangan bot juga yang dijadikan crush");
            if (fs.existsSync(`${Menfess.dirpath}/${menArg}@c.us.json`))
              Menfess.deleteUser(`${menArg}@c.us`);
            if (
              checkArg.userJid &&
              checkArg.crushJid &&
              checkArg.userJid !== sender &&
              checkArg.crushJid !== sender
            )
              return message.reply("Crush mu sedang di crushin orang lain:/");
            const resdata = await Menfess.updateUser({
              userJid: sender,
              crushJid: contactJid._serialized,
              startChat: false,
            });
            await client.sendMessage(resdata.crushJid, `${textMen}`);
            await message.reply(
              "Sukses !\nBerhasil mengirim pesan menfess ke crushmu, tunngu sampai dia membalasnya di bot ini :)"
            );
          } else if (menArg == "start") {
            if (sender !== menCrush.crushJid)
              return message.reply("Anda belum pernah di _crush in_ siapapun!");
            const resdata = await Menfess.updateUser({
              userJid: menUser.userJid,
              crushJid: menUser.crushJid,
              startChat: true,
            });
            await message.reply(
              "Anda telah membuka obrolan. Silahkan kalian mengobrol dengan hangat satu sama lain~"
            );
            await client.sendMessage(
              resdata.userJid,
              "Crush anda telah membuka obrolan. Silahkan kalian mengobrol dengan hangat satu sama lain~"
            );
          } else if (menArg == "stop") {
            if (sender !== menCrush.crushJid)
              return message.reply("Anda belum pernah di _crush in_ siapapun!");
            const resdata = await Menfess.updateUser({
              userJid: menUser.userJid,
              crushJid: false,
              startChat: false,
            });
            await message.reply(
              "Anda telah memutus obrolan, sekarang anda tidak bisa mengobrol lagi dengannya sampai dia mengirim pesan menfess lagi"
            );
            await client.sendMessage(
              resdata.userJid,
              "Crush anda telah memutus obrolan, anda tidak memiliki crush di database sekarang"
            );
          } else if (menArg == "reset" && isOwner) {
            let dbs = fs.readdirSync(Menfess.dirpath);
            for (let x of dbs) {
              let db = Menfess.getUser(x.replace(".json", ""));
              await client.sendMessage(
                db.userJid,
                "Owner telah mereset database menfess kalian"
              );
              db.crushJid
                ? await client.sendMessage(
                    db.userJid,
                    "Owner telah mereset database menfess kalian"
                  )
                : false;
              Menfess.deleteUser(db.userJid);
            }
            await message.reply("Sukses !");
          }
        }
        break;
      case "me":
      case "profile":
        {
          logMsg(command, pushname);
          if (!checkUser)
            return message.reply("Akun anda tidak terdaftar di database");
          const pp = await MessageMedia.fromUrl(
            await client.getProfilePicUrl(sender),
            { unsafeMime: true }
          );
          const caption = `Personal Info\n*JID*: @${
            checkUser.jid.split("@")[0]
          } (${pushname})\n*Bio*: ${
            (await user.getAbout()) || ""
          }\n\nGame Info\n*XP*: ${checkUser.xp}\n*Money*: ${Game.formatMoney(
            checkUser.money
          )}\n*Last Action*: ${
            checkUser.lastAction
          }\nCek Inventory? *${prefix}inventory*`;
          return message.reply(pp, from, {
            caption,
            mentions: [user],
          });
        }
        break;
      case "inventory":
      case "inv":
        {
          logMsg(command, pushname);
          if (chat.isGroup)
            return message.reply(
              "Perintah hanya dapat dilakukan di personal chat"
            );
          if (!checkUser)
            return message.reply("Akun anda sudah terdaftar di database");
          const invs = checkUser.inventory;
          const lenInv = invs
            .map((x) => x.lengthItem)
            .reduce((previous, current) => previous + current, 0);
          let text = `Isi Inventory Anda\n\nKapasitas = 100\nIsi = ${lenInv}\n`;
          let num = 1;
          for (let i = 0; i < invs.length; i++) {
            text += `\n${num}. *${invs[i].item.toUpperCase()}*\nJumlah: ${
              invs[i].lengthItem
            }`;
            num++;
          }
          return message.reply(text);
        }
        break;

      // RANDOM

      //curhat
      case "curhat":
        {
          logMsg(command, pushname);
          if (args.length === 0) {
            return message.reply("Kirim pesan curhat Anda.");
          }

          const curhatMessage = args.join(" ");
          curhatStorage.set(sender, curhatMessage); // Menyimpan pesan curhat dalam penyimpanan

          return message.reply(
            "Pesan curhat Anda telah diterima. Terima kasih telah berbagi."
          );
        }
        break;
      case "lihatcurhat":
        {
          logMsg(command, pushname);
          const curhatMessage = curhatStorage.get(sender);

          if (!curhatMessage) {
            return message.reply("Anda belum pernah mengirim pesan curhat.");
          }

          return message.reply(`Pesan Curhat Anda:\n${curhatMessage}`);
        }
        break;
      case "anime":
        {
          logMsg(command, pushname);
          let animeimg = await axios.get(
            "https://nekos.life/api/v2/img/wallpaper"
          );
          return message.reply(
            await MessageMedia.fromUrl(animeimg.data.url, {
              unsafeMime: true,
              filename: "anime",
            })
          );
        }
        break;
      case "animeneko":
      case "neko":
        {
          logMsg(command, pushname);
          let animeimg = await axios.get("https://nekos.life/api/v2/img/neko");
          return message.reply(
            await MessageMedia.fromUrl(animeimg.data.url, {
              unsafeMime: true,
              filename: "anime",
            })
          );
        }
        break;
      case "quotes":
        logMsg(command, pushname);
        let quoterand = (
          await axios.get("https://api.quotable.io/quotes/random")
        ).data;
        let quotext = `*"${quoterand[0].content}"*\n\n_${quoterand[0].author}_`;
        return message.reply(quotext);
        break;
      case "fakta":
        {
          logMsg(command, pushname);
          let facts = await axios.get(
            "https://raw.githubusercontent.com/FIlham/fakta-random/main/faktarandom.json"
          );
          let factrand =
            facts.data[Math.floor(Math.random() * facts.data.length)];
          return message.reply(factrand);
        }
        break;

      // GROUP
      case "groupinfo":
        {
          logMsg(command, pushname);
          if (!chat.isGroup) return message.reply("Hanya untuk group chat!");
          let author = await client.getContactById(chat.owner._serialized);
          let gcinfo = `*Subject*: ${
            chat.groupMetadata.subject
          }\n*Date Creation*: ${moment(
            chat.groupMetadata.creation * 1000
          ).format("DD-MM-YY hh:mm:ss")}\n*Author*: @${
            chat.groupMetadata.owner.user
          } (${author.pushname})\n*Description*:\n${chat.groupMetadata.desc}`;
          let gcpp = await MessageMedia.fromUrl(
            await client.getProfilePicUrl(from),
            { unsafeMime: true, filename: "gcpp" }
          );
          await message.reply(gcpp, from, {
            caption: gcinfo,
            mentions: [author],
          });
        }
        break;
      case "kick":
        {
          logMsg(command, pushname);
          if (!chat.isGroup) return message.reply("Hanya untuk group chat!");
          if (!isAdmin) return message.reply("Anda bukanlah admin grup");
          if (!isBotAdmin)
            return message.reply("Jadikan bot admin grup terlebih dahulu");
          if (args.length !== 0 && !hasQuotedMsg) {
            let members = mentionedJidList;
            for (let i = 0; i < members.length; i++) {
              await chat.removeParticipants([members[i]]);
            }
            await message.reply("Sukses !");
          } else if (hasQuotedMsg) {
            let member = quotedMsg.id.participant._serialized;
            await chat.removeParticipants([member]);
            await message.reply("Sukses !");
          } else {
            await message.reply(
              "Silahkan tag/balas pesan member yang ingin di kick"
            );
          }
        }
        break;
      case "add":
        {
          logMsg(command, pushname);
          if (!chat.isGroup) return message.reply("Hanya untuk group chat!");
          if (!isAdmin) return message.reply("Anda bukanlah admin grup");
          if (!isBotAdmin)
            return message.reply("Jadikan bot admin grup terlebih dahulu");
          if (q && !hasQuotedMsg) {
            let members = q.includes("-")
              ? q.replace(" ", "").split("-").join("").slice(1) + "@c.us"
              : q + "@c.us";
            await chat.addParticipants([members]);
            await message.reply("Sukses !");
          } else if (hasQuotedMsg) {
            let member = quotedMsg.id.participant._serialized;
            await chat.addParticipants([member]);
            await message.reply("Sukses !");
          } else {
            await message.reply(
              "Silahkan kirim nomor/balas pesan member yang ingin di tambahkan"
            );
          }
        }
        break;
      case "promote":
      case "pm":
        {
          logMsg(command, pushname);
          if (!chat.isGroup) return message.reply("Hanya untuk group chat!");
          if (!isAdmin) return message.reply("Anda bukanlah admin grup");
          if (!isBotAdmin)
            return message.reply("Jadikan bot admin grup terlebih dahulu");
          if (q && !hasQuotedMsg) {
            let members = mentionedJidList;
            for (let i = 0; i < members.length; i++) {
              await chat.promoteParticipants([members[i]]);
            }
            message.reply("Sukses !");
          } else if (hasQuotedMsg) {
            let member = quotedMsg.id.participant._serialized;
            await chat.promoteParticipants([member]);
            message.reply("Sukses !");
          } else {
            message.reply(
              "Silahkan tag/balas pesan member yang ingin di promote"
            );
          }
        }
        break;
      case "demote":
      case "dm":
        {
          logMsg(command, pushname);
          if (!chat.isGroup) return message.reply("Hanya untuk group chat!");
          if (!isAdmin) return message.reply("Anda bukanlah admin grup");
          if (!isBotAdmin)
            return message.reply("Jadikan bot admin grup terlebih dahulu");
          if (q && !hasQuotedMsg) {
            let members = mentionedJidList;
            for (let i = 0; i < members.length; i++) {
              await chat.demoteParticipants([members[i]]);
            }
            message.reply("Sukses !");
          } else if (hasQuotedMsg) {
            let member = quotedMsg.id.participant._serialized;
            await chat.demoteParticipants([member]);
            message.reply("Sukses !");
          } else {
            message.reply(
              "Silahkan tag/balas pesan member yang ingin di demote"
            );
          }
        }
        break;
      case "groupsettings":
        {
          logMsg(command, pushname);
          if (!chat.isGroup) return message.reply("Hanya untuk group chat!");
          if (args[0]?.toLowerCase() == "close") {
            if (!isAdmin) return message.reply("Anda bukanlah admin grup");
            if (!isBotAdmin)
              return message.reply("Jadikan bot admin grup terlebih dahulu");
            await chat.setMessagesAdminsOnly(true);
            message.reply("Sukses !");
          } else if (args[0]?.toLowerCase() == "open") {
            if (!isAdmin) return message.reply("Anda bukanlah admin grup");
            if (!isBotAdmin)
              return message.reply("Jadikan bot admin grup terlebih dahulu");
            await chat.setMessagesAdminsOnly(false);
            message.reply("Sukses !");
          } else {
            message.reply(
              `Silahkan pilih pengaturan grup\n\n${
                prefix + command
              } close - Menutup grup\n${prefix + command} open - Membuka grup`
            );
          }
        }
        break;

      case "topmovies":
        const numResults = args.length > 0 ? parseInt(args[0]) : 10; // Number of results, default 10

        const options = {
          method: "GET",
          url: "https://imdb-top-100-movies.p.rapidapi.com/",
          headers: {
            "X-RapidAPI-Key":
              "8c69b5ab83msh149e7e2e7698b2fp10c7c1jsn043be9234512",
            "X-RapidAPI-Host": "imdb-top-100-movies.p.rapidapi.com",
          },
        };

        try {
          const response = await axios.request(options);
          const topMovies = response.data;

          // Limit the results based on the desired number
          const limitedMovies = topMovies.slice(0, numResults);

          // Prepare and send the movie list to the user
          let movieList = `Top ${numResults} IMDb Movies:\n`;
          limitedMovies.forEach((movie, index) => {
            movieList += `${index + 1}. ${movie.title} (${movie.year})\n`;
            movieList += `   Rating: ${movie.rating}\n`;
            movieList += `   Description: ${movie.description}\n\n`;
          });

          return message.reply(movieList);
        } catch (error) {
          console.error(error);
          return message.reply(
            "An error occurred while fetching the movie list."
          );
        }
        break;
      case "no":
        {
          logMsg(command, pushname);
          const userTextInput = args.join(" ");

          if (!userTextInput) {
            return message.reply(
              "Anda perlu menyertakan nomor telepon yang akan divalidasi."
            );
          }

          const validateOptions = {
            method: "GET",
            url: "https://phonenumbervalidatefree.p.rapidapi.com/ts_PhoneNumberValidateTest.jsp",
            params: {
              number: userTextInput,
              country: "UY",
              type: "all",
              format: "json",
            },
            headers: {
              "X-RapidAPI-Key":
                "8c69b5ab83msh149e7e2e7698b2fp10c7c1jsn043be9234512",
              "X-RapidAPI-Host": "phonenumbervalidatefree.p.rapidapi.com",
            },
          };

          try {
            const response = await axios.request(validateOptions);
            const validationData = response.data;

            const formattedValidation =
              `Hasil Validasi Nomor Telepon:\n\n` +
              `Nomor Telepon: ${validationData.originalFormat}\n` +
              `Negara: ${validationData.location}\n` +
              `Operator: ${validationData.carrier}\n` +
              `Valid: ${validationData.isValidNumber}\n`;
            `Time_zone: ${validationData.timeZone_s}\n`;

            return message.reply(formattedValidation);
          } catch (error) {
            console.error(error);
            return message.reply(
              "Terjadi kesalahan saat melakukan validasi nomor telepon."
            );
          }
        }
        break;
      case "twitteruser":
        {
          logMsg(command, pushname);
          const twitterUsername = args[0]; // Ambil nama pengguna Twitter dari argumen

          if (!twitterUsername) {
            return message.reply(
              "Anda perlu menyertakan nama pengguna Twitter."
            );
          }

          const twitterOptions = {
            method: "GET",
            url: "https://twitter135.p.rapidapi.com/v2/UserByScreenName/",
            params: {
              username: twitterUsername,
            },
            headers: {
              "X-RapidAPI-Key":
                "8c69b5ab83msh149e7e2e7698b2fp10c7c1jsn043be9234512",
              "X-RapidAPI-Host": "twitter135.p.rapidapi.com",
            },
          };

          try {
            const response = await axios.request(twitterOptions);
            const twitterInfo = response.data.data.user.result;

            let formattedTwitterInfo =
              `Informasi Akun Twitter @${twitterUsername}:\n\n` +
              `Nama Lengkap: ${twitterInfo.name || "N/A"}\n` +
              `Username: @${twitterUsername}\n` +
              `Jumlah Followers: ${
                twitterInfo.legacy.followers_count || "N/A"
              }\n` +
              `Jumlah Tweet: ${twitterInfo.legacy.statuses_count || "N/A"}\n` +
              `Deskripsi: ${twitterInfo.legacy.description || "N/A"}\n` +
              `Profil Verified: ${
                twitterInfo.is_blue_verified ? "Ya" : "Tidak"
              }\n` +
              `Lokasi: ${twitterInfo.legacy.location || "N/A"}\n`;

            if (
              twitterInfo.affiliates_highlighted_label &&
              twitterInfo.affiliates_highlighted_label.label &&
              twitterInfo.affiliates_highlighted_label.label.url
            ) {
              formattedTwitterInfo += `URL Profil: ${twitterInfo.affiliates_highlighted_label.label.url.url}\n`;
            } else {
              formattedTwitterInfo += `URL Profil: N/A\n`;
            }

            return message.reply(formattedTwitterInfo);
          } catch (error) {
            console.error(error);
            return message.reply(
              "Terjadi kesalahan saat mengambil informasi akun Twitter."
            );
          }
        }
        break;

      case "twittercari":
        {
          logMsg(command, pushname);
          const query = args.join(" "); // Ambil query pencarian dari argumen

          if (!query) {
            return message.reply("Anda perlu menyertakan query pencarian.");
          }

          const options = {
            method: "GET",
            url: "https://twitter135.p.rapidapi.com/AutoComplete/",
            params: { q: query }, // Gunakan query yang disediakan oleh pengguna
            headers: {
              "X-RapidAPI-Key":
                "8c69b5ab83msh149e7e2e7698b2fp10c7c1jsn043be9234512",
              "X-RapidAPI-Host": "twitter135.p.rapidapi.com",
            },
          };

          try {
            const response = await axios.request(options);
            const searchResults = response.data.users;

            if (searchResults.length === 0) {
              message.channel.send("Tidak ada pengguna ditemukan.");
            } else {
              let resultMessage = "Hasil Pencarian:\n";
              searchResults.forEach((user, index) => {
                resultMessage += `${index + 1}. ${user.name} (@${
                  user.screen_name
                })\n`;
                resultMessage += `   Terverifikasi: ${user.verified}\n`;
                resultMessage += `   Lokasi: ${user.location}\n`;
                resultMessage += `   Gambar Profil: ${user.profile_image_url_https}\n`;
                resultMessage += "-------------------\n";
              });
              return message.reply(resultMessage);
            }
          } catch (error) {
            console.error(error);
            message.reply(
              "Terjadi kesalahan saat melakukan pencarian di Twitter."
            );
          }
        }
        break;
      case "tiktokcari":
        {
          logMsg(command, pushname);

          // Mengambil input dari pesan pengguna
          const inputKeyword = args.join(" "); // Menggunakan seluruh input yang diberikan oleh pengguna

          const options = {
            method: "GET",
            url: "https://scraptik.p.rapidapi.com/search-users",
            params: {
              keyword: inputKeyword,
              count: "20",
              cursor: "0",
            },
            headers: {
              "X-RapidAPI-Key":
                "8c69b5ab83msh149e7e2e7698b2fp10c7c1jsn043be9234512",
              "X-RapidAPI-Host": "scraptik.p.rapidapi.com",
            },
          };

          try {
            const response = await axios.request(options);
            const fetchedData = response.data;

            if (fetchedData && fetchedData.user_list) {
              const userList = fetchedData.user_list;

              if (userList.length > 0) {
                let responseMessage = `TikTok Users for Keyword "${inputKeyword}":\n\n`;

                for (let i = 0; i < userList.length; i++) {
                  const user = userList[i];
                  const userInfo = user.user_info;

                  responseMessage += `User ${i + 1}:\n`;
                  responseMessage += `- Username: ${userInfo.unique_id}\n`;
                  responseMessage += `- Full Name: ${userInfo.nickname}\n`;
                  responseMessage += `- Follower Count: ${userInfo.follower_count}\n`;
                  responseMessage += `- Following Count: ${userInfo.following_count}\n`;
                  responseMessage += `- Total Favorited: ${userInfo.total_favorited}\n`;
                  responseMessage += `- Biography: ${
                    userInfo.signature || "No biography"
                  }\n`;
                  responseMessage += `\n`;
                }

                await message.reply(responseMessage);
              } else {
                await message.reply(
                  `Tiktok user tidak di temukan "${inputKeyword}".`
                );
              }
            } else {
              await message.reply("Failed to fetch TikTok user data from API.");
            }
          } catch (error) {
            console.error(error);
            await message.reply(
              "An error occurred while fetching data from TikTok API."
            );
          }
        }
        break;
      case "tts":
        {
          logMsg(command, pushname);

          // Mengekstrak teks dari pesan pengguna setelah perintah
          const ttsText = args.join(" ");

          if (!ttsText) {
            return message.reply(
              "Masukan text yang akan di ubah menjadi suara conton .tts hello word"
            );
          }

          const ttsSynthesizeParams = new URLSearchParams();
          ttsSynthesizeParams.set("voice_code", "en-US-1"); // Voice code sesuaikan dengan pilihan suara yang diinginkan
          ttsSynthesizeParams.set("text", ttsText); // Teks yang ingin disintesis menjadi suara
          ttsSynthesizeParams.set("speed", "1.00"); // Kecepatan suara (0.50 - 2.00)
          ttsSynthesizeParams.set("pitch", "1.00"); // Nada suara (0.50 - 2.00)
          ttsSynthesizeParams.set("output_type", "audio_url"); // Tipe keluaran: audio_url

          const ttsSynthesizeOptions = {
            method: "POST",
            url: "https://cloudlabs-text-to-speech.p.rapidapi.com/synthesize",
            headers: {
              "content-type": "application/x-www-form-urlencoded",
              "X-RapidAPI-Key":
                "8c69b5ab83msh149e7e2e7698b2fp10c7c1jsn043be9234512",
              "X-RapidAPI-Host": "cloudlabs-text-to-speech.p.rapidapi.com",
            },
            data: ttsSynthesizeParams,
          };

          try {
            const ttsSynthesizeResponse = await axios.request(
              ttsSynthesizeOptions
            );
            const synthesizedAudioUrl =
              ttsSynthesizeResponse.data.result.audio_url;

            // Mengirim link audio sebagai pesan
            const messageText = `Berikut adalah link audio hasil sintesis:\n${synthesizedAudioUrl}`;
            await message.reply(messageText);
          } catch (error) {
            console.error(error);
            await message.reply(
              "An error occurred while synthesizing audio or sending the message."
            );
          }
        }
        break;

      case "ongoing":
        {
          logMsg(command, pushname);
          try {
            const response = await axios.get(
              "https://api.lolhuman.xyz/api/drakorongoing?apikey=380de1f174fe407bdea39dac"
            );
            const dramas = response.data.result;

            let responseText = "Daftar Drakor Ongoing:\n\n";
            dramas.forEach((drama, index) => {
              responseText += `${index + 1}. ${drama.title}\n`;
              responseText += `- Episode: ${drama.total_episode}\n`;
              responseText += `- Genre: ${drama.genre.join(", ")}\n`;
              responseText += `- Tahun: ${drama.year}\n`;
              responseText += `- Link: ${drama.link}\n\n`;
            });

            chat.sendMessage(responseText);
          } catch (error) {
            console.error(error);
            chat.sendMessage(
              "Terjadi kesalahan saat mengambil data drakor ongoing."
            );
          }
        }
        break;

      case "req":
        {
          logMsg(command, pushname);
          if (args.length < 1)
            return message.reply(
              `Ketik ${prefix}request [fiturnya] [Error Nya Gimana]`
            );
          const requestText = args.join(" ");
          message.reply(
            "Terima Kasih Telah Request Fitur Baru Pada Owner, Jika Itu Sekedar Iseng Maka Akan Di Ban Oleh Bot!"
          );
          const ownerNumber = "6285885785034"; // Ganti dengan nomor WhatsApp pemilik bot
          client.sendMessage(
            ownerNumber + "@s.whatsapp.net",
            `*INFO DARI PENGGUNA*\n*Request Fitur:* ${requestText}`
          );
        }
        break;
      case "spam":
        {
          logMsg(command, pushname);
          if (!isOwner) return message.reply("Khusus Owner ataupun vip");
          await message.reply(wait());
          if (args.length < 2)
            return message.reply(`Penggunaan ${prefix}chat 10 62xnxx/teks`);

          const jumlah = parseInt(args[0]); // Jumlah pesan yang akan dikirim
          if (isNaN(jumlah) || jumlah <= 0)
            return message.reply("Jumlah pesan harus berupa angka positif.");

          const pc = args.slice(1).join(" ");
          const nomor = pc.split("/")[0].replace(/[^0-9]/g, ""); // Menghapus karakter selain angka
          const pesan = pc.split("/")[1];

          for (let i = 0; i < jumlah; i++) {
            await client.sendMessage(nomor + "@s.whatsapp.net", pesan);
          }
          await message.reply(
            `Sukses mengirim chat ke ${nomor} sebanyak ${jumlah} kali:\n${pesan}`
          );
        }
        break;
      case "chat":
        {
          logMsg(command, pushname);
          await message.reply(wait());
          if (args.length < 2)
            return message.reply(
              `Penggunaan ${prefix}chat [jumlah] 62xnxx|teks`
            );

          const jumlah = 2; // Atur jumlah pesan yang akan dikirim menjadi 2
          const pc = args.slice(1).join(" ");
          const nomor = pc.split("|")[0].replace(/[^0-9]/g, ""); // Menghapus karakter selain angka
          const pesan = pc.split("|")[1];

          for (let i = 0; i < jumlah; i++) {
            await client.sendMessage(nomor + "@s.whatsapp.net", pesan);
          }
          await message.reply(
            `Sukses mengirim chat ke ${nomor} sebanyak ${jumlah} kali:\n${pesan}`
          );
        }
        break;

      case "jadwalsholat":
        {
          logMsg(command, pushname);
          if (args.length == 0) {
            return message.reply(`Example: ${prefix + command} Yogyakarta`);
          }

          const city = args[0]; // Kota untuk mendapatkan jadwal sholat
          const apiUrl = `https://api.lolhuman.xyz/api/sholat/${city}?apikey=${apikey}`;

          axios
            .get(apiUrl)
            .then(({ data }) => {
              var text = `Wilayah : ${data.result.wilayah}\n`;
              text += `Tanggal : ${data.result.tanggal}\n`;
              text += `Sahur : ${data.result.sahur}\n`;
              text += `Imsak : ${data.result.imsak}\n`;
              text += `Subuh : ${data.result.subuh}\n`;
              text += `Terbit : ${data.result.terbit}\n`;
              text += `Dhuha : ${data.result.dhuha}\n`;
              text += `Dzuhur : ${data.result.dzuhur}\n`;
              text += `Ashar : ${data.result.ashar}\n`;
              text += `Maghrib : ${data.result.maghrib}\n`; // Perhatikan perbaikan di sini
              text += `Isya : ${data.result.isya}`;
              chat.sendMessage(text);
            })
            .catch((error) => {
              console.error(error);
              chat.sendMessage(
                "Terjadi kesalahan saat mengambil jadwal sholat."
              );
            });
        }
        break;
      case "lk21":
        {
          logMsg(command, pushname);
          if (args.length == 0) {
            return message.reply(`Example: ${prefix + command} Transformer`);
          }

          const full_args = args.join(" "); // Menggabungkan semua argumen menjadi satu query
          const lk21ApiUrl = `https://api.lolhuman.xyz/api/lk21?apikey=${apikey}&query=${full_args}`;

          try {
            var { data } = await axios.get(lk21ApiUrl);
            var caption = `Title : ${data.result.title}\n`;
            caption += `Link : ${data.result.link}\n`;
            caption += `Genre : ${data.result.genre}\n`;
            caption += `Views : ${data.result.views}\n`;
            caption += `Duration : ${data.result.duration}\n`;
            caption += `Tahun : ${data.result.tahun}\n`;
            caption += `Rating : ${data.result.rating}\n`;
            caption += `Desc : ${data.result.desc}\n`;
            caption += `Actors : ${data.result.actors.join(", ")}\n`;
            caption += `Location : ${data.result.location}\n`;
            caption += `Date Release : ${data.result.date_release}\n`;
            caption += `Language : ${data.result.language}\n`;
            caption += `Link Download : ${data.result.link_dl}`;
            await chat.sendMessage(from, {
              image: { url: data.result.thumbnail },
              caption,
            });
          } catch (error) {
            console.error(error);
            chat.sendMessage("Terjadi kesalahan saat mencari informasi film.");
          }
        }
        break;
      case "google":
        {
          logMsg(command, pushname);
          if (args.length == 0)
            return message.reply(`Contoh: ${prefix + command} loli kawaii`);
          const full_args = args.join(" ");
          var { data } = await axios.get(
            `https://api.lolhuman.xyz/api/gsearch?apikey=${apikey}&query=${full_args}`
          );
          var text = "Hasil Pencarian Google : \n";
          for (var x of data.result) {
            text += `Judul : ${x.title}\n`;
            text += `Link : ${x.link}\n`;
            text += `Deskripsi : ${x.desc}\n\n`;
            text += `____________________`;
          }
          chat.sendMessage(text);
        }
        break;

      // ... (case-case lainnya)

      default:
        // ...
        break;

      // case-case lainnya ...
    }
  } catch (err) {
    console.log(err);
    message.reply("Ups, ada kesalahan! silahkan hubungi owner");
  }
};
