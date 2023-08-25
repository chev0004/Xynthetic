const { QuickDB } = require('quick.db');
const path = require('path');
const fs = require('fs');
const db = new QuickDB();

module.exports = {
	async run(m, args) {
		const edit = args.slice(5);
		const previousMessage = await db.get(`${m.author.id}-cynnPrevMsg`);

		m.channel.messages.fetch(previousMessage).then((msg) => msg.edit(edit)); //edit the message into whatever the user wanted

		let previousContext = await db.get(`${m.author.id}-Cynnhis`);
		if (!previousContext) {
			//go awawy
			m.reply('you have no previous conversations');
			return;
		}

		const whereIsJason = path.join(__dirname, '..', '..', 'jason.json');
		const rawJason = fs.readFileSync(whereIsJason, 'utf-8');
		const cookedJason = JSON.parse(rawJason);
		const deefault = cookedJason.cynthiaDefault.join('\n');

		let logs = previousContext;
		let lines = logs //thank you bronzdragon from Discord
			.join('') // Join them together
			.split('\n') // split by newlines
			.map((line) => line.trim()) // Trim any whitespace off
			.filter((line) => line.length > 0) // Discard any empty lines
			.map((line) => line + '\n'); // ... and add a newlines to each line.
		lines[lines.length - 1] = `Cynthia: ${edit}\n`; //replace the last line with the edit

		let replies = await db.get(`${m.author.id}-CynnReplies`);
		replies.push(edit); //add the edit to the replies array (so you can undo it, or cycle through regens)
		db.set(`${m.author.id}-Cynnhis`, lines); //update history
		db.set(`${m.author.id}-CynnCurrRep`, edit); //mark the new edit as the currently displayed reply
		db.set(`${m.author.id}-CynnReplies`, replies); //update replies
		db.set(`${m.author.id}-Cynncon`, `${deefault}\n${lines.join('')}\n`); //update context
	},
};
