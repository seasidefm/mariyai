const serverUrl = 'http://localhost:5000' // Example URL, change accordingly

const args = {
    user: 'your_username_here', // Replace with the desired username
    tags: {
        color: '#00FF00', // Replace with the desired color
    },
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function sendWebSocketMessages(numberOfMessages: number) {
    try {
        for (const pair of Array(numberOfMessages).fill(0).entries()) {
            const index = pair[0]
            console.log(
                `Sending message ${index + 1} of ${numberOfMessages}...`,
            )
            await fetch(serverUrl + '/spawn-test')

            // wait for random amount of time between 0 and 2 seconds
            const randomTime = Math.floor(Math.random() * 2000)
            console.log(`Waiting for ${randomTime} ms...`)
            await sleep(randomTime)
        }
    } catch (error) {
        console.error('An error occurred:', error)
    }
}

// Read the number of messages from the command-line argument
const numberOfMessagesArg = process.argv[2]
const numberOfMessages = parseInt(numberOfMessagesArg)

if (isNaN(numberOfMessages) || numberOfMessages <= 0) {
    console.error(
        'Please provide a valid positive integer as a command-line argument.',
    )
} else {
    console.log(`Sending ${numberOfMessages} messages to the server...`)
    sendWebSocketMessages(numberOfMessages)
}
