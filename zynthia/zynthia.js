const { QuickDB } = require('quick.db');
const path = require('path');
require('dotenv').config();
const fs = require('fs');
const db = new QuickDB();
require('node-fetch');

module.exports = {
	runCommand: '<@1085936447904821269> ',
	aliases: ['<@1085936447904821269>'],
	async run(m, args) {
		//remove the prefix from the content so you (I) get the arguments
		const prefix = this.runCommand;
		args = m.content.slice(prefix.length);

		const subcommandName = args.split(' ')[0].toLowerCase(); //the first argument shall be the subcommand (we will check if it is indeed a subcommand)
		const subcommandModule = this.subcommands[subcommandName];

		if (subcommandModule) {
			//if a victim is found AND is alone, make it run
			if (
				args.split(' ').length != 1 &&
				args.split(' ')[0].toLowerCase() == 'edit' //except edit because you need the rest of the arguments
			) {
				subcommandModule.run(m, args);
				return;
			} else if (args.split(' ').length == 1) {
				subcommandModule.run(m, args);
				return;
			}
		}
		await m.channel.sendTyping();

		const whereIsJason = path.join(__dirname, 'jason.json'); //find Jason (the json dump)
		const rawJason = fs.readFileSync(whereIsJason, 'utf-8');
		const cookedJason = JSON.parse(rawJason);
		const deefault = cookedJason.zynthiaDefault.join('\n');

		//find each of these or replace with either default or an empty array if nothing is found
		let previousContext = (await db.get(`Zynncon`)) || deefault;
		let history = (await db.get(`Zynnhis`)) || [];

		if (!args) {
			//if user triggers the bot through a ping (without anything else), make this the args (for when you don't want to speak)
			args = `(${m.author.username} is pinging you in the chat)`;
		}

		const apiUrl = 'https://api.novelai.net/ai/generate';
		const text = `${previousContext}\n${m.author.username}: ${args}\n`; //attach name to dialogue so the AI doesn't get confused about who's talking

		//some declarations
		const parameters = cookedJason.zynnParams;
		const functions = require(path.join(__dirname, 'functions.js'));
		const objects = require(path.join(__dirname, 'objects.js'));

		const requestOptions = objects.requestOptions(
			text,
			parameters,
			process.env.NAIKEY
		);

		functions
			.neverGiveUpExceptAfterFailingTwice(
				apiUrl,
				requestOptions,
				1,
				4000,
				m
			) //the function in question:
			.then((data) => {
				let reply = data.output.replaceAll('Zynthia:', '').trim(); //trim and remove any 'Zynthia:'s just to be sure
				db.set(`ZynnCurrRep`, reply.trim()); //trim reply and set it as the current reply (for cycling through regens)
				db.set(`ZynnReplies`, [reply.trim()]); //trim it AGAIN and add it to the replies array (array to cycle through)
				reply = `Zynthia: ${reply.trim()}`; //attatch a controlled 'Zynthia: '
				const prevMsg = m.reply(
					//reply to the user without the 'Zynthia:"
					reply.replaceAll('Zynthia:', '').trim()
				);
				prevMsg.then((meeg) => {
					//👍
					meeg.react('⬅');
					meeg.react('🔄');
					meeg.react('➡');
					meeg.react('▶');
					db.set(`zynnPrevMsg`, meeg.id); //grab the message id (so it can be edited either through regen or edit)
				});
				functions.limitThatShit(
					//limit the amount of lines the history array can go up to (I probably should've done it through character length instead)
					history,
					204,
					`${m.author.username}: ${args}\n${reply}\n`
				);
				db.set(`king`, m.author.id);
				db.set(`Zynnhis`, history); //update history
				db.set(
					//default + history becomes current context. the default is there so the AI doesn't forget its identity
					`Zynncon`,
					`${deefault}${history.join('')}`
				);
			})
			.catch((error) => {
				console.error('from main:', error);
			});

		// console.log(previousContext, 2);
	},
	subcommands: {}, //this'll be filled by index.js when loading subcommands
};
