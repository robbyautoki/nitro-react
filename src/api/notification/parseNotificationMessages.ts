export interface ParsedNotificationMessages
{
    body: string[];
    sender: string | null;
}

const SENDER_REGEX = /^[-–—]\s*([^\r\n]{1,80})$/;

const cleanLines = (raw: string): string[] =>
{
    if(!raw) return [];

    return raw
        .replace(/\r\n|\r/g, '\n')
        .split('\n')
        .map(line => line.trimEnd())
        .filter((line, idx, arr) => !(line.length === 0 && (idx === 0 || idx === arr.length - 1)));
};

/**
 * Splits notification messages into body lines and an optional sender signature.
 * A sender signature is the LAST non-empty line if it matches "- Name", "– Name" or "— Name".
 */
export const parseNotificationMessages = (messages: string[] = []): ParsedNotificationMessages =>
{
    const flattened: string[] = [];

    for(const message of messages || [])
    {
        for(const line of cleanLines(message))
        {
            flattened.push(line);
        }
    }

    if(flattened.length === 0) return { body: [], sender: null };

    let lastIdx = flattened.length - 1;

    while(lastIdx >= 0 && flattened[lastIdx].trim().length === 0) lastIdx--;

    if(lastIdx < 0) return { body: [], sender: null };

    const candidate = flattened[lastIdx].trim();
    const match = candidate.match(SENDER_REGEX);

    if(match)
    {
        const sender = match[1].trim();

        if(sender.length > 0 && sender.length <= 80)
        {
            return {
                body: flattened.slice(0, lastIdx).filter(line => line.length > 0),
                sender,
            };
        }
    }

    return { body: flattened, sender: null };
};
