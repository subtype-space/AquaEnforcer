/**
 * @author Andrew Subowo
 * @author _subtype
 * @verison 1.0
 * HYDRATE OR DIEDRATE
 */

require('dotenv').config({ path: '.env' });
const { ActionRowBuilder } = require('@discordjs/builders');
const { Client, GatewayIntentBits, ButtonBuilder, ButtonStyle } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages ]});
const cron = require('node-cron');
const clickedUsers = new Set();

// Bank of reminder messages
// todo: separate profanity messages into a separate category so people can disable/enable it if they want to
const reminderMessages = [
    "Wow, you're drier than the Sahara! Take a water break! 🏜️",
    "Are you trying to dehydrate yourself? Drink water NOW! 💧",
    "Congratulations! You're now 99% procrastination and 1% hydration! 🎉💦",
    "I will haunt your dreams unless you drink water immediately! 😱💦",
    "I'm not asking, I'm telling you: DRINK WATER! 🥤",
    "If you don't hydrate, I'LL REVOKE YOUR KNEECAP PRIVILEGES! 🌊",
    "You better be gulping down water as if your life depends on it! 🌟",
    "Hydration isn't a choice, it's a necessity! DRINK. WATER. NOW. 🌞",
    "I'll keep reminding you until you hydrate properly! No excuses! 🌿",
    "HYDRATE OR DIEDRATE, BITCH 🎉",
    "Don't make me bring out the water hose! DRINK WATER! 🌈",
    "Are you trying to set a record for the driest person alive? DRINK WATER! 💦",
    "I bet even deserts envy your ability to stay dry. Hydrate already! 🏜️💧",
    "If your plants could talk, they'd tell you to take better care of yourself! 🌿🚰",
    "Your brain cells are begging for hydration! Do them a favor! 🧠💦",
    "Water: the elixir of life. Don't skimp on life's essentials! 🌊💧",
    "It's like you're allergic to water. Drink up, you rat! 🌈",
    "Coffee doesn't count as drinking water! 💦😅",
    "You scared of water or something? OOGA BOOGA CAVEMAN BRAIN. Drink. 🥤",
    "AHHHH! AHHHHHH! AHHHH! THAT'S YOUR BODY SCREAMING FOR WATER AHHHHHHHHHHHHHH🌟🥤",
    "THE FITNESS GRAM PACER TEST IS A MULTISTAGE AEROBIC CAPACITY TEST THAT RELIES ON YOU DRINKING WATER 💧🕶️",
    "If your skin could talk, it would say that u a dry ho' 🧖‍♀️💦"
];

const confirmMessages = [
    "HYDRATED!",
    "DRINK DONE!",
    "MISSION HYDRATION ACCOMPLISHED!",
    "WATER CONSUMED!",
    "I DID MY PART!",
    "HYDRATION LEVELS MAXED!",
    "DRANK WATER LIKE A PRO!",
    "I'M HYDRATED!",
    "QUENCH COMPLETE!",
    "HYDRATION ACHIEVED!",
    "BEEN THERE, DRANK THAT!",
    "WATER GOALS MET!",
    "DRIP DROP, DRINKED UP!",
    "WATERED UP!",
    "I'M A LITTLE QUENCH QUEEN, SHORT AND STOUT"
]

const sassyReplies = [
    "Oh, look who decided to hydrate. How groundbreaking!",
    "Wow, you managed to drink water. I'm genuinely shocked.",
    "Breaking news: someone is hydrating. Alert the media!",
    "You're drinking water? Truly revolutionary.",
    "Hold the applause, we've got a hydration expert over here.",
    "Quenching that thirst, are we? I'm awestruck.",
    "Hydration achievement unlocked: Basic Life Skills.",
    "Just when I thought nobody cared about water, you came along.",
    "The bar is on the floor, but you managed to surpass it. Impressive.",
    "Incredible! You drank water. Who would have thought?",
    "Someone give this person a medal for staying alive. Oh wait, water does that.",
    "Breaking the mold by hydrating. Keep up the mind-blowing work.",
    "Hold onto your hats, folks. We've got a water drinker among us.",
    "Mind. Blown. You're really out here drinking water like a legend.",
    "I didn't see that one coming. Bravo on the water consumption.",
    "And the award for 'Most Basic Human Function' goes to... you!",
    "Stay hydrated, you trendsetter, you."
]

// Function to send a random reminder message
function sendReminder() {
    // Reset set
    clickedUsers.clear();
    // Choose a random index from the reminderMessages array
    const randomIndexMessage = Math.floor(Math.random() * reminderMessages.length);
    const randomReminder = reminderMessages[randomIndexMessage];
    
    const randomConfirmMessageIndex = Math.floor(Math.random() * confirmMessages.length);
    const randomConfirmMessage = confirmMessages[randomConfirmMessageIndex];

    const hydrated = new ButtonBuilder()
        .setCustomId('hydrate_button')
        .setLabel(randomConfirmMessage)
        .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder()
        .addComponents(hydrated)

    client.channels.fetch(process.env.REMINDER_CHANNEL_ID).then(channel=>channel.send({ content: randomReminder, components: [row] }));
}

// TO DO
client.on('interactionCreate', async interaction => {

    if (!interaction.isButton()) return;

    if (interaction.customId === 'hydrate_button') {
        const member = interaction.member.user.username;
        const userId = interaction.member.user.id;

        if (!clickedUsers.has(userId)) {
            const randomReplyIndex = Math.floor(Math.random() * sassyReplies.length);
            const randomReply = sassyReplies[randomReplyIndex];
            await interaction.reply({ content: member + " - " + randomReply, ephemeral: false }); // this might change
            clickedUsers.add(userId);
        } else {
            await interaction.reply({ content: 'You already logged water intake today with me. Keep it up!', ephemeral: true });
        }
        
    }
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    console.log('Scheduled to send reminders every day at noon, via node-cron.');
    cron.schedule('0 12 * * *', () => {
        sendReminder();
    }, { timezone: 'America/New_York'});
});

client.login(process.env.TOKEN);