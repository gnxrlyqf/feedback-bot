const { ThreadAutoArchiveDuration } = require("discord.js");
require("dotenv").config();
const fs = require("fs");

const sql = require("./../../database.js");

const defconfig = {
	"thread": {
		"channel": null,
		"inactivity": ThreadAutoArchiveDuration.ThreeDays,
		"age": 7
	},
	"user": {
		"cooldown": 3,
		"cost": 3,
		"reward": 1	
	}
}

const days = {
	60: "one hour",
	1440: "one day",
	4320: "three days",
	10080: "one week"
}

const func = {
	"init": init,
	"channel": channel
}

function output(val) {
	return {
		"inactivity": `Thread inactivity period has been configured to **${days[val]}**`,
		"age": `Thread age has been configured to **${val} days**`,
		"cooldown": `User cooldown has been configured to **${val} days**`,
		"cost": `Post cost has been configured to **${val} points**`,
		"reward": `Feedback reward has been configured to **${val} points**`,
		"channel": `${val} has been chosen as the feedback forum channel`
	}
}

module.exports = {
	load(client) {
		client.on("interactionCreate", (interaction) => {
			if (!interaction.isChatInputCommand() || interaction.commandName !== "config") return;
			
			sub = interaction.options.getSubcommand();
			if (sub in func) {
				func[sub](interaction);
			} else {
				config(interaction, sub);
			}
		});
	}
}

function init(interaction) {
	sql.query(`
		DROP DATABASE IF EXISTS fdb;
		CREATE DATABASE fdb;
		USE fdb;
		CREATE TABLE users (
			id VARCHAR(256) PRIMARY KEY,
			points INT,
			is_banned BOOLEAN
		);
		CREATE TABLE threads (
			num INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
			id VARCHAR(256),
			op VARCHAR(256)
		);
	`, (err) => { if (err) throw err})
	
	fs.writeFile("./src/cogs/feedback/config.json", JSON.stringify(defconfig, null, 4), err => {
		if (err) console.log(err);
	})
	console.log("Database initialized");
	interaction.reply("Database initialized");
}

function config(interaction, sub) {
	const group = interaction.options.getSubcommandGroup();
	fs.readFile("./src/cogs/feedback/config.json", "utf-8", (err, string) => {
		if (err) throw err;
		const data = JSON.parse(string);
		data[group][sub] = interaction.options.getInteger("value");
		fs.writeFile("./src/cogs/feedback/config.json", JSON.stringify(data, null, 4), err => {
			if (err) throw err;
		})
		interaction.reply(output(data[group][sub])[sub]);
	})
}

function channel(interaction) {
	fs.readFile("./src/cogs/feedback/config.json", "utf-8", (err, string) => {
		if (err) throw err;
		const data = JSON.parse(string);
		const channel = interaction.options.getChannel("channel")
		data.thread[sub] = channel.id;
		fs.writeFile("./src/cogs/feedback/config.json", JSON.stringify(data, null, 4), err => {
			if (err) throw err;
		})
		interaction.reply(output(channel)[sub]);
	})
}
