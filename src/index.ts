/// <reference path="./refs"/>

import natural = require("natural");
import types = require("node-author-intrusion");

export interface NodeAuthorIntrusionSplitOptions {
    /**
     * Indicates the type of tokenizer to use while splitting the lines. The
     * acceptable values are "treebank" (default), "word", and "aggressive"
     * which correspond to the natural.js tokenizers.
     */
    tokenizer?: string;

    /**
     * Indicates the stemmer to use. If this is non-null and non-undefined,
     * the resulting tokens will have the "stem" property set using the given
     * stemmer. The acceptable values are "porter" (default) and "lancaster".
     */
    stemmer?: string;

    /**
     * A collection of operations that are applied to the original token text
     * to create a normalized version. If this is missing, then the original
     * text is used. This is a list of lists, with the first value of the inner
     * list being the operation. The rest of the list arguments are parameters
     * of the list. The operations are done in order.
     *
     * The operations are: "lowercase" (no arguments), "replace" (search
     * string, replacement string).
     *
     * If this is unset, then only a lowercase normalization is done.
     */
    normalization?: string[][];
}

interface Tokenizer {
    tokenize(input: string): string[];
}

interface Stemmer {
    stem(token: string): string;
}

export function process(args: types.AnalysisArguments) {
    // Figure out the tokenizer and stemmer we use for splitting.
    var options: NodeAuthorIntrusionSplitOptions = args.analysis.options;
    var tokenizer = getTokenizer(options);
    var stemmer = getStemmer(options);

    // Go through the lines and simply break apart each one.
    for (var lineIndex in args.content.lines) {
        // When we tokenize the line, we need to also build up a location for the
        // token (including length). This is place inside the line's tokens.
        var line = args.content.lines[lineIndex];
        splitTokens(args.content, line, options, tokenizer, stemmer);
    }

    // Once we are finished, add in the processing flags.
    args.content.processed.push("split");

    if (stemmer)
    {
        args.content.processed.push("stem");
    }
}

function getStemmer(options: NodeAuthorIntrusionSplitOptions): Stemmer {
    // If we don't have options or a stemmer, then return null.
    if (!options || !options.stemmer) {
        return null;
    }

    // Otherwise, determine it based on the value.
    switch (options.stemmer.toLowerCase()) {
        case "porter":
            var tmp: any = natural.PorterStemmer;
            return tmp;
        // TODO case "lancaster":
        // TODO     return natural.LandcasterStemmer();
        default:
            throw new Error(
                "Cannot identifier the stemmer '" + options.stemmer + "'.");
    }
}

function getTokenizer(options: NodeAuthorIntrusionSplitOptions): Tokenizer {
    // If we don't have options or a tokenizer, then use the default.
    if (!options || !options.tokenizer) {
        return new natural.TreebankWordTokenizer();
    }

    // Otherwise, determine it based on the value.
    switch (options.tokenizer.toLowerCase()) {
        case "treebank":
            return new natural.TreebankWordTokenizer();
        case "word":
            return new natural.WordTokenizer();
        case "aggressive":
            return new natural.AggressiveTokenizer();
        default:
            throw new Error(
                "Cannot identifier the tokenizer '" + options.tokenizer + "'.");
    }
}

function normalizeToken(options: NodeAuthorIntrusionSplitOptions, text: string): string
{
    // If we don't have options or this one isn't set, the default is to
    // lowercase the text value.
    var operations = [["lowercase"]];

    if (options && options.normalization)
    {
        operations = options.normalization;
    }

    // Go through the operations and perform each one on the text.
    for (var operation of operations)
    {
        var type = operation[0];

        switch (type)
        {
            case "lowercase":
                text = text.toLowerCase();
                break;

            case "replace":
                // The replacement can be used to change Unicode values to Latin,
                // or to handle a case where different characters are used for
                // the same stem/root.
                text = text.replace(operation[1], operation[2]);
                break;
        }
    }

    // Return the resulting text.
    return text;
}

function splitTokens(
    content: types.Content,
    line: types.Line,
    options: NodeAuthorIntrusionSplitOptions,
    tokenizer: Tokenizer,
    stemmer: Stemmer) {
    // Split out the tokens using the tokenizer.
    var lineText = line.text;
    var lineLocation = line.location;
    var tokens = tokenizer.tokenize(line.text);

    // Create the tokens with the text and location.
    var index = 0;

    for (var tokenText of tokens) {
        // Get the normalized version of the token.
        var normal = normalizeToken(options, tokenText);

        // Pull out the token and figure where it is in the source file.
        var lineIndex = lineText.indexOf(tokenText, index);

        if (lineIndex < 0) {
            throw RangeError("Cannot find text of " + tokenText + " in " + lineText);
        }

        index = lineIndex + tokenText.length;

        // Create a token object for this token with its location.
        var location = new types.Location(
            lineLocation.path,
            lineLocation.beginLine,
            lineIndex,
            lineLocation.endLine,
            (lineIndex + tokenText.length));
        var token = new types.Token(location, tokenText, normal);
        token.index = content.tokens.length;

        // If we have a stemmer, then stem it.
        if (stemmer)
        {
            token.stem = stemmer.stem(normal);
        }

        // Add the token to both the line and the content file. The content list is
        // used when we want to do operations across all paragraphs.
        line.tokens.push(token);
        content.tokens.push(token);
    }
}
