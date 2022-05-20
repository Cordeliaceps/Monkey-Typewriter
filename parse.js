const fs = require('fs');
let quotes = fs.readFileSync('quotes.txt').toString().replaceAll(/^\/\/.+/gm, "").split("\n\n").map(x => x.trim()).filter(x => x !== "");
let output = "ABCDEF".split("").map(c =>{
    const n = String.fromCharCode(c.charCodeAt(0) + 1);
    return quotes.filter(quote => quote.indexOf(`{${c}}`) !== -1 && quote.indexOf(`{${n}}`) === -1)
})
fs.writeFileSync('out.js', "const quotes=" + JSON.stringify(output) + ";\n" + fs.readFileSync("index.js").toString())
