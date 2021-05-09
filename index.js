// Discord.js bot setup
const Discord = require('discord.js');
const disclient = new Discord.Client();

//Twit bot setup
//const Twit = require('twit');
//const Twitter = new Twit({
//  consumer_key: process.env.TWIT_KEY,
//  consumer_secret: process.env.TWIT_SECRET,
//  access_token: '',
//  access_token_secret: ''
//});

//GraphicsMagick setup
const gm = require('gm');
const imageMagick = gm.subClass({imageMagick: true});

//Cloudinary setup - this is the free file storage solution I'm using at the moment
const cloudinary = require('cloudinary');

//postgreSQL client setup
const { Pool } = require('pg');

const sql = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

//profanity filter hosted on heroku
const profanity = process.env.PROFANITY.split(' ');

//Sends to my bot logs channel once the bot is ready for interaction
disclient.once('ready', () => {
  console.log(profanity);
  disclient.channels.cache.get(`825934332027469866`).send(`hewwo. I'm back online.`)
  //custom activity
  disclient.user.setActivity('http://wilderne.st/', { type: 'PLAYING' })
  .then(presence => console.log(`Activity set to ${presence.activities[0].name}`))
  .catch(console.error);
});

//On a new message in a channel the bot has access to...
disclient.on('message', message => {

  //profanity checking function first splits the message into words
  const swearCheck = message.content.split(' ');

  //keep the discord ID of the person who sent this message - we'll need it for basically all commands!
  //fun fact, if i don't wrap this in single quotes, JS sometimes(!) interprets it as a big int and causes me problems later
  const verifyDiscordID = `'${message.author.id}'`;


  //only accepts commands if they begin with its prefix value I set up on Heroku
  if (message.content.startsWith(process.env.PREFIX)) {

    //split the message into arguments and commands
    const args = message.content.slice(process.env.PREFIX.length).trim().split(' ');
    const command = args.shift().toLowerCase();

    //this helped me with a lot of bug testing
    //console.log('cmd is ' + command);
    //console.log('args is ' + args);

    //but let's add a swear filter if we're in my discord - i'll never get partner status otherwise!
    //this is goofy, but i include it both inside and outside that if block, because otherwise i might execute a function with swears
    //and if i include it BEFORE the if block, the "return" prevents the if block from triggering!
    //todo: refactor this later
    if (`'${message.guild.id}'` === `'${process.env.HOME_GUILD}'` && `'${message.author.id}'` != `'${process.env.MY_ID}'`){
      for (i = 0; i < swearCheck.length; i++) {
        if (profanity.includes(swearCheck[i])) {
          message.delete();
          disclient.channels.cache.get(`825934332027469866`).send(`message "${message.content}" from ${message.author} in channel ${message.channel} contained this bad word: ${swearCheck[i]}`);
          return;
        }}
    }

    //in lieu of a sophisticated event handler i just have this block leading to some functions
    if (command === 'i\'m' || command === 'im' || command === 'I’m') UserCreate(message, args, verifyDiscordID);
    else if (command === 'pets' || command === 'pet') PetsCreate(message, args, verifyDiscordID);
    else if (command === 'color') TestColorPet(args);
    else if (command === 'search') searchForMe(verifyDiscordID);
    else if (command === 'badsearch') searchForSatan(verifyDiscordID);
    else if (command === 'hi' || command === 'hey' || command === 'hello' || command === 'hiya' || command === 'heya' || command === 'heyo' || command === 'howdy') HelloPet(message, args, verifyDiscordID);
  } else {
    //but let's add a swear filter if we're in my discord - i'll never get partner status otherwise!
    //this is goofy, but i include it both inside and outside that if block, because otherwise i might execute a function with swears
    //and if i include it BEFORE the if block, the "return" prevents the if block from triggering!
    //todo: refactor this later
    if (`'${message.guild.id}'` === `'${process.env.HOME_GUILD}'` && `'${message.author.id}'` != `'${process.env.MY_ID}'`){
      for (i = 0; i < swearCheck.length; i++) {
        if (profanity.includes(swearCheck[i])) {
          message.delete();
          disclient.channels.cache.get(`825934332027469866`).send(`message "${message.content}" from ${message.author} in channel ${message.channel} contained this bad word: ${swearCheck[i]}`);
          return;
        }}
    }

}});

//async functions are the best for my purposes - being able to 'try' reading and writing to the SQL database was essential
async function UserCreate(message, commanderName, verifyDiscordID) {
	try {
    const sel = await sql.query(`SELECT userid FROM users WHERE username = '${commanderName}' OR discordid = ${verifyDiscordID}`);
    //getting just the user ID val from this query
    const checkUsers = sel.rows[0].userid;

  		//console.log('user id exists as ' + checkUsers);
  		//If this check succeeds there is a user ID for this already, so let's do some more stuff.
  		try {
        const sel = await sql.query(`SELECT discordid FROM users WHERE userid = ${checkUsers}`);
        const matchDiscord = '\'' + sel.rows[0].discordid + '\'';

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
        console.log('problem finding discord id: ' + err)
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
    console.log('problem finding user: ' + err)
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
}

async function PetsCreate(message, args, verifyDiscordID) {
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
          const sel = await sql.query(`SELECT petname FROM pets WHERE ownerid = ${checkUsers}`);
          const checkPets = [];
          for (i = 0; i < sel.rows.length; i++) {
            checkPets.push(sel.rows[i].petname);
          }
          console.log('pets are ' + checkPets);
          return message.reply(`You have some pets alright: ${checkPets} Say **~WN hi** and then a pet name to see one.`);

        } catch(err) {
          console.log('No pets: ' + err)
          //no pets, let's tell them they can make one
          return message.reply(`Hey, you actually don't have any pets. Try **~WN pets make** followed by the pet name you want.`);
        }
    }
    else if (args[0] === 'make' || args[0] === 'create') {
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
                VALUES ('${args[1]}', ${checkUsers})
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

    else {
      return message.reply(`I don't understand that command. Try just **~WN pets** instead.`);
    }

    } catch(err) {
      //we dont knwo this guy
      console.log('Couldn\'t find user: ' + err)
      return message.reply(`Sorry, I don't know you yet! Can you try **~WN I'm** followed by the username you want?`);
    }
}

async function searchForMe(verifyDiscordID) {
  const sel = await sql.query(`SELECT exists(SELECT userid FROM users WHERE discordid = ${verifyDiscordID})`);
  console.log(sel.rows[0]);
}

async function searchForSatan(verifyDiscordID) {
  const sel = await sql.query(`SELECT exists(SELECT userid FROM users WHERE discordid = '666')`);
  console.log(sel.rows[0]);
}

async function NewPetGen(discordUser, petName, species) {

  //start defining pet values... color
  let pet_rgb = [0, 0, 0];

  //prompt user to select basic functions
  const colorYourPet = {
	color: 0x0099ff,
	title: `${petname} the ${species}`,
  description: `Cool, let's make a pet. Please hit the reaction below to pick your pet's color. You can change this later.`,
  footer: {text: `Or, hit the X to cancel creating a pet named ${petname}.`}
  };

  let ownMsg = await message.reply({ embed: colorYourPet });
  ownMsg.react('⚪');
  ownMsg.react('🔴');
  ownMsg.react('🟠');
  ownMsg.react('🟡');
  ownMsg.react('🟢');
  ownMsg.react('🔵');
  ownMsg.react('🟣');
  ownMsg.react('❌');

  //discord.js has its own framework for collecting reactions, which i use here
  const filter = (reaction, user) => {
    //this filter only responds to hear reactions, and only if they're sent by the pet maker
  	return ['⚪', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '❌'].includes(reaction.emoji.name) && user.id === discordUser;
  };

  ownMsg.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
	.then(collected => {
		const reaction = collected.first();

		if (reaction.emoji.name === '⚪') {
      colorYourPet.description = `White? Why not. Consider it done.`;
      ownMsg.edit({ embed: colorYourPet });
      pet_rgb = [0, 0, 0];
		}
    if (reaction.emoji.name === '🔴') {
      colorYourPet.description = `Red? Radical. Consider it done.`;
      ownMsg.edit({ embed: colorYourPet });
      pet_rgb = [220, 58, 57];
		}
    if (reaction.emoji.name === '🟠') {
      colorYourPet.description = `Orange? Obviously the best. Consider it done.`;
      ownMsg.edit({ embed: colorYourPet });
      pet_rgb = [245, 132, 31];
		}
    if (reaction.emoji.name === '🟡') {
      colorYourPet.description = `Yellow? Yesss. Consider it done.`;
      ownMsg.edit({ embed: colorYourPet });
      pet_rgb = [249, 191, 44];
		}
    if (reaction.emoji.name === '🟢') {
      colorYourPet.description = `Green? Great. Consider it done.`;
      ownMsg.edit({ embed: colorYourPet });
      pet_rgb = [117, 173, 68];
		}
    if (reaction.emoji.name === '🔵') {
      colorYourPet.description = `Blue? Brilliant. Consider it done.`;
      ownMsg.edit({ embed: colorYourPet });
      pet_rgb = [45, 141, 227];
		}
    if (reaction.emoji.name === '🟣') {
      colorYourPet.description = `Purple? Perfect. Consider it done.`;
      ownMsg.edit({ embed: colorYourPet });
      pet_rgb = [129, 54, 148];
		}
    if (reaction.emoji.name === '❌') {
      colorYourPet.description = 'Cool. Consider that pet unmade.';
      ownMsg.edit({ embed: colorYourPet });
		}
	}).catch(collected => {
    colorYourPet.description = `I didn't catch your reaction in time, so I didn't make that pet for you.`;
    ownMsg.edit({ embed: colorYourPet });
	});

  //let's begin gm and fetch the base image for our pet species
  gm(`./pets/base/${species}/normal_colorable.png`)
  //colorize according to pet's color values
  .colorize(redValue, greenValue, blueValue)
  .write(`./pets/id/${petID}_colored.png`, function (err) {
    if (!err) {
      gm(`./pets/id/${petID}_colored.png`)
      //composite with static pet image layer
      .composite(`./pets/base/${species}/normal_static.png`)
      .write(`./pets/id/${petID}_normal.png`, function (err) {
        if (!err) {
          cloudinary.uploader.upload(`./pets/id/${petID}_normal.png`,
          function(result) {
            console.log(result);
            console.log(`Image is now accessible through Cloudinary: ${petID}_normal.png`);
          }, {public_id: `${petID}_normal`})
        }
        else console.log(err);
      });
    }
    else console.log(err);
  });

  //happy ver
  gm(`./pets/base/${species}/happy_colorable.png`)
  //colorize according to pet's color values
  .colorize(redValue, greenValue, blueValue)
  .write(`./pets/id/${petID}_colored_happy.png`, function (err) {
    if (!err) {
      gm(`./pets/id/${petID}_colored_happy.png`)
      //composite with static pet image layer
      .composite(`./pets/base/${species}/happy_static.png`)
      .write(`./pets/id/${petID}_happy.png`, function (err) {
        cloudinary.uploader.upload(`./pets/id/${petID}_happy.png`,
        function(result) {
          console.log(result);
          console.log(`Image is now accessible through Cloudinary: ${petID}_happy.png`);
        }, {public_id: `${petID}_happy`})
      });
    }
    else console.log(err);
  });
}

async function makePetPersonality() {

  //personality values
  let pet_boom = 50;
  let pet_flex = 50;
  let pet_heat = 50;
  let pet_meat = 50;

  const petPersonality = {
  color: 0x0099ff,
  title: `${petname} the ${species}`,
  description: `One last thing... all pets are made of four flavours: 💥BOOM, 💃FLEX, 🔥HEAT and 🍖MEAT. Pick your favorite flavour from below. You can change this later.`,
  footer: {text: `Or, hit the X to cancel creating a pet named ${petname}.`}
  };

  let finalMsg = await ownMsg.reply({ embed: petPersonality });
  finalMsg.react('💥');
  finalMsg.react('💃');
  finalMsg.react('🔥');
  finalMsg.react('🍖');
  finalMsg.react('❌');

  const filter = (reaction, user) => {
    //this filter only responds to hear reactions, and only if they're sent by the pet maker
    return ['💥', '💃', '🔥', '🍖', '❌'].includes(reaction.emoji.name) && user.id === discordUser;
  };

  finalMsg.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
  .then(collected => {
    const reaction = collected.first();

    if (reaction.emoji.name === '💥') {
      petPersonality.description = `Throw in some extra BOOM! 💥 Consider it done.`;
      finalMsg.edit({ embed: petPersonality });
      pet_boom = 75;
    }
    if (reaction.emoji.name === '💃') {
      petPersonality.description = `Throw in some extra FLEX! 💃 Consider it done.`;
      finalMsg.edit({ embed: petPersonality });
      pet_flex = 75;
    }
    if (reaction.emoji.name === '🔥') {
      petPersonality.description = `Throw in some extra HEAT! 🔥 Consider it done.`;
      finalMsg.edit({ embed: petPersonality });
      pet_heat = 75;
    }
    if (reaction.emoji.name === '🍖') {
      petPersonality.description = `Throw in some extra MEAT! 🍖 Consider it done.`;
      finalMsg.edit({ embed: petPersonality });
      pet_meat = 75;
    }
    if (reaction.emoji.name === '❌') {
      petPersonality.description = 'Cool. Consider that pet unmade.';
      finalMsg.edit({ embed: petPersonality });
    }
    }).catch(collected => {
      petPersonality.description = `I didn't catch your reaction in time, so I didn't make that pet for you.`;
      finalMsg.edit({ embed: petPersonality });
  	});
}

async function HelloPet(message, args, verifyDiscordID) {
  //check this users
  try {
    const sel = await sql.query(`SELECT userid FROM users WHERE discordid = ${verifyDiscordID}`);
    //getting just the user ID val from this query
    const checkUsers = sel.rows[0].userid;
    if (!args.length) {
      //if no arguments
        return message.reply(`Hi! Were you trying to say hi to a pet? Make sure you include the pet name, like **~WN hi Bo** or something.`);
    } else {
      //if they included a pet name, let's see if it exists
      const myPetName = `'${args[0]}'`
      try {

        const sel = await sql.query(`SELECT * FROM pets WHERE petname = ${myPetName}`);
        //console.log(sel);

        //if so, we can build an embed!
        BuildPetEmbed(message, sel, checkUsers)

      } catch(err) {
        //pet doesn't exist
        console.log('Couldn\'t find pet: ' + err)
        return message.reply(`I can't find a pet by the name ${myPetName}, sorry! Maybe you need to make one.`);
      }
    }
  } catch(err) {
    //we dont knwo this guy
    console.log('Couldn\'t find user: ' + err)
    return message.reply(`Hi! Sorry, I don't know you yet! Can you try **~WN I'm** followed by the username you want?`);
  }
}

async function TestColorPet(args) {
//for manually recoloring pets, before minigame exists
//id, species, redValue, greenValue, blueValue
const petID = args[0];
const species = args[1];
const redValue = args[2];
const greenValue = args[3];
const blueValue = args[4];

//let's begin gm and fetch the base image for our pet species
gm(`./pets/base/${species}/normal_colorable.png`)
//colorize according to pet's color values
.colorize(redValue, greenValue, blueValue)
.write(`./pets/id/${petID}_colored.png`, function (err) {
  if (!err) {
    gm(`./pets/id/${petID}_colored.png`)
    //composite with static pet image layer
    .composite(`./pets/base/${species}/normal_static.png`)
    .write(`./pets/id/${petID}_normal.png`, function (err) {
      if (!err) {
        cloudinary.uploader.upload(`./pets/id/${petID}_normal.png`,
        function(result) {
          console.log(result);
          console.log(`Image is now accessible through Cloudinary: ${petID}_normal.png`);
        }, {public_id: `${petID}_normal`})
      }
      else console.log(err);
    });
  }
  else console.log(err);
});

//happy ver
gm(`./pets/base/${species}/happy_colorable.png`)
//colorize according to pet's color values
.colorize(redValue, greenValue, blueValue)
.write(`./pets/id/${petID}_colored_happy.png`, function (err) {
  if (!err) {
    gm(`./pets/id/${petID}_colored_happy.png`)
    //composite with static pet image layer
    .composite(`./pets/base/${species}/happy_static.png`)
    .write(`./pets/id/${petID}_happy.png`, function (err) {
      cloudinary.uploader.upload(`./pets/id/${petID}_happy.png`,
      function(result) {
        console.log(result);
        console.log(`Image is now accessible through Cloudinary: ${petID}_happy.png`);
      }, {public_id: `${petID}_happy`})
    });
  }
  else console.log(err);
});

}

async function BuildPetEmbed(message, sel, checkUsers) {

  //cloudinary.url(`${petID}_happy.png`)

  //build embed object
  const petEmbed = {
	color: 0x0099ff,
	title: `${sel.rows[0].petname} the ${sel.rows[0].species}`,
	author: {
		name: `Pet #${sel.rows[0].petid} @ WilderNest`,
    //when there is a web interface, this url will change for pet IDs
		url: 'http://wilderne.st',
	},
  //by including the happy and normal pet images as attachments and hiding one in the footer,
  //i can swap between them without disrupting the embed appearance
  //when there are more types of pets, i can use the same color variable above in these image URL names!
  files: [{
    attachment:cloudinary.url(`${sel.rows[0].petid}_normal.png`),
    name:'normal.png'
  },
  {
    attachment:cloudinary.url(`${sel.rows[0].petid}_happy.png`),
    name:'happy.png'
  }],
  image: {
		url: 'attachment://normal.png',
	},
	footer: {
		text: `${sel.rows[0].petname} is waiting patiently for love. Press the heart react to pat them.`,
    icon_url: 'attachment://happy.png',
	},
  };
  //this causes the bot to add a heart to its own message once the embed is sent
  //using message reply is harmless here (embeds do not cause a ping) and ensures it's sent in the right channel
  let ownMsg = await message.reply({ embed: petEmbed });
  ownMsg.react('❤️');
  var lovePats = 0;

  //discord.js has its own framework for collecting reactions, which i use here
  const filter = (reaction, user) => {
    //this filter only responds to hear reactions, and only if they're not sent by the bot itself
  	return reaction.emoji.name === '❤️' && user.id != process.env.MY_ID;
  };

  const collector = ownMsg.createReactionCollector(filter, { time: 30000 });

  collector.on('collect', (reaction, user) => {
    //updates pet footer and images, then edits the embed, whenever a react is added
    lovePats ++;
    petEmbed.footer.text = `${sel.rows[0].petname} looks delighted to receive a pat!`;
    petEmbed.image.url = 'attachment://happy.png';
    petEmbed.footer.icon_url = 'attachment://normal.png';
    ownMsg.edit({ embed: petEmbed });
  });

  collector.on('end', collected => {
    //final update after the collection timeout of 30 seconds
    petEmbed.footer.text = `${sel.rows[0].petname} enjoyed ${lovePats} pat(s) in 30 seconds.`;
    petEmbed.image.url = 'attachment://normal.png';
    petEmbed.footer.icon_url = 'attachment://happy.png';
    ownMsg.edit({ embed: petEmbed });
  });

}

disclient.login(process.env.TOKEN);
