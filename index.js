const qrcode = require("qrcode-terminal");
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const axios = require("axios");

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
	  args: ['--no-sandbox'],
  }
});

async function req(endpoint,payload) {
  	const URL = `https://story-maker.onrender.com/api/${endpoint}`
	const req = await axios.post(URL, payload, {
	headers: {
	  "Accept": "application/json, text/plain, */*",
	  "Accept-Language": "en-US,en;q=0.8",
	  "Content-Type": "application/json",
	  "Sec-Fetch-Mode": "cors",
	  "Sec-Fetch-Site": "same-origin",
	  "Sec-GPC": "1",
	  "Referer": "https://story-maker.onrender.com/",
	  "Referrer-Policy": "strict-origin-when-cross-origin"
	}
      })
  	const data = await req.data
  	return data
}


client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("Client => Ready! ✅");
  client.on("message_create", async (data) => {
    const message = data.body;
    const _sender = data.from.toString().replace(/[- )(]/g, "");
    const sender = await client.getNumberId(_sender);
    if(sender){
    if (/^\?[^?]*$/.test(message)) {
	const question = message.replace("?","").replace(/^[\n\s]+/,"")
	if(question.length > 1){
	  const query = await req("custom", { prompt: question})
	  await client.sendMessage(sender._serialized, query.data.replace(/^[\n\s]+/,""));
	}
    }
    if (/^\?\?/.test(message)) {
	const _prompt = message.replace("??","").replace(/^[\n\s]+/,"")
	if(_prompt.length > 1){
	  const payload = {
	  image_prompt: _prompt,
	  image_negative_prompt: "",
	  image_model: "anythingV5_PrtRE.safetensors [893e49b9]",
	  image_sample: "DPM++ 2M Karras",
	  image_width: "512",
	  image_height: "512",
	  image_sampling_step: "25",
	  image_cfg: "7",
	  image_seed: "-1"
	};	  
	  const {url} = await req("img",payload)
	  const media = await MessageMedia.fromUrl(url)
	  await client.sendMessage(sender._serialized, media);
	}
      }
      if(message == "img2sticker" && data.hasMedia && data.type == "image"){
	      const _image = await data.downloadMedia()
	      const stickerMedia = new MessageMedia(_image.mimetype, _image.data);
	      client.sendMessage(sender._serialized, stickerMedia, { sendMediaAsSticker: true });
      }
      if(message == "quote"){
		const req = await axios.get("https://quote-garden.onrender.com/api/v3/quotes/random")
		const quote = await req.data.data[0].quoteText
		const quote_by = await req.data.data[0].quoteAuthor
		client.sendMessage(sender._serialized,`${quote} ~ ${quote_by}`)
      }
      if(message == "animequote"){
		const req = await axios.get("https://animechan.xyz/api/random")
		const {anime, character, quote} = await req.data
		client.sendMessage(sender._serialized,`${quote} ~ ${character} [${anime}]`)
      }
    }
  });
});

client.initialize();
