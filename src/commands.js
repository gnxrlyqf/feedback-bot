require("dotenv").config();
const {REST, Routes, ApplicationCommandOptionType, ThreadAutoArchiveDuration} = require("discord.js");
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
const fs = require("fs");
const commands = [
	{
		name: "upload",
		description: "File upload test",
		options: [
			{
				name: "file",
				description: "file to be uploaded",
				type: ApplicationCommandOptionType.Attachment,
				required: true
			}
		]
	},
	{
		name: "archive",
		description: "Archives a forum thread",
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