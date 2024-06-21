const { ThreadAutoArchiveDuration } = require("discord.js");
require("dotenv").config();
const mysql = require("mysql2");
const fs = require("fs");

const con = require("./../../database.js");

const defconfig = {
	"thread": {
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
			
			if (interaction.options.getSubcommand() === "init") {
				init(interaction);
			} else {
				config(interaction);
			}
		});
	}
}

function init(interaction) {
	con.query(`
		DROP DATABASE IF EXISTS fdb;
		CREATE DATABASE fdb;
		USE fdb;
		CREATE TABLE users (
			id VARCHAR(256) PRIMARY KEY,
			points INT
		);
		CREATE TABLE threads (
			num INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
			id VARCHAR(256),
			op VARCHAR(256)
		)
	`)
	
	fs.writeFile("./src/cogs/feedback/config.json", JSON.stringify(defconfig, null, 4), err => {
		if (err) console.log(err);
	})
	console.log("Database initialized");
	interaction.reply("Database initialized");
}

function config(interaction) {
	const group = interaction.options.getSubcommandGroup();
	const sub = interaction.options.getSubcommand();
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