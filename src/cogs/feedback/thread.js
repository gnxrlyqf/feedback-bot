const { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require("discord.js");
require("dotenv").config();
const fs = require("fs");

const sql = require("./../../database.js");

const options = ["feedback", "thread"];

const func = {
	"ask": ask,
	"archive": archive,
	"close": close,
}

module.exports = {
	load(client) {
		client.on("interactionCreate", (interaction) => {
			if (!interaction.isChatInputCommand() || !options.includes(interaction.commandName)) return;

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
		VALUES (${interaction.user.id}, 0, 0);
	`);
	
	if (await check(interaction)) return;

	fs.readFile("./src/cogs/feedback/config.json", "utf-8", async (err, string) => {
		if (err) throw err;
		const config = JSON.parse(string);
		let forum;

		try {
			forum = await client.channels.fetch(config.thread.channel);
		} catch (error) {
			interaction.reply({
				content: `Feedback forum channel not configured`,
				ephemeral: true
			})
			return;
		}
		const file = interaction.options.getAttachment("file");
		const anon = interaction.options.getBoolean("anonymous");
	
		const thread = await forum.threads.create({
			name: "Feedback request",
			message: { content: file.url },
		});
		thread.setAutoArchiveDuration(config.thread.inactivity);
		await sql.promise().query(`
			UPDATE users
			SET points = points - ${config.user.cost}
			WHERE id = ${interaction.user.id}
		`)
		await sql.promise().query(`
			INSERT IGNORE INTO threads (id, op, file)
			VALUES (${thread.id}, ${interaction.user.id}, "${file.url}");
		`);
		sql.query(`SELECT * FROM threads WHERE id = ${thread.id}`, async (err, result) => {
			if (err) throw err;
			sql.query(`
				INSERT IGNORE INTO contributions (user_id, thread_num)
				VALUES (${interaction.user.id}, ${result[0].num})
			`)

			await thread.setName(`Feedback request #${result[0].num}`.concat(anon ? "" : ` - ${interaction.user.globalName}`));
			thread.send({
				content: "Press the button below to give feedback",
				components: [
					new ActionRowBuilder().addComponents(
						new ButtonBuilder()
						.setCustomId(`give-${result[0].num}`)
						.setLabel("Give feedback")
						.setStyle(ButtonStyle.Success),
						new ButtonBuilder()
						.setCustomId(`give-${result[0].num}-anon`)
						.setLabel("Give feedback anonymously")
						.setStyle(ButtonStyle.Success)
					)
				]
			})
		})
	
		interaction.reply({content: `Thread created: ${thread.url}`, ephemeral: true});
	})
}

async function archive(interaction, client) {
	if (!await mod(interaction)) return;

	const num = interaction.options.getInteger("num")

	fs.readFile("./src/cogs/feedback/config.json", "utf-8", async (err, data) => {
		if (err) throw err;
		const config = JSON.parse(data);
		const channel = config.thread.channel;
		const forum = await client.channels.fetch(channel);

		sql.query(`SELECT * FROM threads WHERE num = ${num} OR id = ${interaction.channel.id}`, async (err, result) => {
			if (err) throw err;
			if (result.length === 0) {
				interaction.reply({content: "Thread not found", ephemeral: true});
				return;
			}
			const thread = await forum.threads.fetch(result[0].id);
			if (!thread.archived) {
				await interaction.reply({content: "Thread archived", ephemeral: true});
				thread.setArchived(true);
				return;
			}
			interaction.reply({content: "Thread already archived", ephemeral: true})
		})
	})
}

async function close(interaction, client) {
	if (!await mod(interaction)) return;

	const num = interaction.options.getInteger("num");

	fs.readFile("./src/cogs/feedback/config.json", "utf-8", async (err, data) => {
		if (err) throw err;
		const config = JSON.parse(data);
		const channel = config.thread.channel;

		sql.query(`SELECT * FROM threads WHERE num = ${num} OR id = ${interaction.channel.id}`, async (err, result) => {
			if (err) throw err;
			const forum = await client.channels.fetch(channel);
			if (result.length === 0) {
				interaction.reply({content: "Thread not found", ephemeral: true});
				return;
			}
			const thread = await forum.threads.fetch(result[0].id);
			if (thread.archived) thread.setArchived(false)
			if (!thread.closed) {
				thread.setLocked(true)
				thread.setArchived(true);
				interaction.reply({content: "Thread closed", ephemeral: true});
				return;
			}
			interaction.reply({content: "Thread already closed", ephemeral: true})
		})
	})
}

function check(interaction) {
	return new Promise((resolve) => {
		sql.query(`SELECT * FROM users WHERE id = ${interaction.user.id}`, (err, result) => {
			if (err) throw err;
	
			if (result[0].is_banned === 1) {
				interaction.reply({
					content: "You are banned from submitting feedback requests",
					ephemeral: true
				});
				return resolve(true);
			}
	
			fs.readFile("./src/cogs/feedback/config.json", "utf-8", (err, data) => {
				if (err) throw err;
				const config = JSON.parse(data);
				if (result[0].points < config.user.cost) {
					interaction.reply({
						content: "You do not have enough points to submit a feedback request",
						ephemeral: true
					})
					return resolve(true);
				}
				return resolve(false);
			})
		})
	})
}

function mod(interaction) {
	return new Promise((resolve) => {
		fs.readFile("./src/cogs/feedback/config.json", "utf-8", (err, data) => {
			if (err) throw err;
			const config = JSON.parse(data);
			if (!interaction.member.roles.cache.has(config.mod) && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
				interaction.reply({
					content: "This command can only be used by a moderator or an administrator",
					ephemeral: true
				})
				return resolve(false);
			}
			return resolve(true);
		})
	})
}