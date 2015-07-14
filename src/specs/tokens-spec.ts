/// <reference path="../../typings/node/node.d.ts"/>
/// <reference path="../../typings/jasmine/jasmine.d.ts"/>
/// <reference path="../refs.ts"/>
/// <reference path="../index.ts"/>

import types = require("node-author-intrusion");
import plugin = require("../index");

function setupLines(analysis?: any): types.Content {
    // Build up the arguments for the content.
    var content = new types.Content();
    content.lines.push(
        new types.Line(new types.Location("a", 1), "One Two Three."));
    content.lines.push(
        new types.Line(new types.Location("a", 2), "Four \"Five\" Six"));
    content.lines.push(
        new types.Line(new types.Location("a", 3), "Seven *Eight* Nine"));

    // Run the analysis on the content.
    return runAnalysis(content, analysis);
}

function runAnalysis(content: types.Content, analysis?: any): types.Content {
    // Populate the analysis options.
    if (!analysis) {
        analysis = {};
    }

    // Process the plugin.
    var args = new types.AnalysisArguments();
    args.content = content;
    args.analysis = analysis;

    plugin.process(args);

    // Return the content.
    return content;
}

describe("default tokens", function() {
    it("splits lines into tokens", function() {
        var content = setupLines();

        expect(content.tokens.length).toEqual(14);
        expect(content.lines.length).toEqual(3);
        expect(content.processed).toContain("split");
        expect(content.processed.length).toBe(1);
    });
    it("splits line 0 into tokens", function() {
        var content = setupLines();

        expect(content.lines[0].tokens.length).toEqual(4);

        expect(content.tokens[0].text).toEqual("One");
        expect(content.tokens[0].normalized).toEqual("one");
        expect(content.tokens[0].stem).toEqual(undefined);

        expect(content.tokens[1].text).toEqual("Two");
        expect(content.tokens[1].normalized).toEqual("two");
        expect(content.tokens[1].stem).toEqual(undefined);

        expect(content.tokens[2].text).toEqual("Three");
        expect(content.tokens[2].normalized).toEqual("three");
        expect(content.tokens[2].stem).toEqual(undefined);

        expect(content.tokens[3].text).toEqual(".");
        expect(content.tokens[3].normalized).toEqual(".");
        expect(content.tokens[3].stem).toEqual(undefined);
    })
});

describe("stemmed tokens", function() {
    it("splits lines into tokens", function() {
        var analysis = {
            "name": "test",
            "options": {
                "stemmer": "porter"
            }
        };
        var content = setupLines(analysis);

        expect(content.tokens.length).toEqual(14);
        expect(content.lines.length).toEqual(3);
        expect(content.processed).toContain("split");
        expect(content.processed).toContain("stem");
        expect(content.processed.length).toBe(2);
    });
    it("splits line 0 into tokens", function() {
        var analysis = {
            "name": "test",
            "options": {
                "stemmer": "porter"
            }
        };
        var content = setupLines(analysis);

        expect(content.lines[0].tokens.length).toEqual(4);

        expect(content.tokens[0].text).toEqual("One");
        expect(content.tokens[0].normalized).toEqual("one");
        expect(content.tokens[0].stem).toEqual("on");

        expect(content.tokens[1].text).toEqual("Two");
        expect(content.tokens[1].normalized).toEqual("two");
        expect(content.tokens[1].stem).toEqual("two");

        expect(content.tokens[2].text).toEqual("Three");
        expect(content.tokens[2].normalized).toEqual("three");
        expect(content.tokens[2].stem).toEqual("three");

        expect(content.tokens[3].text).toEqual(".");
        expect(content.tokens[3].normalized).toEqual(".");
        expect(content.tokens[3].stem).toEqual(".");
    })
});

describe("diacritic tokens", function() {
    it("splits line 0 into tokens", function() {
        var content = new types.Content();
        content.lines.push(
            new types.Line(
                new types.Location("a", 1),
                "aáàā eèéē iìíī oòóō uùúū"));
        var analysis = {
            "name": "test",
            "options": {
                "stemmer": "porter",
                "normalization": [
                    ["lowercase"],
                    ["diacritics"]
                ]
            }
        };
        var content = runAnalysis(content, analysis);

        expect(content.lines[0].tokens.length).toEqual(5);

        expect(content.tokens[0].text).toEqual("aáàā");
        expect(content.tokens[0].normalized).toEqual("aaaa");

        expect(content.tokens[1].text).toEqual("eèéē");
        expect(content.tokens[1].normalized).toEqual("eeee");

        expect(content.tokens[2].text).toEqual("iìíī");
        expect(content.tokens[2].normalized).toEqual("iiii");

        expect(content.tokens[3].text).toEqual("oòóō");
        expect(content.tokens[3].normalized).toEqual("oooo");

        expect(content.tokens[4].text).toEqual("uùúū");
        expect(content.tokens[4].normalized).toEqual("uuuu");
    });
});
