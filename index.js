// index.js
const { prefix, token } = require('./config.json');
// ... client setup (keep reading)

const Discord = require('discord.js');
const Sequelize = require('sequelize');

const client = new Discord.Client();
const PREFIX = '~Wildernest';

/*
 * Make sure you are on at least version 5 of Sequelize! Version 4 as used in this guide will pose a security threat.
 * You can read more about this issue On the [Sequelize issue tracker](https://github.com/sequelize/sequelize/issues/7310).
 */

const sequelize = new Sequelize(DATABASE_URL, 'username', 'password', {
	host: 'localhost',
	dialect: 'postgres',
	logging: false,
});

const Users = sequelize.define('users', {
	username: {
		type: Sequelize.STRING,
		allowNull: false,
		unique: true,
	},
	email: {
		type: Sequelize.STRING,
		unique: true,
	},
	discordID: {
		type: Sequelize.STRING,
		unique: true,
	},
	twitterHandle: {
		type: Sequelize.STRING,
		unique: true,
	},
	totalPets: {
		type: Sequelize.INTEGER,
		defaultValue: 0,
		unique: true,
	},
	allowedPets: {
		type: Sequelize.INTEGER,
		defaultValue: 5,
		unique: true,
	}
});

const Pets = sequelize.define('pets', {
	petname: {
		type: Sequelize.STRING,
		allowNull: false,
		unique: true,
	},
	owner: {
		type: Sequelize.STRING,
		allowNull: false,
		unique: true,
	},
	species: {
		type: Sequelize.STRING,
		unique: true,
	},
	color: {
		type: Sequelize.STRING,
		unique: true,
	}
});

client.once('ready', () => {
	Users.sync();
	Pets.sync();
	console.log('hewwo')
});

client.on('message', async message => {
	if (message.content.startsWith(PREFIX)) {
		const input = message.content.slice(PREFIX.length).trim().split(' ');
		const command = input.shift();
		const commandArgs = input.join(' ');

		if (command === 'I\'m') {
			const commanderName = commandArgs;
			const verifyDiscordID = message.author.id;

			try {
				// equivalent to: INSERT INTO tags (name, descrption, username) values (?, ?, ?);
				const tag = await Users.create({
					username: commanderName,
					discordID: verifyDiscordID,
				});
				return message.reply(`Thanks, ${commanderName}! I just added you to my database along with your current Discord ID: ${verifyDiscordID}`);
			} catch (e) {
				console.log(e);
				if (e.name === 'SequelizeUniqueConstraintError') {
					//is the username the problem?
					const existingUser = await Users.findOne({ where: { username: commanderName }, attributes: ['id', 'username', 'discordID'] });
					if (!existingUser) {
						//if the user doesn't exist, is the ID the problem?
						const existingUser = await Users.findOne({ where: { discordID: verifyDiscordID }, attributes: ['id', 'username', 'discordID'] });
					}
					console.log(existingUser);
					//if there's a name but no ID, just add the ID in
					if (!existingUser.discordID) {
						existingUser.discordID = verifyDiscordID;
						await existingUser.save();
						return message.reply(`Thanks, ${commanderName}! Your Discord ID has been added as ${verifyDiscordID}.`);
					}
					else if (!existingUser.username) {
						existingUser.username = commanderName;
						await existingUser.save();
						return message.reply(`Thanks, ${commanderName}! Your Discord ID has been added as ${verifyDiscordID}.`);
					}
					//the user is just already in the system
					else if (existingUser.discordID === verifyDiscordID && existingUser.username === commanderName) {
						return message.reply(`Hi ${commanderName}. You're already in my system, with the correct ID of ${verifyDiscordID}. Thanks for checking.`);
					}
					else if (existingUser.discordID != verifyDiscordID || existingUser.username != commanderName) {
						//there isn't a match for this username
						return message.reply(`Sorry - I already know a ${commanderName} and their Discord ID is ${existingUser.discordID}, yours is ${verifyDiscordID}!`);
					}

				}
			}
		} else if (command === 'pets') {
				const verifyDiscordID = message.author.id;
				const thisUser = await Users.findOne({ where: { discordID: verifyDiscordID }, attributes: ['id', 'username', 'totalPets', 'allowedPets']  });
				const yourPets = parseInt(thisUser.totalPets);
				const yourMax = parseInt(thisUser.allowedPets);
				console.log(thisUser);
				if (!thisUser) {
					return message.reply(`Wow, I totally don't have you in my system. Can you please try **~Wildernest I'm USERNAME**, where USERNAME is the name you want, before checking for pets?`);
				}
				else if (yourPets === 0) {
					return message.reply(`Hey ${thisUser.username}. You don't have any pets at all.`);
				}
				else if (yourPets >= yourMax) {
					return message.reply(`Hey ${thisUser.username}. You have ${yourPets} pets, which is more than your allowed maximum of ${yourMax}. That could be a problem.`);
				}
				else {
					return message.reply(`Hey ${thisUser.username}. You have ${yourPets} pets. When I'm a little smarter I'll show them to you here.`);
				}

			}
		}
	}
});

client.login(token);
