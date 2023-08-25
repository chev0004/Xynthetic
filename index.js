const fs = require('fs');

require('dotenv').config();
const discord = require('discord.js');

const zynnDir = './zynthia';
const cynnDir = './cynthia';
const hiyoDir = './hiyori';
const xynnDir = './xynthia';

function loadCommands(client, directory, no) {
	//idk how to explain this
	fs.readdir(directory, (err, files) => {
		if (err) {
			console.error(`oopsies ${err}`);
			return;
		}
		//this for commands
		for (const file of files) {
			const fullPath = `${directory}/${file}`;
			if (!file.endsWith('.js') || fs.statSync(fullPath).isDirectory()) {
				if (fs.statSync(fullPath).isDirectory()) {
					loadCommands(client, fullPath, no);
				}
				continue;
			}

			const commandName = file.slice(0, -3);
			const commandModule = require(fullPath);
			client.commands.set(commandName, commandModule);
			//this for subcommands
			if (commandModule.subcommands) {
				//if the command has subcommands, add them to the main command's subcommands object
				client.commands.get(commandName).subcommands = {};
				const subcommandFiles = fs.readdirSync(
					`${directory}/subcommands/${commandName}`
				);
				for (const subcommandFile of subcommandFiles) {
					const subcommandName = subcommandFile.slice(0, -3);
					const subcommandModule = require(`${directory}/subcommands/${commandName}/${subcommandFile}`);
					client.commands.get(commandName).subcommands[
						subcommandName
					] = subcommandModule;
				}
			}
		}
	});
}

function getIntents() {
	return [
		'GUILDS',
		'GUILD_MESSAGES',
		'GUILD_MEMBERS',
		'GUILD_VOICE_STATES',
		'GUILD_EMOJIS_AND_STICKERS',
		'GUILD_MESSAGE_REACTIONS',
		'DIRECT_MESSAGES',
		'DIRECT_MESSAGE_REACTIONS',
	];
}

function crogin(token) {
	//create AND log the client in at the same time (because I have multiple bots here (hence crogin lol get it))
	const client = new discord.Client({ intents: getIntents() });
	client.on('ready', () => {
		console.log(`${client.user.tag} has awoken`);
	});
	client.login(token);
	return client;
}

const client = crogin(process.env.TOKEN);
const client2 = crogin(process.env.TOKEN2);
const client3 = crogin(process.env.TOKEN3);
const client4 = crogin(process.env.TOKEN4);

loadCommands(client, zynnDir, 1);
loadCommands(client2, cynnDir, 2);
loadCommands(client3, hiyoDir, 3);
loadCommands(client4, xynnDir, 4);

client.commands = new discord.Collection();
client2.commands = new discord.Collection();
client3.commands = new discord.Collection();
client4.commands = new discord.Collection();

function handleMessage(client) {
	//message handler (if you can't read it)
	client.on('messageCreate', async (m) => {
		try {
			if (m.author.bot) return;

			//separate the prefix and arguments, make aliases count
			const args = m.content.trim().split(/ +/);
			const command = client.commands.find((cmd) => {
				const prefixes = [cmd.runCommand, ...(cmd.aliases || [])];
				return prefixes.some((prefix) => m.content.startsWith(prefix));
			});

			if (!command) return;

			//if the command has subcommands, check for sub command aliases
			if (command.subcommands) {
				const subcommandName = args[1]?.toLowerCase(); //get the subcommand name
				if (subcommandName) {
					const subcommand = Object.values(command.subcommands).find(
						//run em
						(subcmd) =>
							subcmd.runCommand === `.${subcommandName}` ||
							(subcmd.aliases &&
								subcmd.aliases.includes(subcommandName))
					);
					if (subcommand) {
						args.splice(1, 1);
						try {
							subcommand.run(m, args);
						} catch (error) {
							console.error(error);
							m.reply(`oops`);
						}
						return;
					}
				}
			}

			try {
				command.run(m, args);
			} catch (error) {
				console.error(error);
				m.reply(`oops`);
			}
		} catch (error) {
			m.reply('something went wrong, idfk what it is');
			console.error('from index.js:', error);
		}
	});
}

async function loadEvents(client, folder) {
	//idk what thjs shit does 😭
	const events = await Promise.allSettled(
		fs
			.readdirSync(`./events/${folder}`)
			.map((file) => import(`./events/${folder}/${file}`))
	);

	for (const event of events) {
		if (event.status === 'fulfilled') {
			const { name, once, execute, codeName } = event.value.default;
			if (once) {
				client.once(name, (...args) => execute(...args));
			} else {
				client.on(name, (...args) => execute(...args));
			}
			console.log(`${folder}: ${codeName} done`);
		} else {
			console.error(`oopsies ${event.reason}`);
		}
	}
	//I didn't write this block (it was ChatGPT (I just took over))
}

loadEvents(client, 'zynthia');
loadEvents(client2, 'cynthia');
loadEvents(client3, 'hiyori');
loadEvents(client4, 'xynthia');

handleMessage(client);
handleMessage(client2);
handleMessage(client3);
handleMessage(client4);
