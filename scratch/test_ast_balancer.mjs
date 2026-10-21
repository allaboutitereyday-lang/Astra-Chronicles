function balanceMarkdownAsterisks(text) {
  if (!text) return "";

  const lines = text.split("\n");
  const repairedLines = lines.map((line) => {
    let l = line.trimEnd();
    if (!l) return l;

    const quoteIndex = l.indexOf('"');
    if (quoteIndex > 0) {
      const beforeQuote = l.slice(0, quoteIndex);
      const asteriskCountBefore = (beforeQuote.match(/\*/g) || []).length;
      if (asteriskCountBefore % 2 !== 0) {
        const trimmedBefore = beforeQuote.trimEnd();
        l = `${trimmedBefore}* ${l.slice(quoteIndex)}`;
      }
    }

    const boldMatches = l.match(/\*\*/g);
    const boldCount = boldMatches ? boldMatches.length : 0;
    if (boldCount % 2 !== 0) {
      l = `${l}**`;
    }

    const temp = l.replace(/\*\*/g, "\uE000");
    const italicMatches = temp.match(/\*/g);
    const italicCount = italicMatches ? italicMatches.length : 0;
    if (italicCount % 2 !== 0) {
      l = `${l}*`;
    }

    return l;
  });

  return repairedLines.join("\n");
}

console.log("Test A:", balanceMarkdownAsterisks('*Perci swallows hard and takes a step back. "Leave me alone."'));
console.log("Test B:", balanceMarkdownAsterisks('*She raises her dagger.* "Stay away!"'));

