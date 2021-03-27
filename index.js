// Discord.js bot setup
const Discord = require('discord.js');
const disclient = new Discord.Client();

//Config file and postgreSQL client setup
const config = require('./config/config.json');
const { Client } = require('pg');

const sql = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

//Sends to console once the bot is ready for interaction
disclient.once('ready', () => {
	console.log('hewwo');
});

//On a new message in a channel the bot has access to...
disclient.on('message', message => {
    //it only cares abiut messages if they begin with its prefix value I set up on Heroku
    if (message.content.startsWith(process.env.PREFIX)) {

      //split the message into arguments and commands
      const args = message.content.slice(process.env.PREFIX.length).trim().split(' ');
      const command = args.shift().toLowerCase();

      //keep the discord ID of the person who sent this message - we'll need it for basically all commands!
      const verifyDiscordID = `'${message.author.id}'`;

      //this helped me with a lot of bug testing
      //console.log('cmd is ' + command);
      //console.log('args is ' + args);

      //in lieu of a sophisticated event handler i just have this block leading to some functions
      if (command === 'i\'m') UserCreate(message, args, verifyDiscordID);
      else if (command === 'pets') PetsCreate(message, args, verifyDiscordID);
    }
});

//async functions are the best for my purposes - being able to 'try' reading and writing to the SQL database was essential
async function UserCreate(message, commanderName, verifyDiscordID) {
  sql.connect();
	try {
    const sel = await sql.query(`SELECT userid, username FROM users WHERE username = ${commanderName} OR discordid = ${verifyDiscordID}`);
    //getting just the user ID val from this query
    const checkUsers = sel.rows[0].userid;

  		//console.log('user id exists as ' + checkUsers);
  		//If this check succeeds there is a user ID for this already, so let's do some more stuff.
  		try {
        const matchDiscord = await sql.query(`SELECT discordid FROM users WHERE userid = ${checkUsers}`);

        //Let's check if the discord account matches.
        if (matchDiscord != verifyDiscordID) {
          //console.log('desired discord ID is ' + matchDiscord);

    			//This isn't your account, let's just yell at you.
    			return message.reply(`Sorry - I already know a ${commanderName} and their Discord ID is ${matchDiscord}, yours is ${verifyDiscordID}!`);
        } else {
    			//Discord ID matches. Cool. So, do you have a username already?
          try { const sel = await sql.query(`SELECT username FROM users WHERE userid = ${checkUsers}`);
          const matchUsername = sel.rows[0].username;
          //yes!
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
        //In the future, we'll require them to authorize on a web interface.
        //console.log('No discord ID found so we will write yours in.');
  			await sql.query(`
  		  UPDATE users SET discordid = ${verifyDiscordID}
        WHERE userid = ${checkUsers}
  			`);
  			return message.reply(`Thanks, ${commanderName}! Your Discord ID has been added as ${verifyDiscordID}.`);
      }
  } catch(err) {
    //console.log('No existing user ID or discord account, can we try to create one?');
  	//There's no existing user ID for this name or discord account so let's make one.
  	try {
      await sql.query(`
  		  INSERT INTO users (username, discordid)
          VALUES ('${commanderName}', ${verifyDiscordID})
  		`);
      return message.reply(`Thanks, ${commanderName}! I made you a new account, with Discord ID ${verifyDiscordID}.`);
    } catch(err) {
      //If all else fails, just apologize and output the error for me.
      console.log('Creating one failed... eek: '+ err);
      return message.reply(`Sorry... I'm kinda freaking out. I hope Zelle is checking my logs.`);
    }

  }
  sql.end();
}

async function PetsCreate(message, args, verifyDiscordID) {
  sql.connect();
  //check if we know this user already
  console.log(verifyDiscordID);
  try {
    const sel = await sql.query(`SELECT userid FROM users WHERE discordid = ${verifyDiscordID}`);
    //getting just the user ID val from this query
    const checkUsers = sel.rows[0].userid;
    console.log(checkUsers);
    //we know this guy, let's execute the command

    if (!args.length) {
      //if no arguments let's fetch their Pets
        try {
          const sel = await sql.query(`SELECT petid FROM pets WHERE ownerid = ${checkUsers}`);
          const checkPets = [];
          for (i = 0; i < sel.rows.length; i++) {
            checkPets.push(sel.rows[i].petid);
          }
          console.log('pets are ' + checkPets);
          return message.reply(`You have some pets alright. (I'll be able to list them out later.)`);
        } catch(err) {
          console.log('No pets: ' + err)
          //no pets, let's tell them they can make one
          return message.reply(`Hey, you actually don't have any pets. Try **~WN pets make** followed by the pet name you want.`);
        }
    }
    else if (args[0] === 'make') {
      //let's try to make a new pet!
      //but first, let's make sure the user has room
      try {
        const sel = await sql.query(`SELECT totalpets, allowedpets FROM users WHERE userid = ${checkUsers}`);
        const allowedPets = sel.rows[0].allowedpets;
        const currentPets = sel.rows[0].totalpets;
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
              return message.reply(`Nice. I made you a pet named ${args[1]}.`);
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
