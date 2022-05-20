// Call with the arguments: applicationid, botToken
// As of node 17, you have to run with --experimental-fetch
const [
    _,
    __,
    applicationId,
    botToken
] = process.argv;
fetch(`https://discord.com/api/v9/applications/${applicationId}/commands`, {
    headers: {
        "Content-Type": "application/json",
        "Authorization": `Bot ${botToken}`
    },
    method: "POST",
    body: JSON.stringify({
        name: "iquote",
        description: "Generate an incorrect quote",
        options: "abcdef".split("").map(l => ({
            type: 3,
            name: `person_${l}`,
            description: `Person ${l}`,
            required: l === "A"
        }))
    })
}).then(x => x.text()).then(x => console.log(x))