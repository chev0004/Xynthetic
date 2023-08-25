const { QuickDB } = require('quick.db');
const path = require('path');
require('dotenv').config();
const fs = require('fs');
const db = new QuickDB();
require('node-fetch');

module.exports = {
	runCommand: '.ask ',
	aliases: ['.ask'],
	async run(m, args) {
		if (
			m.content.startsWith('.ask') &&
			!m.content.startsWith('.ask ') &&
			m.content.length > 4
		) {
			return;
		}

		const prefix = this.runCommand;
		args = m.content.slice(prefix.length);

		const subcommandName = args.split(' ')[0].toLowerCase();
		const subcommandModule = this.subcommands[subcommandName];

		if (subcommandModule) {
			subcommandModule.run(m, args);
			return;
		}
		await m.channel.sendTyping();
		if (!args) {
			args = '{ continue }';
		}
		args = `{ ${m.content.slice(prefix.length)} }`;

		const whereIsJason = path.join(__dirname, 'jason.json');
		const rawJason = fs.readFileSync(whereIsJason, 'utf-8');
		const cookedJason = JSON.parse(rawJason);

		let previousContext = await db.get(`${m.author.id}-Kayconn`);
		if (!previousContext) {
			previousContext = '';
		}
		previousContext = previousContext.substring(
			previousContext.length - 15000
		);

		const apiUrl = 'https://api.novelai.net/ai/generate';
		const text = `${previousContext}\n${args}\n`;

		const parameters = cookedJason.kayraParams;
		const functions = require(path.join(__dirname, 'functions.js'));
		const objects = require(path.join(__dirname, 'objects.js'));

		const requestOptions = objects.requestOptions(
			text,
			parameters,
			process.env.NAIKEY
		);

		functions
			.neverGiveUpExceptAfterFailingTwice(apiUrl, requestOptions) //the function in question:
			.then((data) => {
				let reply = data.output
					.replaceAll('{', '')
					.replaceAll('}', '')
					.trim();
				if (data == '') {
					console.log(true);
				} else {
					console.log(false);
				}
				db.set(`${m.author.id}-Kayconn`, `${text}\n${reply}\n`);
				m.reply(reply);
			})
			.catch((error) => {
				console.error('oops (from ask.js)', error);
			});

		// console.log(previousContext, 2);
	},
	subcommands: {},
};
