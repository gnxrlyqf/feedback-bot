const { PermissionsBitField } = require("discord.js");
require("dotenv").config();
const fs = require("fs");

const sql = require("./../../database.js");

const func = {
	"set": set,
	"add": add,
	"remove": remove,
	"ban": ban,
	"pardon": pardon
}

module.exports = {
	load(client) {
		client.on("interactionCreate", (interaction) => {
			if (!interaction.isChatInputCommand() || interaction.commandName !== "user") return;

			const sub = interaction.options.getSubcommand();
			if (sub === "count") {
				count(interaction)
			} else if (sub in func) {
				if (!admin(interaction)) return;
				func[sub](interaction);
			}
		})
	}
}

async function set(interaction) {
	const user = interaction.options.getUser("user");
	await sql.promise().query(`
		INSERT IGNORE INTO users (id, points, is_banned)
		VALUES (${user.id}, 0, 0)
	`);
	const value = interaction.options.getInteger("value");

	sql.query(`UPDATE users SET points = ${value} WHERE id = ${user.id}`);

	interaction.reply({
		content: `**${user.globalName}**'s points have been set to **${value}**`,
		ephemeral: true
	});
}

async function add(interaction) {
	await sql.promise().query(`
		INSERT IGNORE INTO users (id, points, is_banned)
		VALUES (${interaction.user.id}, 0, 0)
	`);

	const user = interaction.options.getUser("user");
	const value = interaction.options.getInteger("value");

	await sql.promise().query(`UPDATE users SET points = points + ${value} WHERE id = ${user.id}`);
	sql.query(`SELECT * FROM users WHERE id = ${user.id}`, (err, result) => {
		if (err) throw err;
		interaction.reply({
			content: `**${user.globalName}**'s points have been set to **${result[0].points}**`,
			ephemeral: true
		})
	});
}

async function remove(interaction) {
	const user = interaction.options.getUser("user");
	await sql.promise().query(`
		INSERT IGNORE INTO users (id, points, is_banned)
		VALUES (${user.id}, 0, 0)
	`);
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
		interaction.reply({
			content: `**${user.globalName}**'s points have been set to **${result[0].points}**`,
			ephemeral: true
		})
	});
}

async function count(interaction) {
	let user = interaction.options.getUser("user");
	user = user || interaction.user;
	await sql.promise().query(`
		INSERT IGNORE INTO users (id, points, is_banned)
		VALUES (${user.id}, 0, 0)`);

	sql.query(`SELECT * FROM users WHERE id = ${user.id}`, (err, result) => {
		if (err) throw err;
		interaction.reply(`**${user.globalName}** has **${result[0].points}** points`)
	})
}

async function ban(interaction) {
	const user = interaction.options.getUser("user");
	await sql.promise().query(`
		INSERT IGNORE INTO users (id, points, is_banned)
		VALUES (${user.id}, 0, 0)
	`);

	sql.query(`SELECT * FROM users WHERE id = ${user.id}`, async (err, result) => {
		if (err) throw err;
		if (result[0].is_banned === 1) {
			interaction.reply({
				content: `**${user.globalName}** is already banned from the feedback system`,
				ephemeral: true
			})
		} else {
			await sql.promise().query(`UPDATE users SET is_banned = 1 WHERE id = ${user.id}`)
			interaction.reply({
				content: `**${user.globalName}** has been banned from the feedback system`,
				ephemeral: true
			})
		}
	});
}

async function pardon(interaction) {
	const user = interaction.options.getUser("user");
	await sql.promise().query(`
		INSERT IGNORE INTO users (id, points, is_banned)
		VALUES (${user.id}, 0, 0)
	`);

	sql.query(`SELECT * FROM users WHERE id = ${user.id}`, async (err, result) => {
		if (err) throw err;
		if (result[0].is_banned === 0) {
			interaction.reply({
				content: `**${user.globalName}** is not banned from the feedback system`,
				ephemeral: true
			})
		} else {
			await sql.promise().query(`UPDATE users SET is_banned = 0 WHERE id = ${user.id}`)
			interaction.reply({
				content: `**${user.globalName}** has been unbanned from the feedback system`,
				ephemeral: true
			})
		}
	});
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