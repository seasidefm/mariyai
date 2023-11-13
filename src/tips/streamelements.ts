interface TipAmount {
    subEquivalency: number
    username: string
}

export function matchStreamElementsTip(username: string, message: string) {
    if (username.toLowerCase() !== 'streamelements') {
        return null
    }

    // Define a simplified regular expression pattern to match the username, currency, and amount
    const pattern = /(\w+) just tipped (\$[\d.]+) /

    // Use the `exec` method to match the pattern and capture groups
    const match = pattern.exec(message)

    if (match) {
        const username = match[1] // Extract the username
        const currencyWithAmount = match[2] // Extract the currency with amount
        const amount = parseFloat(currencyWithAmount.slice(1)) // Parse the amount as a float

        return {
            subEquivalency: amount / 5,
            username,
        }
    } else {
        console.log(
            'StreamElements message does not match donation pattern. Ignoring!',
        )
    }
}
