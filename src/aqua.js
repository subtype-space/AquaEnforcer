/**
 * @author Andrew Subowo
 * @author _subtype
 * @verison 2.0
 * HYDRATE OR DIEDRATE
 */

require("dotenv").config({ path: ".env" })
const { ActionRowBuilder } = require("@discordjs/builders")
const {
  Client,
  GatewayIntentBits,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js")
const { Client: PGClient } = require("pg")
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
})
const pgclient = new PGClient({
  user: process.env.POSTGRES_USER,
  host: "ae-db",
  database: process.env.POSTGRES_DB,
  port: process.env.POSTGRES_PORT,
  password: process.env.POSTGRES_PASSWORD,
})
// node-cron uses your
const cron = require("node-cron")

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
  "If your skin could talk, it would say that u a dry ho' 🧖‍♀️💦",
]

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
  "I'M A LITTLE QUENCH QUEEN, SHORT AND STOUT",
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
  "Stay hydrated, you trendsetter, you.",
]

// Function to send a random reminder message
function sendReminder() {
  const currTime = new Date()
  console.log("Current hour is " + currTime.getHours())

  // Choose a random index from the reminderMessages array
  const randomIndexMessage = Math.floor(Math.random() * reminderMessages.length)
  const randomReminder = reminderMessages[randomIndexMessage]

  const randomConfirmMessageIndex = Math.floor(
    Math.random() * confirmMessages.length
  )
  const randomConfirmMessage = confirmMessages[randomConfirmMessageIndex]

  const hydrated = new ButtonBuilder()
    .setCustomId("hydrate_button")
    .setLabel(randomConfirmMessage)
    .setStyle(ButtonStyle.Success)

  const row = new ActionRowBuilder().addComponents(hydrated)

  client.channels
    .fetch(process.env.REMINDER_CHANNEL_ID)
    .then((channel) =>
      channel.send({ content: randomReminder, components: [row] })
    )
}

/**
 * Function to reset a streak
 * @param { String } userId The userId (represented as a string) to reset
 */
async function resetStreak(userId) {
  try {
    // Reset streak count to 0
    const resetStreakQuery =
      "UPDATE user_streak_count SET streak_count = 0 WHERE user_id = $1;"
    await pgclient.query(resetStreakQuery, [userId])
  } catch (error) {
    console.error("Error resetting streak:", error)
  }
}

/**
 *
 * @param { import('discord.js').Interaction } interaction The Discord interaction object
 * @param { String } userId The userId (represented as a string) to reset
 * @param { Date } checkIn The checkIn time represented as a Date
 */
async function updateStreakAndTime(interaction, userId, checkIn) {
  const member = interaction.member.user.username
  console.log("Updating streak and last log time for " + member)

  const updateStreakQuery = `
    INSERT INTO user_streak_count (user_id, streak_count)
    VALUES ($1, 1)
    ON CONFLICT (user_id)
    DO UPDATE SET streak_count = user_streak_count.streak_count + 1
    RETURNING streak_count;
    `
  // Update a user's streak
  const streakResult = await pgclient.query(updateStreakQuery, [userId])
  const updatedStreakCount = streakResult.rows[0].streak_count
  console.log("Streak updated to " + updatedStreakCount)

  console.log("Updating last log date to " + checkIn)

  const updateClickQuery = `
      INSERT INTO user_streak_date (user_id, click_date)
      VALUES ($1, $2)
      ON CONFLICT (user_id)
      DO UPDATE SET click_date = EXCLUDED.click_date;
    `

  await pgclient.query(updateClickQuery, [userId, checkIn])

  const randomReplyIndex = Math.floor(Math.random() * sassyReplies.length)
  const randomReply = sassyReplies[randomReplyIndex]

  await interaction.reply({
    content:
      member +
      " - " +
      randomReply +
      "\n" +
      updatedStreakCount +
      " days hydrated in a row! 🥤🚰💧",
    ephemeral: false,
  }) // this might change
}

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`)
  console.log(
    "Scheduled to send reminders every day at 2PM given your system timezone, via node-cron."
  )
  cron.schedule("0 14 * * *", () => {
    sendReminder()
  })
})

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return

  if (interaction.customId === "hydrate_button") {
    const member = interaction.member.user.username
    const userId = interaction.member.user.id
    const checkIn = new Date() // Get current date and time
    const yesterdayDate = new Date()
    yesterdayDate.setDate(checkIn.getDate() - 1)

    const checkClickQuery =
      "SELECT click_date AS last_click_date FROM user_streak_date WHERE user_id = $1;"

    try {
      const lastClickResult = await pgclient.query(checkClickQuery, [userId])
      const lastClickRow = lastClickResult.rows[0]
      const lastClickDate = lastClickRow?.last_click_date

      // If this is a brand new user with no row in user_streak_date yet
      if (!lastClickDate) {
        console.log("New user logging, creating new entry")
        await updateStreakAndTime(interaction, userId, checkIn)
        return
      }

      const lastClickTime = new Date(lastClickDate)
      console.log("Timestamp:" + checkIn)
      console.log(
        `Last click time for ${member}: ${lastClickTime.toDateString()} | yesterday is ${yesterdayDate.toDateString()}`
      )

      if (lastClickTime.toDateString() === checkIn.toDateString()) {
        await interaction.reply({
          content: "You already logged water intake today with me. Keep it up!",
          ephemeral: true,
        })
      } else if (
        lastClickTime.toDateString() === yesterdayDate.toDateString()
      ) {
        console.log("Last click was yesterday, updating to today")
        await updateStreakAndTime(interaction, userId, checkIn)
      } else {
        console.log("Resetting streak")
        await resetStreak(userId)
        await updateStreakAndTime(interaction, userId, checkIn)
      }
    } catch (error) {
      console.error("Error handling button click:", error)
    }
  }
})

client.login(process.env.TOKEN)
pgclient
  .connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch((err) => console.error("Error connecting to PostgreSQL", err))
