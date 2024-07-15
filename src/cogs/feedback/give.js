const { PermissionsBitField } = require("discord.js");
require("dotenv").config();
const fs = require("fs");

const sql = require("./../../database.js");

func = {
	"give": give
}

module.exports = {
	load(client) {
		client.on("interactionCreate", (interaction) => {
			if (!interaction.isButton()) return;

			const parts = interaction.customId.split('-');
			func[parts[0]](interaction, client, parts[1]);
		});
	}
}

async function give(interaction, client, num) {
	await sql.promise().query(`
		INSERT IGNORE INTO users (id, points, is_banned)
		VALUES (${interaction.user.id}, 0, is_banned);
	`);

	if (await check(interaction, num)) return;

	sql.query(`
		INSERT IGNORE INTO contributions (user_id, thread_num)
		VALUES (${interaction.user.id}, ${num})
	`)

	const thread = await sql.promise().query(`SELECT * FROM threads WHERE num = ${num}`)

	const channel = await interaction.guild.channels.create({
		name: "feedback-temp",
		permissionOverwrites: [
			{
				id: interaction.guild.id,
				deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
			},
			{
				id: interaction.user.id,
				allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
			},
		],
	})
	channel.send(`This is your temporary feedback channel, you can type your feedback for ${thread[0][0].file}`);
	channel.send(`Type "feedback end" once you're done to submit your feedback`);
	interaction.reply({
		content: `Your feedback channel has been created: ${channel}`,
		ephemeral: true
	})
	let feedback = [];
	const coll = channel.createMessageCollector({
		filter: message => message.author === interaction.user,
		time: 600_000
	})

	coll.on("collect", message => {
		if (message.content === "feedback end")
			coll.stop();
		else
			feedback.push(message.content);
	})
	
	coll.on("end", () => {
		setTimeout(() => {
			channel.delete()
		}, 60_000)
		fs.readFile("./src/cogs/feedback/config.json", "utf-8", async (err, data) => {
			if (err) throw err;
			const config = JSON.parse(data);
			channel.send(`Your feedback has been saved and sent to the recipient and you have been awarded ${config.user.reward} points. This channel will be closed in one minute`);
			const forum = await client.channels.fetch(config.thread.channel);
			const post = await forum.threads.fetch(thread[0][0].id);
			await post.send(feedback.join("\n"));

			await sql.promise().query(`
				UPDATE users
				SET points = points + ${config.user.reward}
				WHERE id = ${interaction.user.id}
			`)
			sql.query(`
				INSERT INTO contributions (user_id, thread_num)
				VALUES (${interaction.user.id}, ${num})
			`)
		})
	})
}

function check(interaction, num) {
	return new Promise(async resolve => {
		sql.query(`SELECT * FROM users WHERE id = ${interaction.user.id}`, (err, result) => {
			if (err) throw err;
			if (result[0].is_banned === 1) {
				interaction.reply({
					content: "You are banned from the feedback system",
					ephemeral: true
				});
				return resolve(true);
			}
		})

		sql.query(`SELECT * FROM threads WHERE num = ${num}`, (err, result) => {
			if (err) throw err;
			if (result[0].op === interaction.user.id) {
				interaction.reply({
					content: "You cannot give yourself feedback",
					ephemeral: true
				});
				return resolve(true);
			}
		})
	
		sql.query(`
			SELECT * FROM contributions WHERE
			user_id = ${interaction.user.id}
			AND thread_num = ${num}
		`, (err, result) => {
			if (err) throw err;
			if (result.length !== 0) {
				interaction.reply({
					content: "You have already contributed to this thread",
					ephemeral: true
				});
				return resolve(true);
			}
			return resolve(false);
		});
	})
}