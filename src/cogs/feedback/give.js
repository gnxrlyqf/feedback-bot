const { PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
require("dotenv").config();
const fs = require("fs");

const sql = require("./../../database.js");

module.exports = {
	load(client) {
		client.on("interactionCreate", (interaction) => {
			if (!interaction.isButton()) return;
			const parts = interaction.customId.split('-');
			if (parts[0] !== "give") return;
			give(interaction, client, parts[1], parts[2]);
		});
	}
}

async function give(interaction, client, num, anon) {
	await sql.promise().query(`
		INSERT IGNORE INTO users (id, points, is_banned)
		VALUES (${interaction.user.id}, 0, 0);
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
	interaction.reply({
		content: `Your feedback channel has been created: ${channel}`,
		ephemeral: true
	})
	channel.send({
		content: `Press the button below to submit your feedback.`,
		components: [
			new ActionRowBuilder().addComponents(
				new ButtonBuilder()
				.setCustomId(`end-${num}`)
				.setLabel("End feedback")
				.setStyle(ButtonStyle.Success),
			)
		]
	})
	let feedback = [];
	const coll = channel.createMessageCollector({
		filter: message => message.author === interaction.user,
		time: 600_000
	})
	
	client.on("interactionCreate", (click) => {
		if (!click.isButton()) return;
		const parts = click.customId.split('-');
		if (parts[0] === "end" && parts[1] === num) {
			coll.stop();
			click.deferUpdate();
		}
	});

	coll.on("collect", message => {
		feedback.push(message.content);
	})
	
	coll.on("end", () => {
		setTimeout(() => {
			channel.delete()
		}, 60_000)

		if (!feedback.length) {
			channel.send(`You have cancelled this feedback, this channel will be closed in one minute.`);
			return;
		}
		
		fs.readFile("./src/cogs/feedback/config.json", "utf-8", async (err, data) => {
			if (err) throw err;
			const config = JSON.parse(data);
			channel.send(`Your feedback has been saved and sent to the recipient and you have been awarded ${config.user.reward} points. This channel will be closed in one minute`);
			const forum = await client.channels.fetch(config.thread.channel);
			const post = await forum.threads.fetch(thread[0][0].id);

			const name = anon ? "Anonymous user" : interaction.user.globalName;
			const message = {
				title: name + " writes:",
				description: feedback.join('\n')
			}
			await post.send({ embeds: [message] });

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
		let result = await sql.promise().query(`SELECT * FROM users WHERE id = ${interaction.user.id}`);
		if (result[0][0].is_banned === 1) {
			interaction.reply({
				content: "You are banned from the feedback system.",
				ephemeral: true
			});
			return resolve(true);
		}

		result = await sql.promise().query(`SELECT * FROM threads WHERE num = ${num}`);
		if (result[0][0].op === interaction.user.id) {
			await interaction.reply({
				content: "You cannot give yourself feedback.",
				ephemeral: true
			});
			return resolve(true);
		}
	
		result = await sql.promise().query(`
			SELECT * FROM contributions WHERE
			user_id = ${interaction.user.id}
			AND thread_num = ${num}
		`);
		if (result[0].length !== 0) {
			interaction.reply({
				content: "You have already contributed to this thread.",
				ephemeral: true
			});
			return resolve(true);
		}
		return resolve(false);
	})
}