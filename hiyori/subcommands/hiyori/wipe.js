const { QuickDB } = require('quick.db');
const path = require('path');
const fs = require('fs');
const db = new QuickDB();

module.exports = {
	aliases: [],
	run(m) {
		const whereIsJason = path.join(__dirname, '..', '..', 'jason.json');
		const rawJason = fs.readFileSync(whereIsJason, 'utf-8');
		const cookedJason = JSON.parse(rawJason);
		const deefault = cookedJason.hiyoriDefault.join('\n');

		//reset to default and clear everything else
		db.set(`${m.author.id}-Hiyocon`, deefault);
		db.set(`${m.author.id}-Hiyohis`, '');
		db.set(`${m.author.id}-HiyoCurrRep`, '');
		db.set(`${m.author.id}-hiyoPrevMsg`, '');
		db.set(`${m.author.id}-HiyoReplies`, '');
		m.reply('memory has been reset');
		return;
	},
};
