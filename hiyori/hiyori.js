const { QuickDB } = require('quick.db');
const path = require('path');
require('dotenv').config();
const fs = require('fs');
const db = new QuickDB();
require('node-fetch');

module.exports = {
	runCommand: '.h ',
	aliases: ['・', '.h'],
	async run(m, args) {
		if (
			//make it so you that can type '.h' and '.h ' to trigger the bot, but not something like '.ha'
			m.content.startsWith('.h') &&
			!m.content.startsWith('.h ') &&
			m.content.length > 2
		) {
			return;
		}

		const prefix = this.runCommand;
		if (m.content.startsWith('・')) {
			args = m.content.slice(1);
		} else {
			args = m.content.slice(prefix.length);
		}
		//remove the prefix from the content so you (I) get the arguments

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
		const deefault = cookedJason.hiyoriDefault.join('\n');

		//find each of these or replace with either default or an empty array if nothing is found
		let previousContext =
			(await db.get(`${m.author.id}-Hiyocon`)) || deefault;
		let history = (await db.get(`${m.author.id}-Hiyohis`)) || [];

		if (!args || m.content == '・') {
			//if user triggers the bot through '.h' or '・', make this the args (for when you don't want to speak)
			args = '（（ユーザが無言にした、普通に話し続けて）';
		}

		const apiUrl = 'https://api.novelai.net/ai/generate';
		const text = `${previousContext}\n${m.author.username}: ${args}\n`; //attach name to dialogue so the AI doesn't get confused about who's talking

		//some declarations
		const parameters = cookedJason.hiyoParams;
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
				let reply = data.output.replaceAll('Hiyori:', '').trim(); //trim and remove any 'Hiyori:'s just to be sure
				db.set(`${m.author.id}-HiyoCurrRep`, reply.trim()); //trim reply and set it as the current reply (for cycling through regens)
				db.set(`${m.author.id}-HiyoReplies`, [reply.trim()]); //trim it AGAIN and add it to the replies array (array to cycle through)
				reply = `Hiyori: ${reply.trim()}`; //attatch a controlled 'Hiyori: '
				const prevMsg = m.reply(
					//reply to the user without the 'Hiyori:"
					reply.replaceAll('Hiyori:', '').trim()
				);
				prevMsg.then((meeg) => {
					//👍
					meeg.react('⬅');
					meeg.react('🔄');
					meeg.react('➡');
					meeg.react('▶');
					db.set(`${m.author.id}-hiyoPrevMsg`, meeg.id); //grab the message id (so it can be edited either through regen or edit)
				});
				functions.limitThatShit(
					//limit the amount of lines the history array can go up to (I probably should've done it through character length instead)
					history,
					204,
					`${m.author.username}: ${args}\n${reply}\n`
				);
				db.set(`${m.author.id}-Hiyohis`, history); //update history
				db.set(
					//default + history becomes current context. the default is there so the AI doesn't forget its identity
					`${m.author.id}-Hiyocon`,
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
