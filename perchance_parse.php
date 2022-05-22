<?php
// Attempt parse the absolute clusterfuck that is https://perchance.org/incorrect-quote-generator
// https://www.youtube.com/watch?v=GeNey4E7wBU&t=8s

// Okay so the quotes are stored right in the HTML that makes sense
// And we gotta parse the DOM document
$dom = new DOMDocument();
// Oh remember PHP shits itself if you give it a bad HTML document, which this document is
@libxml_use_internal_errors(true);
$dom->loadHTMLFile("https://perchance.org/incorrect-quote-generator");

// It's in the #preloaded-generator-data element which is a... script???  With type "notjs" (what the living hell)
$data = $dom->getElementById("preloaded-generator-data")->textContent;

// And it's.  Url encoded.  Why.  Who knows
$data = urldecode($data);
// And then json encoded.  What.
$data = json_decode($data, true)["modelText"];

// So all the quotes are in little lists because now we're in the Perforce language but we can just regex them all
preg_match_all("/ {6}<b>.+/m", $data, $quotes);
[$quotes] = $quotes; // hmm php pattern matching is fun
//file_put_contents(__DIR__ . "/perchance_orig.txt", implode("\n", $quotes)); // debug
$quotes = array_map(function(string $quote): string {
    $replacements = [
        "<br>" => "\n",
        "<b>" => "**",
        "</b>" => "**",
        "<i>" => "*",
        "</i>" => "*",
    ];
    // Alright so first take care of the html elements
    $quote = str_replace(array_keys($replacements), array_values($replacements), $quote);
    // Now we gotta trim the lines because there's whitespace everywhere
    $quote = implode("\n", array_map(trim(...), explode("\n", $quote)));
    $existing = [];
    // Now to deal with the absolute clusterfuckery that is the [] elements
    $quote = preg_replace_callback("/\[([^]]+)]/m", function(array $x) use(&$existing) {
        [$_, $pattern] = $x;
        // Figure out which number it's referring to by selecting the first digit character
        // This works.  Source: trust me bro
        preg_match("/[0-9]/", $pattern, $matches);
        $i = $matches[0] ?? null;
        if(!is_null($i)) {
            $i = intval($i);
        } else {
            // Adds a new, not previously seen person
            for($i = 1; in_array($i, $existing); $i++) ; // continue until $i is not in_array
        }
        // Add it to the existing array
        $existing[] = $i;
        return "{" . chr(ord("A") + $i - 1) . "}";
    }, $quote);
    // Oh they bolded the names, fuck that
    $quote = preg_replace_callback("/\*\*([^*]+:)\*\*/", function (array $x) {
        return $x[1];
    }, $quote);
    return $quote;
}, $quotes);
echo implode("\n\n", $quotes);