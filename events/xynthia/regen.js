const { QuickDB } = require('quick.db');
const path = require('path');
require('dotenv').config();
const fs = require('fs');
const db = new QuickDB();
require('node-fetch');

module.exports = {
	name: 'messageReactionAdd',
	async execute(reaction, mf) {
		if (mf.bot || reaction.emoji.name != '🔄') return; //このボタンのみ
		const m = reaction.message;
		const prevMsg = await db.get(`${mf.id}-xynnPrevMsg`);
		if (m != prevMsg) return;
		let logs = await db.get(`${mf.id}-Xynnhis`);
		if (!logs) return;

		m.channel.messages
			.fetch(prevMsg)
			.then((msg) => msg.edit('you wait...')); //yo uwait

		let previousContext = await db.get(`${mf.id}-Xynncon`);
		if (!previousContext) {
			m.reply('you have no previous conversations'); //go away
			return;
		}

		const lines = logs //thank you bronzdragon from Discord
			.join('') // Join them together
			.split('\n') // split by newlines
			.map((line) => line.trim()) // Trim any whitespace off
			.filter((line) => line.length > 0) // Discard any empty lines
			.map((line) => line + '\n'); // ... and add a newlines to each line.

		let e = previousContext.split('\n');
		e[e.length - 2] = 'Xynthia: '; //replace the last line with 'Xynthia: ' so the AI continues from there. other than that, everything here is pretty much the same as a normal generation (I will not re-comment what each step does for a second time. go to xynthia.js instead if you want to read comments)
		const text = e;
		const apiUrl = 'https://api.novelai.net/ai/generate';

		const functions = require(path.join(
			__dirname,
			'..',
			'..',
			'xynthia',
			'functions.js'
		));

		const whereIsJason = path.join(
			__dirname,
			'..',
			'..',
			'xynthia',
			'jason.json'
		);

		const objects = require(path.join(
			__dirname,
			'..',
			'..',
			'xynthia',
			'objects.js'
		));

		const rawJason = fs.readFileSync(whereIsJason, 'utf-8');
		const cookedJason = JSON.parse(rawJason);
		const deefault = cookedJason.xynthiaDefault.join('\n');
		const parameters = cookedJason.xynnParams;

		const requestOptions = objects.requestOptions(
			text.join('\n').trimRight(),
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
			.then(async (data) => {
				let reply = data.output.trim();
				reply = reply.replace(/(\w+):/g, '');
				if (reply.includes('\n')) {
					const replyLines = reply.split('\n');
					const firstLine = replyLines[0].trim();
					if (firstLine === '') {
						reply = replyLines[1].trim();
					} else {
						reply = firstLine;
					}
				}

				let replies = await db.get(`${mf.id}-XynnReplies`);
				replies.push(reply);
				db.set(`${mf.id}-XynnCurrRep`, reply);
				db.set(`${mf.id}-XynnReplies`, replies);

				m.channel.messages
					.fetch(prevMsg)
					.then((msg) => msg.edit(reply));

				lines[lines.length - 1] = `Xynthia: ${reply.trim()}\n`;

				db.set(`${mf.id}-Xynnhis`, lines);
				db.set(`${mf.id}-Xynncon`, `${deefault}\n${lines.join('')}`);
			})
			.catch((error) => {
				console.error('from regen:', error);
			});
	},
	codeName: 'regen',
};
