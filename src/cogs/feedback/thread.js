const { ThreadAutoArchiveDuration } = require("discord.js");
require("dotenv").config();

const con = require("./../../database.js");

const func = {
	"upload": upload,
	"archive": archive
}

module.exports = {
	load(client) {
		client.on("interactionCreate", (interaction) => {
			if (!interaction.isChatInputCommand()) return;

			if (interaction.commandName in func) {
				func[interaction.commandName](interaction, client);
			}
		});
	}
}

async function upload(interaction, client) {
	con.query("USE fdb", async (err) => {
		if (err) {
			console.log(err.message);
			interaction.reply(`Database uninitialized!`);
			return;
		} else {
			con.query(`INSERT IGNORE INTO users (id, points) VALUES (${interaction.user.id}, 0)`);
		
			const forum = await client.channels.fetch(process.env.FORUM_ID);
			const file = interaction.options.getAttachment("file");
			const thread = await forum.threads.create(
				{
					name: "test",
					message: { content: file.url },
					autoArchiveDuration: ThreadAutoArchiveDuration.OneHour
				}
			);
			con.query(`INSERT IGNORE INTO threads (id, op) VALUES (${thread.id}, ${interaction.user.id})`);
		
			interaction.reply(`Thread created: ${thread.url} - OP: <@${interaction.user.id}>`);

		}
	})
}

async function archive(interaction, client) {
	const num = interaction.options.getInteger("num")

	con.query(`SELECT * FROM threads WHERE num = ${num}`, async (err, result) => {
		if (err) throw err;
		const forum = await client.channels.fetch(process.env.FORUM_ID);
		if (result) {
			const thread = await forum.threads.fetch(result[0].id);
			const archived = await forum.threads.fetchArchived()
			if (thread) {
				if (thread === await archived.threads.get(thread.id)) {
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
