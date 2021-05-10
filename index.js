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

    //in lieu of a sophisticated event handler i just have this block leading to some functions
    if (command === 'i\'m' || command === 'im' || command === 'I’m' || command === 'user') userMake(message, args, verifyDiscordID);
    if (command === 'info') getInfo(message, verifyDiscordID);
    else if (command === 'pets' || command === 'pet') petsInfo(message, args, verifyDiscordID);
    else if (command === 'make') makePetPrompt(message, verifyDiscordID);
    else if (command === 'color') TestColorPet(args);
    else if (command === 'hi' || command === 'hey' || command === 'hello' || command === 'hiya' || command === 'heya' || command === 'heyo' || command === 'howdy') HelloPet(message, args, verifyDiscordID);
  }});

async function getInfo(message, verifyDiscordID) {
  //~info command

  const infoBlock = {
	color: 0x0099ff,
	title: `Wildernest Information`,
  description: `something went wrong`,
  footer: {text: `something went wrong harder`}
  };

  //check if user exists
  try {
    const sel = await sql.query(`SELECT exists(SELECT userid FROM users WHERE discordid = ${verifyDiscordID})`);
    console.log(sel.rows[0].exists);
    if (sel.rows[0].exists) {
      const sel = await sql.query(`SELECT * FROM users WHERE discordid = ${verifyDiscordID}`);
      infoBlock.description = `Your username is ${sel.rows[0].username} and you're user #${sel.rows[0].userid}.`
      const hasPets = await sql.query(`SELECT exists(SELECT * FROM pets WHERE ownerid = ${sel.rows[0].userid})`);
      if (hasPets.rows[0].exists) {
        const pets = await sql.query(`SELECT * FROM pets WHERE ownerid = ${sel.rows[0].userid}`);
        const petsArray = [];
        for (i = 0; i < pets.rows.length; i++) {
          petsArray.push(pets.rows[i].petname);
        }
        allPets = petsArray.join(', ');
        infoBlock.footer.text = `Your pets are: ${allPets}. You can say **~hi** and then a pet name (like **~hi Bo**) to see one.`
      }
      else {
        infoBlock.footer.text = `You don't have any pets yet, but you can change that with **~pets**.`
      }
    }
    else {
      infoBlock.description = `You aren't in my system yet, but you can try **~user** followed by your ideal name (like **~user Bob** or something) to make an account.`
    }
    message.reply({ embed: infoBlock });
  } catch(err) { console.log(err) }
}

async function userMake(message, args, verifyDiscordID) {
  if (!args.length) {
    return message.reply(`Can you try sending that message again, with the username you want? Something like... **~user Bob** (but only if you're Bob)`);
  }
  else {
    try {
      //check if user has account
      const sel = await sql.query(`SELECT exists(SELECT userid FROM users WHERE discordid = ${verifyDiscordID})`);
      if (sel.rows[0].exists) {
        //fetch info
        const sel = await sql.query(`SELECT * FROM users WHERE discordid = ${verifyDiscordID}`);
        return message.reply(`Hi ${sel.rows[0].username}. You're already in my system. Thanks for checking. Say **~info** for more.`);
      }
      else {
        //check if username is taken
        const sel = await sql.query(`SELECT exists(SELECT userid FROM users WHERE username = '${args[0]}')`);
        if (sel.rows[0].exists) {
          return message.reply(`It looks like the username ${args[0]} is taken, sorry! Can you try another?`);
        }
        else {
          await sql.query(`
      		  INSERT INTO users (username, discordid)
              VALUES ('${args[0]}', ${verifyDiscordID})
      		`);
          return message.reply(`Thanks, ${args[0]}! I made you an account, with Discord ID ${verifyDiscordID}.`);
        }
      }
    } catch(err) { console.log(err) }
  }
}

async function petsInfo(message, args, verifyDiscordID) {
  try {
    //does user exist?
    const sel = await sql.query(`SELECT exists(SELECT userid FROM users WHERE discordid = ${verifyDiscordID})`);
      if (sel.rows[0].exists) {
        //fetch user info
        const userInfo = await sql.query(`SELECT * FROM users WHERE discordid = ${verifyDiscordID}`);

        //are there any pets?
        const hasPets = await sql.query(`SELECT exists(SELECT * FROM pets WHERE ownerid = ${userInfo.rows[0].userid})`);
        if (hasPets.rows[0].exists) {
          const pets = await sql.query(`SELECT * FROM pets WHERE ownerid = ${userInfo.rows[0].userid}`);
          const petsArray = [];
          for (i = 0; i < pets.rows.length; i++) {
            petsArray.push(pets.rows[i].petname);
          }
          allPets = petsArray.join(', ');
          if (userInfo.rows[0].totalpets < userInfo.rows[0].allowedpets) {
            return message.reply(`Your pets are: ${allPets}. You can say **~hi** and then a pet name (like **~hi Bo**) to see one.\nThat's ${userInfo.rows[0].totalpets} in all, and you can have up to ${userInfo.rows[0].allowedpets}. Try **~make** to start the process of creating a pet.`);
          }

          else {
            return message.reply(`Your pets are: ${allPets}. You can say **~hi** and then a pet name (like **~hi Bo**) to see one.\nYou've filled all ${userInfo.rows[0].allowedpets} of your pet slots for now.`);
          }

        }
        else {
          return message.reply(`You don't have any pets yet. You can have up to ${userInfo.rows[0].allowedpets}. Try **~make** to start the process of creating a pet.`);
        }
      }
      else {
        return message.reply(`You need an account before you can have pets! Try **~user** followed by your ideal name (like **~user Bob** or something) to make an account.`);
      }
  } catch(err) { console.log(err) }
}

async function makePetPrompt(message, verifyDiscordID) {
  try {
    //does user exist?
    const sel = await sql.query(`SELECT exists(SELECT userid FROM users WHERE discordid = ${verifyDiscordID})`);
    if (sel.rows[0].exists) {
      //user exists, fetch user info
      const userInfo = await sql.query(`SELECT * FROM users WHERE discordid = ${verifyDiscordID}`);
      if (userInfo.rows[0].totalpets < userInfo.rows[0].allowedpets) {
        //let's make a pet
        const dms = await message.author.send(`Awesome, let's make a pet. First of all, what do you want your pet's name to be? Please reply with ONLY the name you want. No spaces in pet names, please.`)
          //create filter for the user who triggered the command
          const filter = (user) => {
        	return user.id === verifyDiscordID;
          };

	            dms.channel.awaitMessages(filter, { max: 100, time: 60000, errors: ['time'] })
		            .then (async collected => {
                  const args = collected.content.trim().split(' ');
                  const sel = sql.query(`SELECT exists(SELECT * FROM pets WHERE petname = ${args[0]})`);
                  if (sel.rows[0].exists) {
                    //pet name taken
                    return dms.reply(`I already have a pet named ${args[0]} in my system, can you try another name?`);
                  }
                  else {
                    //let's try making a pet
                    NewPetGen(message, userInfo, verifyDiscordID, args[0], bird);
                  }
                })
		            .catch(collected => {
			               return dms.reply(`I've timed out and stopped listening... you can try **~make** to restart the process.`);
		            });
        .catch(err => {
    			console.log(`Could not send help DM to ${message.author.tag}.\n`, err);
    			message.reply(`I think you've got your DMs turned off, but it's OK, we can do this right here.`);
    		});
      }
      else {
        //too many pets
        return message.reply(`You've filled all ${userInfo.rows[0].allowedpets} of your pet slots for now.`);
      }
    } else {
      //no user
      return message.reply(`You need an account before you can have pets! Try **~user** followed by your ideal name (like **~user Bob** or something) to make an account.`);
    }
  } catch(err) {console.log(err)}
}

async function NewPetGen(message, userInfo, discordUser, petName, species) {

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
  .colorspace('RGB')
  .fill(rgb(redValue, greenValue, blueValue))
  .colorize(100, 100, 100)
  .write(`./pets/${petname}_colored.png`, function (err) {
    if (!err) {
      gm(`./pets/${petname}_colored.png`)
      //composite with static pet image layer
      .composite(`./pets/base/${species}/normal_static.png`)
      .write(`./pets/${petname}_normal.png`, function (err) {
        if (!err) {
          console.log(`Attachment at: ./pets/${petname}_normal.png`);
        }
        else console.log(err);
      });
    }
    else console.log(err);
  });

  //happy ver
  gm(`./pets/base/${species}/happy_colorable.png`)
  //colorize according to pet's color values
  .colorspace(RGB)
  .fill(rgb(redValue, greenValue, blueValue))
  .colorize(100, 100, 100)
  .write(`./pets/${petname}_colored_happy.png`, function (err) {
    if (!err) {
      gm(`./pets/${petname}_colored_happy.png`)
      //composite with static pet image layer
      .composite(`./pets/base/${species}/happy_static.png`)
      .write(`./pets/${petname}_happy.png`, function (err) {
        console.log(`Attachment at: ./pets/${petname}_happy.png`);
      });
    }
    else console.log(err);
  });
}

async function makePetPersonality(message, userInfo, discordUser, petName, species, pet_rgb) {

  //personality values
  let pet_boom = 50;
  let pet_flex = 50;
  let pet_heat = 50;
  let pet_meat = 50;

  const petPersonality = {
  color: 0x0099ff,
  title: `${petname} the ${species}`,
  files: [{
    attachment:`./pets/${petname}_normal.png`,
    name:'normal.png'
  }],
  image: {
		url: 'attachment://normal.png',
	},
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

async function PetCommit(message, userInfo, discordUser, petname, species, pet_rgb, pet_boom, pet_flex, pet_heat, pet_meat) {
  try {
      //write this new pet info into our database!
      await sql.query(`
        INSERT INTO pets (petname, ownerid, species, redval, greenval, blueval, boom, flex, heat, meat)
          VALUES (${petname}, ${userInfo.rows[0].userid}, ${species}, ${pet_rgb[0]}, ${pet_rgb[1]}, ${pet_rgb[2]}, ${pet_boom}, ${pet_flex}, ${pet_heat}, ${pet_meat})
      `);

      //also increment pet amount for user
      userInfo.rows[0].totalpets++;
      await sql.query(`
        UPDATE users
        SET totalpets=${userInfo.rows[0].totalpets}
        WHERE userid=${userInfo.rows[0].userid}
      `);

      //fetch pet ID for the upcoming thang
      const newPetInfo = await sql.query(`
        SELECT * FROM pets WHERE petname = ${petname}
      `);

      //let's begin gm and fetch the base image for our pet species
      gm(`./pets/base/${newPetInfo.rows[0].species}/normal_colorable.png`)
      //colorize according to pet's color values
      .colorspace('RGB')
      .fill(rgb(newPetInfo.rows[0].redval, newPetInfo.rows[0].greenval, newPetInfo.rows[0].blueval))
      .colorize(100, 100, 100)
      .write(`./pets/id/${newPetInfo.rows[0].petid}_colored.png`, function (err) {
        if (!err) {
          gm(`./pets/id/${newPetInfo.rows[0].petid}_colored.png`)
          //composite with static pet image layer
          .composite(`./pets/base/${newPetInfo.rows[0].species}/normal_static.png`)
          .write(`./pets/id/${newPetInfo.rows[0].petid}_normal.png`, function (err) {
            if (!err) {
              cloudinary.uploader.upload(`./pets/id/${newPetInfo.rows[0].petid}_normal.png`,
              function(result) {
                console.log(result);
                console.log(`Image is now accessible through Cloudinary: ${newPetInfo.rows[0].petid}_normal.png`);
              }, {public_id: `${newPetInfo.rows[0].petid}_normal`})
            }
            else console.log(err);
          });
        }
        else console.log(err);
      });

      //happy ver
      gm(`./pets/base/${newPetInfo.rows[0].species}/happy_colorable.png`)
      //colorize according to pet's color values
      .colorspace(RGB)
      .fill(rgb(newPetInfo.rows[0].redval, newPetInfo.rows[0].greenval, newPetInfo.rows[0].blueval))
      .colorize(100, 100, 100)
      .write(`./pets/id/${newPetInfo.rows[0].petid}_colored_happy.png`, function (err) {
        if (!err) {
          gm(`./pets/id/${newPetInfo.rows[0].petid}_colored_happy.png`)
          //composite with static pet image layer
          .composite(`./pets/base/${newPetInfo.rows[0].species}/happy_static.png`)
          .write(`./pets/id/${newPetInfo.rows[0].petid}_happy.png`, function (err) {
            cloudinary.uploader.upload(`./pets/id/${newPetInfo.rows[0].petid}_happy.png`,
            function(result) {
              console.log(result);
              console.log(`Image is now accessible through Cloudinary: ${newPetInfo.rows[0].petid}_happy.png`);
            }, {public_id: `${newPetInfo.rows[0].petid}_happy`})
          });
        }
        else console.log(err);
      });

      BuildPetEmbed(message, newPetInfo, userInfo);

  } catch(err) {
    console.log(err);
  }
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
        cloudinary.uploader.upload(`./pets/id/${petID}_normal.png`,
        function(result) {
          console.log(result);
          console.log(`Image is now accessible through Cloudinary: ${petID}_normal.png`);
        }, {public_id: `${petID}_normal`})
        message.reply(cloudinary.url(`${petID}_normal.png`));
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
      message.reply(cloudinary.url(`${petID}_happy.png`));
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
