const { QuickDB } = require('quick.db');
const path = require('path');
require('dotenv').config();
const fs = require('fs');
const db = new QuickDB();
require('node-fetch');

module.exports = {
	aliases: ['regenerate'],
	async run(m) {
		let previousContext = await db.get(`${m.author.id}-Xynncon`);
		if (!previousContext) {
			m.reply('you have no previous conversations');
			return;
		}

		await m.channel.sendTyping();
		let logs = await db.get(`${m.author.id}-Xynnhis`);
		const previousMessage = await db.get(`${m.author.id}-xynnPrevMsg`);

		const lines = logs //thank you bronzdragon from Discord
			.join('') // Join them together
			.split('\n') // split by newlines
			.map((line) => line.trim()) // Trim any whitespace off
			.filter((line) => line.length > 0) // Discard any empty lines
			.map((line) => line + '\n'); // ... and add a newlines to each line.

		let e = previousContext.split('\n');
		e[e.length - 2] = 'Xynthia: ';
		const text = e;
		const apiUrl = 'https://api.novelai.net/ai/generate';

		const whereIsJason = path.join(__dirname, '..', '..', 'jason.json');
		const rawJason = fs.readFileSync(whereIsJason, 'utf-8');
		const cookedJason = JSON.parse(rawJason);
		const deefault = cookedJason.xynthiaDefault.join('\n');

		const parameters = cookedJason.xynnParams;

		const requestOptions = {
			method: 'POST',
			headers: {
				accept: 'application/json',
				'Content-Type': 'application/json',
				Authorization: 'Bearer ' + process.env.NAIKEY,
			},
			body: JSON.stringify({
				input: text.join('\n').trimRight(),
				model: 'kayra-v1',
				parameters: parameters,
			}),
		};

		async function reqAndRetry( //send request and retry if it fails
			url,
			requestOptions,
			retries = 2,
			cooldown = 5000
		) {
			return fetch(url, requestOptions)
				.then((response) => response.json())
				.catch((error) => {
					if (retries > 0) {
						m.reply(
							"my stupidass couldn't fetch data from the API. just send that again without changes"
						);
						console.log(
							`trying again... stopping until ${retries} more`
						);
						setTimeout(
							() => reqAndRetry(url, requestOptions, retries - 1),
							cooldown
						);
						return;
					} else {
						console.error(error);
						m.reply(
							"my stupidass couldn't fetch data from the API. just send that again without changes"
						);
						throw new Error('zamn bro fix yo shit!'); //fix yo shit
					}
				});
		}

		reqAndRetry(apiUrl, requestOptions) //the function in question:
			.then((data) => {
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

				m.channel.messages
					.fetch(previousMessage)
					.then((msg) => msg.edit(reply));

				lines[lines.length - 1] = `Xynthia: ${reply.trim()}\n`;

				db.set(`${m.author.id}-Xynnhis`, lines);
				db.set(
					`${m.author.id}-Xynncon`,
					`${deefault}${lines.join('')}`
				);
			})
			.catch((error) => {
				console.error('from regen:', error);
			});
	},
};
