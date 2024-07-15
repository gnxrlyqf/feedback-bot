require("dotenv").config();
const {REST, Routes, ApplicationCommandOptionType, ThreadAutoArchiveDuration} = require("discord.js");
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
const fs = require("fs");
const commands = [
	{
		name: "feedback",
		description: "Submit a feedback request post",
		options: [
			{
				name: "ask",
				description: "Ask for feedback",
				type: ApplicationCommandOptionType.Subcommand,
				options: [
					{
						name: "file",
						description: "file to ask for feedback on",
						type: ApplicationCommandOptionType.Attachment,
						required: true
					},
					{
						name: "anonymous",
						description: "Submit request anonymously (False	 by default)",
						type: ApplicationCommandOptionType.Boolean
					},
					{
						name: "message",
						description: "Write a short message in your post",
						type: ApplicationCommandOptionType.String
					}
				]
			},
			{
				name: "give",
				description: "Give feedback",
				type: ApplicationCommandOptionType.Subcommand,
				options: [
					{
						name: "post",
						description: "Number of the forum post, you don't need to specify this if you run the command in the forum post",
						type: ApplicationCommandOptionType.Integer
					},
					{
						name: "anonymous",
						description: "Give feedback anonymously (False by default)",
						type: ApplicationCommandOptionType.Boolean
					}
				]
			}
		]
	},
	{
		name: "config",
		description: "Configure bot",
		options: [
			{
				name: "init",
				description: "Reset user and thread attributes",
				type: ApplicationCommandOptionType.Subcommand
			},
			{
				name: "thread",
				description: "Configure thread attributes",
				type: ApplicationCommandOptionType.SubcommandGroup,
				options: [
					{
						name: "channel",
						description: "Configure forum channel for feedback posts",
						type: ApplicationCommandOptionType.Subcommand,
						options: [
							{
								name: "channel",
								description: "choose channel",
								type: ApplicationCommandOptionType.Channel,
								required: true
							}
						]
					},
					{
						name: "inactivity",
						description: "Inactivity period of posts, inactive posts are moved to the bottom of the forum channel",
						type: ApplicationCommandOptionType.Subcommand,
						options: [
							{
								name: "value",
								description: "Value to assign to thread inactivity period",
								type: ApplicationCommandOptionType.Integer,
								choices: [
									{
										name: "One hour",
										value: ThreadAutoArchiveDuration.OneHour
									},
									{
										name: "One day",
										value: ThreadAutoArchiveDuration.OneDay
									},
									{
										name: "Three days",
										value: ThreadAutoArchiveDuration.ThreeDays
									},
									{
										name: "One week",
										value: ThreadAutoArchiveDuration.OneWeek
									}
								],
								required: true
							}
						]
					},
					{
						name: "age",
						description: "How long after inactivity period before posts are closed.",
						type: ApplicationCommandOptionType.Subcommand,
						options: [
							{
								name: "value",
								description: "value to assign to post age",
								type: ApplicationCommandOptionType.Integer,
								required: true
							}
						]
					}
				]
			},
			{
				name: "user",
				description: "Configure user attributes",
				type: ApplicationCommandOptionType.SubcommandGroup,
				options: [
					{
						name: "role",
						description: "Configure user role",
						type: ApplicationCommandOptionType.Subcommand,
						options: [
							{
								name: "role",
								description: "Role to select",
								type: ApplicationCommandOptionType.Role,
								required: true
							}
						]
					},
					{
						name: "cooldown",
						description: "How long users have to wait between feedback request submissions.",
						type: ApplicationCommandOptionType.Subcommand,
						options: [
							{
								name: "value",
								description: "Value to assign to user cooldown.",
								type: ApplicationCommandOptionType.Integer,
								required: true
							}
						]
					},
					{
						name: "cost",
						description: "Amount of points required to post a feedback request",
						type: ApplicationCommandOptionType.Subcommand,
						options: [
							{
								name: "value",
								description: "Value to assign to feedback cost",
								type: ApplicationCommandOptionType.Integer,
								required: true
							}
						]
					},
					{
						name: "reward",
						description: "Amount of points awarded for giving feedback",
						type: ApplicationCommandOptionType.Subcommand,
						options: [
							{
								name: "value",
								description: "Value to assign to feedback reward",
								type: ApplicationCommandOptionType.Integer,
								required: true
							}
						]
					}		
				]
			}
		]
	},
	{
		name: "thread",
		description: "Set thread attributes",
		options: [
			{
				name: "archive",
				description: "Archives a feedback post, archived threads are moved to the bottom of the forum channel",
				type: ApplicationCommandOptionType.Subcommand,
				options: [
					{
						name: "num",
						description: "number of the post to be archived",
						type: ApplicationCommandOptionType.Integer,
						required: true
					}
				]
			},
			{
				name: "close",
				description: "Closes a feedback post. Users cannot give feedback in closed posts. Closed posts are also archived",
				type: ApplicationCommandOptionType.Subcommand,
				options: [
					{
						name: "num",
						description: "number of the post to be closed",
						type: ApplicationCommandOptionType.Integer,
						required: true
					}
				]
			}
		]
	},
	{
		name: "user",
		description: "Set user attributes",
		options: [
			{
				name: "points",
				description: "Change a user's point count",
				type: ApplicationCommandOptionType.SubcommandGroup,
				options: [
					{
						name: "set",
						description: "Set user's points",
						type: ApplicationCommandOptionType.Subcommand,
						options: [
							{
								name: "user",
								description: "User whose points to change",
								type: ApplicationCommandOptionType.User,
								required: true
							},
							{
								name: "value",
								description: "Amount to set user points",
								type: ApplicationCommandOptionType.Integer,
								required: true
							}
						]
					},
					{
						name: "add",
						description: "Add points to a user",
						type: ApplicationCommandOptionType.Subcommand,
						options: [
							{
								name: "user",
								description: "User whose points to change",
								type: ApplicationCommandOptionType.User,
								required: true
							},
							{
								name: "value",
								description: "Amount to add to a user",
								type: ApplicationCommandOptionType.Integer,
								required: true
							}
						]
					},
					{
						name: "remove",
						description: "Remove points from a user",
						type: ApplicationCommandOptionType.Subcommand,
						options: [
							{
								name: "user",
								description: "User whose points to change",
								type: ApplicationCommandOptionType.User,
								required: true
							},
							{
								name: "value",
								description: "Amount to remove from a user",
								type: ApplicationCommandOptionType.Integer,
								required: true
							}
						]
					},
					{
						name: "count",
						description: "shows a user's point count",
						type: ApplicationCommandOptionType.Subcommand,
						options: [
							{
								name: "user",
								description: "user whose points to show",
								type: ApplicationCommandOptionType.User
							}
						]
					},
				]
			},
			{
				name: "ban",
				description: "Bans a user from the feedback system. Banned users cannot ask for or give feedback",
				type: ApplicationCommandOptionType.Subcommand,
				options: [
					{
						name: "user",
						description: "user to ban",
						type: ApplicationCommandOptionType.User,
						required: true
					}
				]
			},
			{
				name: "pardon",
				description: "Unbans a user from the feedback system",
				type: ApplicationCommandOptionType.Subcommand,
				options: [
					{
						name: "user",
						description: "user to unban",
						type: ApplicationCommandOptionType.User,
						required: true
					}
				]
			},
			{
				name: "list",
				description: "Show users registered into the feedback system",
				type: ApplicationCommandOptionType.SubcommandGroup,
				options: [
					{
						name: "all",
						description: "Lists all users",
						type: ApplicationCommandOptionType.Subcommand
					},
					{
						name: "banned",
						description: "Lists banned users",
						type: ApplicationCommandOptionType.Subcommand
					}
				]
			}
		]
	},
	{
		name: "help",
		description: "get help about the feedback bot commands",
		options: [
			{
				name: "topic",
				description: "Topic you want to get help on",
				type: ApplicationCommandOptionType.String,
				choices: [
					{
						name: "feedback",
						value: "feedback"
					},
					{
						name: "config",
						value: "config"
					},
					{
						name: "user",
						value: "user"
					},
					{
						name: "thread",
						value: "thread"
					}
				]
			}
		]
	}
];

(async () => {
	try {
		console.log("Registering commands...");

		await rest.put(
			Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
			{ body: commands }
		);

		console.log("Commands have been registered.");
	} catch (error) {
		console.log(`An error has occurred: ${error}`)
	}
})();