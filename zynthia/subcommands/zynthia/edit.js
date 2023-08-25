const { QuickDB } = require('quick.db');
const path = require('path');
const fs = require('fs');
const db = new QuickDB();

module.exports = {
	async run(m, args) {
		const edit = args.slice(5);
		const previousMessage = await db.get(`zynnPrevMsg`);
		const king = await db.get(`king`);
		if (m.author.id != king) return;

		m.channel.messages.fetch(previousMessage).then((msg) => msg.edit(edit)); //edit the message into whatever the user wanted

		let previousContext = await db.get(`Zynnhis`);
		if (!previousContext) {
			//go awawy
			m.reply('you have no previous conversations');
			return;
		}

		const whereIsJason = path.join(__dirname, '..', '..', 'jason.json');
		const rawJason = fs.readFileSync(whereIsJason, 'utf-8');
		const cookedJason = JSON.parse(rawJason);
		const deefault = cookedJason.zynthiaDefault.join('\n');

		let logs = previousContext;
		let lines = logs //thank you bronzdragon from Discord
			.join('') // Join them together
			.split('\n') // split by newlines
			.map((line) => line.trim()) // Trim any whitespace off
			.filter((line) => line.length > 0) // Discard any empty lines
			.map((line) => line + '\n'); // ... and add a newlines to each line.
		lines[lines.length - 1] = `Zynthia: ${edit}\n`; //replace the last line with the edit

		let replies = await db.get(`ZynnReplies`);
		replies.push(edit); //add the edit to the replies array (so you can undo it, or cycle through regens)
		db.set(`Zynnhis`, lines); //update history
		db.set(`ZynnCurrRep`, edit); //mark the new edit as the currently displayed reply
		db.set(`ZynnReplies`, replies); //update replies
		db.set(`Zynncon`, `${deefault}\n${lines.join('')}\n`); //update context
	},
};
