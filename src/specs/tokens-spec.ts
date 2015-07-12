/// <reference path="../../typings/node/node.d.ts"/>
/// <reference path="../../typings/jasmine/jasmine.d.ts"/>
/// <reference path="../refs.ts"/>
/// <reference path="../index.ts"/>

import types = require("node-author-intrusion");
import plugin = require("../index");

describe("tokens", function() {
    it("splits a line into tokens", function() {
        // Build up the arguments for the content.
        var content = new types.Content();
        content.lines.push(new types.Line(new types.Location(), "one two three"));
        var args = new types.AnalysisArguments();
        args.content = content;

        // Process the plugin.
        plugin.process(args);

        // Verify the results.
        expect(content.tokens.length).toEqual(3);
        expect(content.tokens[0].text).toEqual("one");
        expect(content.tokens[1].text).toEqual("two");
        expect(content.tokens[2].text).toEqual("three");

        expect(content.lines.length).toEqual(1);
        expect(content.lines[0].tokens.length).toEqual(3);
    })
});
