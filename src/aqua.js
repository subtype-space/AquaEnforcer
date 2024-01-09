/**
 * @author Andrew Subowo
 * @author _subtype
 * @verison 2.0
 * HYDRATE OR DIEDRATE
 */

require('dotenv').config({ path: '.env' });
const { ActionRowBuilder } = require('@discordjs/builders');
const { Client, GatewayIntentBits, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Client:PGClient } = require('pg');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages ]});
const pgclient = new PGClient ({
    user: process.env.POSTGRES_USER,
    host: 'ae-db',
    database: process.env.POSTGRES_DB,
    port: process.env.POSTGRES_PORT,
    password: process.env.POSTGRES_PASSWORD
})
const cron = require('node-cron');


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

// Array of confirm text for the button
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

// Array of replies to send when a user confirms they've hydrated for the day
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

/**
 * Function to reset a streak
 * @param {String} userId The userId (represented as a string) to reset
 */
async function resetStreak(userId) {
    try {
        // Reset streak count to 0
        const resetStreakQuery = 'UPDATE user_streaks SET streak_count = 0 WHERE user_id = $1';
        await pgclient.query(resetStreakQuery, [userId]);
    } catch (error) {
        console.error('Error resetting streak:', error);
    }
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    console.log('Scheduled to send reminders every day at noon, via node-cron.');
    cron.schedule('0 12 * * *', () => {
        sendReminder();
    }, { timezone: 'America/New_York'});
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'hydrate_button') {
        const member = interaction.member.user.username;
        const userId = interaction.member.user.id;

        // Query to check if the user clicked today
        const today = new Date().toISOString().split('T')[0]; // Get today's date
        const checkClickQuery = 'SELECT * FROM user_clicks WHERE user_id = $1 AND click_date = $2';
        
        try {
            const result = await pgclient.query(checkClickQuery, [userId, today]);
            
            if (result.rows.length > 0) {
                // User has already clicked today
                await interaction.reply({ content: 'You already logged water intake today with me. Keep it up!', ephemeral: true });
            } else {
                // Query to increment the streak count or initialize it if it doesn't exist
                const updateStreakQuery = `
                    INSERT INTO user_streaks (user_id, streak_count)
                    VALUES ($1, 1)
                    ON CONFLICT (user_id)
                    DO UPDATE SET streak_count = user_streaks.streak_count + 1
                    RETURNING streak_count;
                `;

                const updateClickQuery = 'INSERT INTO user_clicks (user_id, click_date) VALUES ($1, $2)';
                
                const streakResult = await pgclient.query(updateStreakQuery, [userId]);
                const updatedStreakCount = streakResult.rows[0].streak_count;
                const lastLogDate = new Date(streakResult.rows[0].last_log_date);
    
                const previousDay = new Date();
                previousDay.setDate(previousDay.getDate() - 1);
    
                if (lastLogDate < previousDay) {
                    // If last log was more than 1 day ago, reset streak to 0
                    await resetStreak();
                }

                await pgclient.query(updateClickQuery, [userId, today]);
                const randomReplyIndex = Math.floor(Math.random() * sassyReplies.length);
                const randomReply = sassyReplies[randomReplyIndex];
                await interaction.reply({ content: member + " - " + randomReply + "\n" + updatedStreakCount + " days hydrated in a row! 🥤🚰💧", ephemeral: false }); // this might change
            }
        } catch (error) {
            console.error('Error handling button click:', error);
        }
    }
});

client.login(process.env.TOKEN);
pgclient.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.error('Error connecting to PostgreSQL', err));

