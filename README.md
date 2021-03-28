## world wild web
*an experimental decentralized virtual pet site*

**Decentralized? Is this about bitcoin?**
No, but it should be. Sorry.

**OK, go on, then.**
Thanks.

###a problem & a possible solution
In the current online climate, the time spent on social media websites is increasing rapidly in proportion to the time spent on other areas of the internet. This has huge implications for online game design - how do you get people to visit your site, and to keep playing as emerging social media giants take up more and more of their "screen time?" Many social media platforms provide APIs – application programming interfaces – that allow outside applications to interact with them. So why not build a game that, from day 1, plans to attach to as many APIs as possible?

Popular in the early internet, virtual pet games (where users create and care for fantasy animals) are losing ground to games played in short bursts on mobile devices, or which use existing social media, like games played through instant messaging programs like Discord or Facebook Messenger. My goal is to explore ways of designing a virtual pet game not only to take advantage of social media technologies and instant messaging, but to incorporate this technique of API parasitism into its core design in order to extend its potential lifespan.  

###ok, so what is this?
This is a Discord bot made using node.js, discord.js and postgreSQL.
It's up and running on the Heroku platform **right now** and it can be invited into your discord groups.

https://discord.com/oauth2/authorize?client_id=820800068947935303&scope=bot

Although the WilderNest bot is a work in progress, there are a few commands that work already.

`~WN I'm Bob` will create a user under the name Bob with your discord ID attached.

`~WN Pets` will list your current pets. (Probably none.)

`~WN Pet make Susan` will create a pet named Susan, with you as their owner.

`~WN hi Susan` will allow you to see a picture of your pet. You can press the heart react to pet it.

Right now, the default pet looks like this:
![A green bird](http://www.wilderne.st/bird_green.png)
