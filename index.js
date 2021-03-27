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
      const verifyDiscordID = String(message.author.id);
      console.log('cmd is ' + command);
      console.log('args is ' + args);
      if (command === 'i\'m') UserCreate(message, args, verifyDiscordID);
      else if (command === 'pets') PetsCreate(message, args, verifyDiscordID);
    }
});

async function UserCreate(message, commanderName, verifyDiscordID) {
  sql.connect();
	try {
    const checkUsers = await sql.query(`SELECT userid FROM users WHERE username = ${commanderName} OR discordid = ${verifyDiscordID}`);

  		console.log('user id exists as ' + checkUsers);
  		//There is a user ID for this already, so let's do some more stuff.
  		try {
        const matchDiscord = await sql.query(`SELECT discordid FROM users WHERE userid = ${checkUsers}`);
        //Let's check if the discord account matches.
        if (matchDiscord != verifyDiscordID) {
          console.log('desired discord ID is ' + matchDiscord);
    			//This isn't your account, let's just yell at you.
    			return message.reply(`Sorry - I already know a ${commanderName} and their Discord ID is ${matchDiscord}, yours is ${verifyDiscordID}!`);
        } else {
    			//Discord ID matches. Cool. So, do you have a username already?
          try { const matchUsername = await sql.query(`SELECT username FROM users WHERE userid = ${checkUsers}`);
          return message.reply(`Hi ${matchUsername}. You're already in my system, with the correct ID of ${verifyDiscordID}. Thanks for checking.`);
          } catch(err) { //nope, no username
          console.log('No username found so we give you a new one.');
           await sql.query(`
     		   UPDATE users SET username = ${commanderName}
           WHERE userid = ${checkUsers}
     			`);
           return message.reply(`Thanks, ${commanderName}! Your Discord ID has been added as ${verifyDiscordID}.`); }
        }
      } catch(err) {
  			//Well, there's no discord ID. For now, we'll just let them write theirs in.
        console.log('No discord ID found so we will write yours in.');
  			await sql.query(`
  		  UPDATE users SET discordid = ${verifyDiscordID}
        WHERE userid = ${checkUsers}
  			`);
  			return message.reply(`Thanks, ${commanderName}! Your Discord ID has been added as ${verifyDiscordID}.`);
      }
  } catch(err) {
    console.log('No existing user ID or discord account, can we try to create one?');
  		//There's no existing user ID for this name or discord account so let's make one.
  	try {
      await sql.query(`
  		  INSERT INTO users (username, discordid)
          VALUES ('${commanderName}', '${verifyDiscordID}')
  		`);
      return message.reply(`Thanks, ${commanderName}! I made you a new account, with Discord ID ${verifyDiscordID}.`);
    } catch(err) {
      console.log('Creating one failed... eek: '+ err);
      return message.reply(`Sorry... I'm kinda freaking out. I hope Zelle is checking my logs.`);
    }

  }
  sql.end();
}

async function PetsCreate(message, args, verifyDiscordID) {
  sql.connect();
  //check if we know this user
  try {
    const checkUsers = await sql.query(`SELECT userid FROM users WHERE discordid = ${verifyDiscordID}`);
    //we know this guy, let's execute the command

    if (!args.length) {
      //if no arguments let's fetch their Pets first off
        try {
          const checkPets = await sql.query(`SELECT * FROM pets WHERE ownerid = ${checkUsers}`);
          console.log('pets are ' + checkPets);
          return message.reply(`You have some pets alright. (I'll be able to list them out later.)`);
        } catch(err) {
          //no pets, let's tell them they can make one
          return message.reply(`Hey, you actually don't have any pets. Try **~WN pets make** followed by the pet name you want.`);
        }
    }
    else if (args[0] === 'make') {
      //let's try to make a new pet!
      //but first, let's make sure the user has room
      try {
        const currentPets = await sql.query(`SELECT totalpets FROM users WHERE userid = ${checkUsers}`);
        const allowedPets = await sql.query(`SELECT allowedpets FROM users WHERE userid = ${checkUsers}`);
        if (allowedPets > currentPets) {
          //we can make a pet!
          try {
            await sql.query(`
        		  INSERT INTO pets (petname, ownerid)
                VALUES ('${args[1]}', '${checkUsers}')
        		`);

            //if that worked, let's also update the current pets for that user
            try {
              await sql.query(`
        		  UPDATE users SET totalpets = totalpets + 1
              WHERE userid = ${checkUsers}
        			`);
            } catch(err) {
              //why didn't that work? let's see
              console.log('Couldn\'t increment pet values... ' + err)
              return message.reply(`Sorry... I'm kinda freaking out. I hope Zelle is checking my logs.`);
            }
          } catch(err) {
            //pet name was probably taken
            console.log('Couldn\'t make this pet... ' + err)
            return message.reply(`I wasn't able to create that pet. I'll have better error responding soon.`);
          }

        } else {
          //pets are full
          return message.reply(`Hey, you're only allowed to have ${allowedPets} pets and you already have ${currentPets} pets. Try **~WN pets** to see them.`);
        }
      } catch(err) {
        console.log('Failed to fetch current pets and allowed pets: ' + err);
        return message.reply(`Sorry... I'm kinda freaking out. I hope Zelle is checking my logs.`);
      }
    }

    } catch(err) {
      //we dont knwo this guy
      console.log('Couldn\'t find user: ' + err)
      return message.reply(`Sorry, I don't know you yet! Can you try **~WN I'm** followed by the username you want?`);
    }
  sql.end();
}

disclient.login(process.env.TOKEN);
