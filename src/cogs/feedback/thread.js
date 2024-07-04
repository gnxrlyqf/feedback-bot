const { Guild } = require("discord.js");
require("dotenv").config();
const fs = require("fs");

const sql = require("./../../database.js");

const func = {
	"ask": ask,
	"archive": archive,
	"close": close,
	"give": give
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
			VALUES (${thread.id}, ${interaction.user.id}, ${file})
		`);
		sql.query(`SELECT * FROM threads WHERE id = ${thread.id}`, (err, result) => {
			if (err) throw err;
			thread.setName(`Feedback request #${result[0].num}`.concat(anon ? "" : ` - ${interaction.user.globalName}`));
		})
	
		interaction.reply({content: `Thread created: ${thread.url}`, ephemeral: true});
	})
}

async function give(interaction, client) {
	const channel = await interaction.guild.channels.create({
		name: "feedback-temp"
	})

	let feedback = [];
	const coll = channel.createMessageCollector({
		filter: message => message.author === interaction.user,
		time: 20_000
	})

	coll.on("collect", message => {
		feedback.push(message.content);
		console.log(message.content)
	})

	coll.on("end", () => {
		channel.send("Your feedback has been saved and sent to the recipient");
	})

	setTimeout(() => {
		channel.delete()
	}, 25_000)
}

function archive(interaction, client) {
	if (!admin(interaction)) return;

	const num = interaction.options.getInteger("num")

	fs.readFile("./src/cogs/feedback/config.json", "utf-8", async (err, data) => {
		if (err) throw err;
		const config = JSON.parse(data);
		const channel = config.thread.channel;

		sql.query(`SELECT * FROM threads WHERE num = ${num}`, async (err, result) => {
			if (err) throw err;
			const forum = await client.channels.fetch(channel);
			if (result.length === 0) {
				interaction.reply({content: "Thread not found", ephemeral: true});
				return;
			}
			const thread = await forum.threads.fetch(result[0].id);
			if (!thread.archived) {
				await thread.setArchived(true);
				interaction.reply({content: "Thread archived", ephemeral: true});
				return;
			}
			interaction.reply({content: "Thread already archived", ephemeral: true})
		})
	})
}

function close(interaction, client) {
	if (!admin(interaction)) return;

	const num = interaction.options.getInteger("num");

	fs.readFile("./src/cogs/feedback/config.json", "utf-8", async (err, data) => {
		if (err) throw err;
		const config = JSON.parse(data);
		const channel = config.thread.channel;

		sql.query(`SELECT * FROM threads WHERE num = ${num}`, async (err, result) => {
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