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

disclient.once('ready', () => {
	console.log('hewwo');
});

disclient.on('message', message => {
    //console.log('message is ' + message.content);
    if (message.content.startsWith(process.env.PREFIX)) {
      const args = message.content.slice(process.env.PREFIX.length).trim().split(' ');
      const command = args.shift().toLowerCase();
      console.log('cmd is ' + command);
      console.log('args is ' + args);
      if (command === 'i\'m') UserCreate(message, args, message.author.id);
      //else if (command === 'Pets') UserCreate(message.author.id);
    }
});

async function UserCreate(message, commanderName, verifyDiscordID) {
  sql.connect();
	const checkUsers = await sql.query(`SELECT userid FROM users WHERE username = ${commanderName} OR discordid = ${verifyDiscordID}`);
	if (!checkUsers) {
		//There's no existing user ID for this name or discord account so let's make one.
		const newUser = [{
	  username: commanderName,
	  discordid: verifyDiscordID
		}]

		await sql.query(`
		  insert into users ${
		    sql(newUser, 'username', 'discordid')
		  }
		`);

    return message.reply(`Thanks, ${commanderName}! I made you a new account, with user ID ${checkUsers} and Discord ID ${verifyDiscordID}.`);
	} else {
		console.log(checkUsers);
		//There is a user ID for this already, so let's do some more stuff.
		const matchDiscord = await sql.query(`SELECT discordid FROM users WHERE userid = ${checkUsers}`);
		//Let's check if the discord account matches.
		if (!matchDiscord) {
			//Well, there's no discord ID. For now, we'll just let them write theirs in.
			const user = {
		  id: checkUsers,
		  discordid: verifyDiscordID
			}
			await sql.query(`
		  update users set ${
		    sql(user, 'discordid')
		  } where
		    id = ${ user.id }
			`);

			return message.reply(`Thanks, ${commanderName}! Your Discord ID has been added as ${verifyDiscordID}.`);
		} else if (matchDiscord != verifyDiscordID) {
			//This isn't your account, let's just yell at you.

			return message.reply(`Sorry - I already know a ${commanderName} and their Discord ID is ${matchDiscord}, yours is ${verifyDiscordID}!`);
		} else {
			//Discord ID matches. Cool. So, do you have a username already?
			const matchUsername = await sql.query(`SELECT username FROM users WHERE userid = ${checkUsers}`);
			if (!matchUsername) {
				//nope
				const user = {
			  id: checkUsers,
			  username: matchUsername
				}
				await sql.query(`
			  update users set ${
			    sql(user, 'username')
			  } where
			    id = ${ user.id }
				`);

				return message.reply(`Thanks, ${commanderName}! Your Discord ID has been added as ${verifyDiscordID}.`);
			}
			else {

				return message.reply(`Hi ${matchUsername}. You're already in my system, with the correct ID of ${verifyDiscordID}. Thanks for checking.`);
			}
		}
	}
  sql.end();
}

disclient.login(process.env.TOKEN);
