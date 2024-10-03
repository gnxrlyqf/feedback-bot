const { ThreadAutoArchiveDuration, PermissionsBitField } = require("discord.js");
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
	},
	"mod": null
}

const days = {
	60: "one hour",
	1440: "one day",
	4320: "three days",
	10080: "one week"
}

const func = {
	"init": init,
	"channel": channel,
	"mod": mod
}

function output(val) {
	return {
		"inactivity": `Thread inactivity period has been configured to **${days[val]}**`,
		"age": `Thread age has been configured to **${val} days**`,
		"cooldown": `User cooldown has been configured to **${val} days**`,
		"cost": `Post cost has been configured to **${val} points**`,
		"reward": `Feedback reward has been configured to **${val} points**`
	}
}

module.exports = {
	load(client) {
		client.on("interactionCreate", (interaction) => {
			if (!interaction.isChatInputCommand() || interaction.commandName !== "config") return;
			
			if (!admin(interaction)) return;

			const sub = interaction.options.getSubcommand();
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
			op VARCHAR(256),
			file VARCHAR(1024),
			FOREIGN KEY (op) REFERENCES users(id)
		);
		CREATE TABLE contributions (
			user_id VARCHAR(256),
			thread_num INT,
			FOREIGN KEY (user_id) REFERENCES users(id),
			FOREIGN KEY (thread_num) REFERENCES threads(num)
		);

	`, (err) => { if (err) throw err})
	
	fs.writeFile("./src/cogs/feedback/config.json", JSON.stringify(defconfig, null, 4), err => {
		if (err) console.log(err);
	})
	console.log("Database initialized");
	interaction.reply({
		content:"Database initialized",
		ephemeral: true
	});
}

function config(interaction, sub) {
	if (!admin(interaction)) return;

	const group = interaction.options.getSubcommandGroup();
	fs.readFile("./src/cogs/feedback/config.json", "utf-8", (err, string) => {
		if (err) throw err;

		const data = JSON.parse(string);
		data[group][sub] = interaction.options.getInteger("value");
		fs.writeFile("./src/cogs/feedback/config.json", JSON.stringify(data, null, 4), err => {
			if (err) throw err;
		})
		interaction.reply({
			content: output(data[group][sub])[sub],
			ephemeral: true
		});
	})
}

function channel(interaction) {
	fs.readFile("./src/cogs/feedback/config.json", "utf-8", (err, string) => {
		if (err) throw err;

		const data = JSON.parse(string);
		const channel = interaction.options.getChannel("channel")
		const sub = interaction.options.getSubcommand();
		data.thread[sub] = channel.id;
		fs.writeFile("./src/cogs/feedback/config.json", JSON.stringify(data, null, 4), err => {
			if (err) throw err;
		})
		interaction.reply({
			content: `${channel} has been selected as the dedicated feedback forum channel`,
			ephemeral: true
		});
	})
}

function mod(interaction) {
	fs.readFile("./src/cogs/feedback/config.json", "utf-8", async (err, string) => {
		if (err) throw err;

		const data = JSON.parse(string);
		const role = interaction.options.getRole("role")
		data.mod = role.id;
		fs.writeFile("./src/cogs/feedback/config.json", JSON.stringify(data, null, 4), err => {
			if (err) throw err;
		})
		interaction.reply({
			content: `${role} has been selected for the moderator role`,
			ephemeral: true
		});

	})
}

function admin(interaction) {
	if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
		interaction.reply({
			content: "This command can only be used by an administrator",
			ephemeral: true
		})
		return (false);
	}
	return (true)
}