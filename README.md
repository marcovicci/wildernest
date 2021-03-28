# world wild web
*an experimental decentralized virtual pet site*

**Q: Decentralized? Is this about bitcoin?**

A: No, but it should be. Sorry. You can go.

**Q: I'm still listening.**

A: Thanks.

## what's wild about the web?

People are using it differently than they did when *I* was a tiny baby on the internet.

OK, but seriously. I grew up spending hours a day on Neopets (the longest-living "virtual pet site", where you take care of imaginary creatures) and playing Starcraft with strangers who didn't know I was nine years old.

Now, the bulk of your online time is probably spent on a few different websites - Facebook, Twitter, whatever. Maybe you use a lot of chat clients too - Slack, IRC, Discord, etc, etc.

That's bad news for online games (and probably for you, but don't worry about it). I was throwing around ideas of how to have people use a virtual pet site without spending a huge amount of time *on* that virtual pet site, and that's what I mean by decentralized. What if you were interacting with all the good stuff - seeing your fake pet, training it, cuddling it, etc - but without having to leave the cozy little nest of your favorite platforms?

It turns out it's totally possible to make that happen, due to the magic of APIs - which I like to think of as funny little doors carved into the side of basically every website there is, as long as you have the keys. So that's that - I want to make a virtual pet website that, from day 1, is designed to latch onto the APIs of other websites so you can perform the major site functions from wherever you already are.

## ok, so what is this?

This is a Discord bot made using node.js, discord.js and postgreSQL.
It's up and running on the Heroku platform **right now** and it can be invited into your discord groups.

https://discord.com/oauth2/authorize?client_id=820800068947935303&scope=bot

Although the WilderNest bot is a work in progress, there are a few commands that work already.

`~WN I'm Bob` will create a user under the name Bob with your discord ID attached.

`~WN Pets` will list your current pets. (Probably none.)

`~WN Pet make Susan` will create a pet named Susan, with you as their owner.

`~WN hi Susan` will allow you to see a picture of your pet. You can press the heart react to pet it, which will briefly animate it.

![A screenshot of Discord showing someone sending the command "hi Bo". In response, the bot embeds an image of a green bird and a prompt asking to pet it.](http://www.wilderne.st/example1.png)

Currently, petting your pet (hmm... that's going to need different terminology) is just for fun. In the future, it could alter internal affection values.

![After being pet, the bird looks cartoonishly happy, with pink hearts swirling around its head.](http://www.wilderne.st/example2.png)

## what next?

Twitter integration.

Maybe IRC, in case you don't use Discord.

Eventually, a web interface (so you can sign up there and use Twitter/Discord's lovely authentication systems to link your account).

Also, lots more pets, games, etc. Hopefully, ones you can use from *anywhere*.

## credits and etcetera

Pets are (and will continue to be) drawn by the talented [Bo Moore](http://bomoore.net/).

Huge thanks to https://discordjs.guide/ and https://www.heroku.com/ for playing so nicely together.
