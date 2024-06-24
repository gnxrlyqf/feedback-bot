const {} = require("discord.js");
require("dotenv").config();
const fs = require("fs");

const sql = require("./../../database.js");

const func = {
	"ask": ask,
	"archive": archive,
	"close": close
}

module.exports = {
	load(client) {
		client.on("interactionCreate", (interaction) => {
			if (!interaction.isChatInputCommand()) return;

			const sub = interaction.options.getSubcommand();
			if (sub in func) {
				func[sub](interaction, client);
			}
		});
	}
}

async function ask(interaction, client) {
	await sql.promise().query(`
		INSERT IGNORE INTO users (id, points, is_banned)
		VALUES (${interaction.user.id}, 0, is_banned)
	`);
	
	if (await check(interaction)) return;

	fs.readFile("./src/cogs/feedback/config.json", "utf-8", async (err, string) => {
		if (err) throw err;
		const config = JSON.parse(string);

		const forum = await client.channels.fetch(config.thread.channel);
		const file = interaction.options.getAttachment("file");
	
		const thread = await forum.threads.create(
			{
				name: "Feedback request",
				message: { content: file.url },
			}
		);
		thread.setAutoArchiveDuration(config.thread.inactivity);
		await sql.promise().query(`
			UPDATE users
			SET points = points - ${config.user.cost}
			WHERE id = ${interaction.user.id}
		`)
		await sql.promise().query(`INSERT IGNORE INTO threads (id, op) VALUES (${thread.id}, ${interaction.user.id})`);
		sql.query(`SELECT * FROM threads WHERE id = ${thread.id}`, (err, result) => {
			if (err) throw err;
			thread.setName(`Feedback request #${result[0].num}`);
		})
	
		interaction.reply({content: `Thread created: ${thread.url}`, ephemeral: true});
	})
}

function archive(interaction, client) {
	const num = interaction.options.getInteger("num")

	sql.query(`SELECT * FROM threads WHERE num = ${num}`, async (err, result) => {
		if (err) throw err;
		const forum = await client.channels.fetch(process.env.FORUM_ID);
		if (result) {
			const thread = await forum.threads.fetch(result[0].id);
			if (thread) {
				if (thread.archived) {
					interaction.reply("Thread already archived")
				} else {
					await thread.setArchived(true);
					interaction.reply("Thread archived");
				}
			}
		} else {
			interaction.reply("Thread not found");
		}
	})
}

function close(interaction, client) {
	const num = interaction.options.getInteger("num");

	sql.query(`SELECT * FROM threads WHERE num = ${num}`, async (err, result) => {
		if (err) throw err;
		const forum = await client.channels.fetch(process.env.FORUM_ID);
		if (result) {
			const thread = await forum.threads.fetch(result[0].id);
			if (thread) {
				if (thread.archived) thread.setArchived(false)
				if (thread.locked) {
					interaction.reply("Thread already closed")
				} else {
					thread.setLocked(true)
					thread.setArchived(true);
					interaction.reply("Thread closed");
				}
			}
		} else {
			interaction.reply("Thread not found");
		}
	})

}

function check(interaction) {
	return new Promise((resolve) => {
		sql.query(`SELECT * FROM users WHERE id = ${interaction.user.id}`, (err, result) => {
			if (err) throw err;
	
			if (result[0].is_banned === 1) {
				interaction.reply("You are been banned from submitting feedback requests");
				return resolve(true);
			}
	
			fs.readFile("./src/cogs/feedback/config.json", "utf-8", (err, data) => {
				if (err) throw err;
				const config = JSON.parse(data);
				if (result[0].points < config.user.cost) {
					interaction.reply("You do not have enough points to submit a feedback request")
					return resolve(true);
				}
				return resolve(false);
			})
		})
	})
}