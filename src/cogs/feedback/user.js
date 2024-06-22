const {} = require("discord.js");
require("dotenv").config();
const fs = require("fs");

const sql = require("./../../database.js");

const func = {
	"points": {
		"set": set,
		"add": add,
		"remove": remove,
		"count": count
	}
}

module.exports = {
	load(client) {
		client.on("interactionCreate", (interaction) => {
			if (!interaction.isChatInputCommand()) return;

			const sub = interaction.options.getSubcommand();
			if (sub in func.points) {
				func["points"][sub](interaction);
			}
		})
	}
}

async function set(interaction) {
	await sql.promise().query(`INSERT IGNORE INTO users (id) VALUES (${interaction.user.id})`);

	const user = interaction.options.getUser("user");
	const value = interaction.options.getInteger("value");

	sql.query(`UPDATE users SET points = ${value} WHERE id = ${user.id}`);

	interaction.reply(`**${user.globalName}**'s points have been set to **${value}**`);
}

async function add(interaction) {
	await sql.promise().query(`INSERT IGNORE INTO users (id) VALUES (${interaction.user.id})`);

	const user = interaction.options.getUser("user");
	const value = interaction.options.getInteger("value");

	await sql.promise().query(`UPDATE users SET points = points + ${value} WHERE id = ${user.id}`);
	sql.query(`SELECT * FROM users WHERE id = ${user.id}`, (err, result) => {
		if (err) throw err;
		interaction.reply(`**${user.globalName}**'s points have been set to **${result[0].points}**`)
	});
}

async function remove(interaction) {
	await sql.promise().query(`INSERT IGNORE INTO users (id) VALUES (${interaction.user.id})`);

	const user = interaction.options.getUser("user");
	const value = interaction.options.getInteger("value");

	await sql.promise().query(`
		UPDATE users
		SET points = CASE
			WHEN points - ${value} < 0 THEN 0
			ELSE points - ${value}
		END
		WHERE id = ${user.id};
	`)

	sql.query(`SELECT * FROM users WHERE id = ${user.id}`, (err, result) => {
		if (err) throw err;
		interaction.reply(`**${user.globalName}**'s points have been set to **${result[0].points}**`)
	});
}

async function count(interaction) {
	let user = interaction.options.getUser("user");
	user = user || interaction.user;

	sql.query(`SELECT * FROM users WHERE id = ${user.id}`, (err, result) => {
		if (err) throw err;
		interaction.reply(`**${user.globalName}** has **${result[0].points}** points`)
	});
}