// Discord.js bot
const Discord = require('discord.js');
const Sequelize = require('sequelize');
const config = require('./config/config.json');
const disclient = new Discord.Client();

const { Client } = require('pg');

const sql = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

sql.connect();

disclient.on('message', msg => {
    if (!msg.content.startsWith(process.env.PREFIX) || !msg.guild) return;
    const command = msg.content.split(' ')[0].substr(process.env.PREFIX.length);
    const args = msg.content.split(' ').slice(1).join(' ');
    if (command === 'I\'m') UserCreate(args, message.author.id);
    else if (command === 'Pets') UserCreate(message.author.id);
});

function UserCreate(commanderName, verifyDiscordID) {

	const checkUsers = sql`SELECT userid FROM users WHERE username = ${commanderName} OR discordid = ${verifyDiscordID}`;
	if (!checkUsers) {
		//There's no existing user ID for this name or discord account so let's make one.
		const newUser = [{
	  username: commanderName,
	  discordid: verifyDiscordID
		}]

		sql`
		  insert into users ${
		    sql(newUser, 'username', 'discordid')
		  }
		`
		return message.reply(`Thanks, ${commanderName}! I made you a new account, with user ID ${checkUsers} and Discord ID ${verifyDiscordID}.`);
	} else {
		console.log(checkUsers);
		//There is a user ID for this already, so let's do some more stuff.
		const matchDiscord = sql`SELECT discordid FROM users WHERE userid = checkUsers`
		//Let's check if the discord account matches.
		if (!matchDiscord) {
			//Well, there's no discord ID. For now, we'll just let them write theirs in.
			const user = {
		  id: checkUsers,
		  discordid: verifyDiscordID
			}
			sql`
		  update users set ${
		    sql(user, 'discordid')
		  } where
		    id = ${ user.id }
			`
			return message.reply(`Thanks, ${commanderName}! Your Discord ID has been added as ${verifyDiscordID}.`);
		} else if (matchDiscord != verifyDiscordID) {
			//This isn't your account, let's just yell at you.
			return message.reply(`Sorry - I already know a ${commanderName} and their Discord ID is ${matchDiscord}, yours is ${verifyDiscordID}!`);
		} else {
			//Discord ID matches. Cool. So, do you have a username already?
			const matchUsername = sql`SELECT username FROM users WHERE userid = checkUsers`
			if (!matchUsername) {
				//nope
				const user = {
			  id: checkUsers,
			  username: matchUsername
				}
				sql`
			  update users set ${
			    sql(user, 'username')
			  } where
			    id = ${ user.id }
				`
				return message.reply(`Thanks, ${commanderName}! Your Discord ID has been added as ${verifyDiscordID}.`);
			}
			else {
				return message.reply(`Hi ${matchUsername}. You're already in my system, with the correct ID of ${verifyDiscordID}. Thanks for checking.`);
			}
		}
	}
}

disclient.login(process.env.TOKEN);
