-- yes, the most basic of tests.
local ltreesitter = require("ltreesitter")
local teal = ltreesitter.require("ts-teal", "teal")
local output = teal:parser():parse_string("local x = 1")
os.exit(output ~= nil and 0 or 1)