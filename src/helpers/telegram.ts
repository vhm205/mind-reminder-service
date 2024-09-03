export function convertMarkdownToTelegramFormat(markdownText: string): string {
  // Replace headers (e.g. # Heading) with bold text
  markdownText = markdownText.replace(/^(#+) (.*)$/gm, (match, p1, p2) => {
    return `<b>${p2}</b>`;
  });

  // Replace bold text (e.g. **bold**) with Telegram's bold syntax
  markdownText = markdownText.replace(/\*\*(.*?)\*\*/g, (match, p1) => {
    return `<b>${p1}</b>`;
  });

  // Replace italic text (e.g. *italic*) with Telegram's italic syntax
  markdownText = markdownText.replace(/\*(.*?)\*/g, (match, p1) => {
    return `<i>${p1}</i>`;
  });

  // Replace strikethrough text (e.g. ~~strikethrough~~) with Telegram's strikethrough syntax
  markdownText = markdownText.replace(/~~(.*?)~~/g, (match, p1) => {
    return `<s>${p1}</s>`;
  });

  // Replace inline code (e.g. `code`) with Telegram's code syntax
  markdownText = markdownText.replace(/`(.*?)`/g, (match, p1) => {
    return `<code>${p1}</code>`;
  });

  // Replace links (e.g. [text](url)) with Telegram's link syntax
  markdownText = markdownText.replace(
    /\[(.*?)\]\((.*?)\)/g,
    (match, p1, p2) => {
      return `<a href="${p2}">${p1}</a>`;
    },
  );

  return markdownText;
}

/**
 * Escapes special characters in Markdown text according to Telegram formatting rules.
 * @param {string} text - The input Markdown text to convert.
 * @returns {string} - The converted text with Telegram-compatible formatting.
 */
export function escapeTelegramMarkdown(markdown: string): string {
  function escapeCharacter(char: string): string {
    return '\\' + char;
  }

  function escapeSpecialCharacters(text: string): string {
    const specialChars = /([_*[\]()~`>#+\-=|{}.!])/g;
    return text.replace(specialChars, escapeCharacter);
  }

  function escapePreAndCodeEntities(text: string): string {
    const preCodePattern = /(```[\s\S]*?```|`[^`]*`)/g;
    return text.replace(preCodePattern, (match) => {
      return match.replace(/([`\\])/g, escapeCharacter);
    });
  }

  function escapeInlineLinkAndEmoji(text: string): string {
    const inlineLinkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    return text.replace(inlineLinkPattern, (match, p1, p2) => {
      const escapedP2 = p2.replace(/[)\\]/g, escapeCharacter);
      return `[${p1}](${escapedP2})`;
    });
  }

  function reduceMarks(text: string): string {
    text = text.replace(/\*{2,}/g, '*');
    text = text.replace(/\#{2,}/g, '#');
    return text;
  }

  // Step 1: Reduce sequences of 3 or more * marks to a single mark
  let result = reduceMarks(markdown);

  // Step 2: Escape pre and code entities
  result = escapePreAndCodeEntities(result);

  // Step 3: Escape inline links and custom emoji definitions
  result = escapeInlineLinkAndEmoji(result);

  // Step 4: Escape all other special characters
  result = escapeSpecialCharacters(result);

  // Step 5: Handle ambiguity between italic and underline entities
  result = result.replace(/___/g, '__\\_');

  return result;
}
