require("dotenv").config();
const {Client, IntentsBitField} = require("discord.js")
const fs = require("fs");

const client = new Client({
	intents: [
		IntentsBitField.Flags.Guilds,
		IntentsBitField.Flags.GuildMembers,
		IntentsBitField.Flags.GuildMessages,
		IntentsBitField.Flags.MessageContent
	]
});
client.login(process.env.TOKEN);
client.on("ready", async () => {
	console.log("Bot is ready.");
});
	
const folders = fs.readdirSync(`./src/cogs/`);
for (const folder of folders) {
    let files = fs.readdirSync(`./src/cogs/${folder}`);
	files = files.filter(file => file.endsWith('.js'));
    for (const file of files) {
		const cog = require(`./cogs/${folder}/${file}`);
		cog.load(client);	
	}
}