const { QuickDB } = require('quick.db');
const path = require('path');
require('dotenv').config();
const fs = require('fs');
const db = new QuickDB();
require('node-fetch');

module.exports = {
	name: 'messageReactionAdd',
	async execute(reaction, mf) {
		if (mf.bot || reaction.emoji.name != '▶') return;
		const m = reaction.message;
		const prevMsg = await db.get(`${mf.id}-cynnPrevMsg`);
		if (m != prevMsg) return;
		let logs = await db.get(`${mf.id}-Cynnhis`);
		if (!logs) return;

		const orig = m.content; //mark original content

		m.channel.messages
			.fetch(prevMsg)
			.then((msg) => msg.edit('you wait...')); //you wait.

		let lines = logs //thank you bronzdragon from Discord
			.join('') // Join them together
			.split('\n') // split by newlines
			.map((line) => line.trim()) // Trim any whitespace off
			.filter((line) => line.length > 0) // Discard any empty lines
			.map((line) => line + '\n'); // ... and add a newlines to each line.

		const apiUrl = 'https://api.novelai.net/ai/generate';

		const functions = require(path.join(
			__dirname,
			'..',
			'..',
			'cynthia',
			'functions.js'
		));

		const whereIsJason = path.join(
			__dirname,
			'..',
			'..',
			'cynthia',
			'jason.json'
		);

		const objects = require(path.join(
			__dirname,
			'..',
			'..',
			'cynthia',
			'objects.js'
		));

		const rawJason = fs.readFileSync(whereIsJason, 'utf-8');
		const cookedJason = JSON.parse(rawJason);
		const deefault = cookedJason.cynthiaDefault.join('\n');
		const parameters = cookedJason.cynnParams;

		lines[lines.length - 1] = orig; //use orig instead of m.content because it's 'you wait...' now
		let text = `${deefault}\n${lines.join('').trimRight()}`; //format it so that the AI continues right where it stopped

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
			.then(async (data) => {
				let reply = data.output;
				reply = reply.replace(/(\w+):/g, '');
				let replies = await db.get(`${mf.id}-CynnReplies`);
				const continuation = `${orig}${reply}`;
				replies.push(continuation);
				db.set(`${mf.id}-CynnCurrRep`, continuation);
				db.set(`${mf.id}-CynnReplies`, replies);

				m.channel.messages
					.fetch(prevMsg)
					.then((msg) => msg.edit(continuation));

				lines[lines.length - 1] = `Cynthia: ${lines[
					lines.length - 1
				].trimRight()}${reply}\n`;

				db.set(`${mf.id}-Cynnhis`, lines);
				db.set(`${mf.id}-Cynncon`, `${deefault}\n${lines.join('')}`);
			})
			.catch((error) => {
				console.error('from continue:', error);
			});
	},
	codeName: 'continue',
};
