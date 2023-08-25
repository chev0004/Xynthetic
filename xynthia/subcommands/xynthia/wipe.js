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
		const deefault = cookedJason.xynthiaDefault.join('\n');

		//reset to default and clear everything else
		db.set(`${m.author.id}-Xynncon`, deefault);
		db.set(`${m.author.id}-Xynnhis`, '');
		db.set(`${m.author.id}-XynnCurrRep`, '');
		db.set(`${m.author.id}-xynnPrevMsg`, '');
		db.set(`${m.author.id}-XynnReplies`, '');
		m.reply('memory has been reset');
		return;
	},
};
