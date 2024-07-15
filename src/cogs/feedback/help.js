const { PermissionsBitField } = require("discord.js");
require("dotenv").config();
const fs = require("fs");

const sql = require("./../../database.js");
const { title } = require("process");

const all = {
	title: "Command list",
	description: "List a list of the commands\nFor more information about a command group, use `/help {command}`",
	fields: [
		{
			name: "feedback",
			value: "`ask`, `give`"
		},
		{
			name: "config",
			value: "`init`\n`thread channel`, `thread inactivity`, `thread age`\n`user cooldown`, `user cost`, `user reward`, `user role`"
		},
		{
			name: "user",
			value: "`list`, `ban`, `pardon`\n`points set`, `points add`, `points remove`, `points count`"
		},
		{
			name: "thread",
			value: "`archive`, `close`"
		}
	]
}

const feedback = {
	title: "/feedback help",
	description: "Usage: `/feedback {ask | give} {args...}`",
	fields: [
		{
			name: "ask",
			value:
				"Use this command to submit a feedback request\n\n\
				Usage: `/feedback ask {file} {anonymous} {message}`\n\n\
				`file` (*required*): Upload the file you want to get feedback on\n \
				`anonymous` (*optional*) (*false by default*): Make your feedback request anonymous\n \
				`message` (*optional*): Write a short message for your feedback request post",
		},
		{
			name: "give",
			value:
			"Use this command to give feedback on a feedback request post\n\n\
			Usage: `/feedback ask {post} {anonymous}`\n\n\
			`post` (*required*): Number of the post you want to give feedback on\n \
			`anonymous` (*optional*) (*false by default*): Make your feedback contribution anonymous\n\n\
			Note that the `give` command can also be triggered using the button found in every feedback post"
		}
	]
}

const config = {
	title: "/config help",
	description: "Usage: `/config {init | thread | user} {args...}`",
	fields: [
		{
			name: "init",
			value: "Resets the database and the server configuration\n\
			Usage: `/config init`"
		},
		{
			name: "thread",
			value:
				"Configure thread attributes\n\
				```fix\n/config thread channel {channel}```\
				```Configure channel to dedicate for feedback posts, {channel} must be a valid forum channel```\
				```fix\n/config thread inactivity {duration}```\
				```Configure thread post inactivity period, inactive posts are moved to the bottom of the channel```\
				```fix\n/config thread age {age}```\
				```Configure the period after which posts are closed```"
		},
		{
			name: "user",
			value:
				"Configure user attributes\n\
				```fix\n/config user cost {value}```\
				```Configure amount of points required to post a feedback request```\
				```fix\n/config user reward {value}```\
				```Configure amount of points awarded for giving feedback```\
				```fix\n/config user cooldown {value}```\
				```Configure duration that users have to wait between feedback request submissions```"
		}
	]
}

const user = {
	title: "/user help",
	description: "Usage: `/user {list | ban | pardon | points} {args...}`",
	fields: [
		{
			name: "list",
			value: "List all users currently registered in the feedback system\n\
			Usage: `/user list`"
		},
		{
			name: "ban",
			value: "Ban a user from the feedback system. Banned users cannot submit feedback requests or give feedback on posts\n\
			Usage: `/user ban {user}`"
		},
		{
			name: "pardon",
			value: "Unban a user from the feedback system.\n\
			Usage: `/user ban {user}`"
		},
		{
			name: "points",
			value: "Edit users' points\n\
			```fix\n/user points count {user}```\
			```Show the amount of points a user has. If {user} is omitted, the command shows your own point count```\
			```fix\n/user points add {user} {value}```\
			```Add {value} amount of points to a user```\
			```fix\n/user points remove {user} {value}```\
			```Remove {value} amount of points from a user```\
			```fix\n/user points set {user} {value}```\
			```Set a user's points to {value}```"
		}
	]
}

const thread = {
	title: "/thread help",
	description: "Usage: `/thread {archive | close} {post}`",
	fields: [
		{
			name: "archive",
			value: "Archives a feedback post. Archived posts are moved to the bottom of the feedback channel\n\
			Usage: `/thread archive {post}`"
		},
		{
			name: "close",
			value: "Closes a feedback posts. Users cannot give feedback to closed posts\n\
			Usage: `/thread close {post}`\n\n\
			Note that admins can omit {post} on either command by typing it in the thread itself"
		}
	]
}

func = {
	"all": all,
	"feedback": feedback,
	"config": config,
	"user": user,
	"thread": thread
}

module.exports = {
	load(client) {
		client.on("interactionCreate", (interaction) => {
			if (!interaction.isChatInputCommand() || interaction.commandName !== "help") return;

			const option = interaction.options.getString("topic");
			if (!option)
				interaction.reply({ embeds: [all], ephemeral: true });
			if (option in func)
				interaction.reply({ embeds: [func[option]], ephemeral: true });
		});
	}
}
