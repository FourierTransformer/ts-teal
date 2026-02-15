local ebnf = require("ebnf")
local rule_data <const>, rule_order <const> = ebnf.parse()

local record writer
   rule: function(prefix: string, symbols: {ebnf.symbol})
   expression: function(prefix: string, expression: {{ebnf.symbol}})
end

function writer.rule(prefix: string, symbols: {ebnf.symbol})
   for _, symbol in ipairs(symbols) do
      
      if symbol is ebnf.literal_symbol then
         if symbol.value == "as" then
            io.write(prefix, "prec.left(BIN_PREC['as'], 'as')")
         else
            io.write(prefix, "'" .. symbol.value .. "'")
         end
      
      elseif symbol is ebnf.lookup_symbol then
         if symbol.value == "block" then
            io.write(prefix, "repeat($.stat), optional($.retstat)")
         else
            io.write(prefix, "$." .. symbol.value)
         end
      
      elseif symbol is ebnf.optional_symbol then
         io.write(prefix, "optional(\n")
         writer.expression(prefix .. "  ", symbol.value)
         io.write(prefix, ")")

      elseif symbol is ebnf.repeat_symbol then
         io.write(prefix, "repeat(\n")
         writer.expression(prefix .. "  ", symbol.value)
         io.write(prefix, ")")

      elseif symbol is ebnf.lua_symbol then
         if symbol.value == "LiteralString" then
            io.write(prefix, "$.string")
         
         elseif symbol.value == "Numeral" then
            io.write(prefix, "$.number")
         
         elseif symbol.value == "Name" then
            io.write(prefix, "$.identifier")
         
         else
            io.write(prefix, '"NYI: ', symbol.value, '"')
         end

      end
      io.write(",\n")
   end
end

function writer.expression(prefix: string, expression: {{ebnf.symbol}})

   if #expression == 1 then
      
      if #expression[1] == 1 then
         writer.rule(prefix .. " ", expression[1])

      else
         io.write(prefix, "seq(\n")
         writer.rule(prefix .. " ", expression[1])
         io.write(prefix, "),\n")
      end

   else
      io.write(prefix, "choice(\n")
      for _, exp in ipairs(expression) do
         if #exp == 1 then
            writer.rule(prefix .. "  ", exp)
         else
            io.write(prefix, "seq(\n")
            writer.rule(prefix .. "  ", exp)
            io.write(prefix, "),\n")
         end
      end
      io.write(prefix, "),\n")
   end
end

local binop = [[
  binop: $ =>  choice(
  prec.left(BIN_PREC['+'],
    '+',
  ),
  prec.left(BIN_PREC['-'],
    '-',
  ),
  prec.left(BIN_PREC['*'],
    '*',
  ),
  prec.left(BIN_PREC['/'],
    '/',
  ),
  prec.left(BIN_PREC['//'],
    '//',
  ),
  prec.right(BIN_PREC['^'],
    '^',
  ),
  prec.left(BIN_PREC['%'],
    '%',
  ),
  prec.left(BIN_PREC['&'],
    '&',
  ),
  prec.left(BIN_PREC['~'],
    '~',
  ),
  prec.left(BIN_PREC['|'],
    '|',
  ),
  prec.left(BIN_PREC['>>'],
    '>>',
  ),
  prec.left(BIN_PREC['<<'],
    '<<',
  ),
  prec.right(BIN_PREC['..'],
    '..',
  ),
  prec.left(BIN_PREC['<'],
    '<',
  ),
  prec.left(BIN_PREC['<='],
    '<=',
  ),
  prec.left(BIN_PREC['>'],
    '>',
  ),
  prec.left(BIN_PREC['>='],
    '>=',
  ),
  prec.left(BIN_PREC['=='],
    '==',
  ),
  prec.left(BIN_PREC['~='],
    '~=',
  ),
  prec.left(BIN_PREC['and'],
    'and',
  ),
  prec.left(BIN_PREC['or'],
    'or',
  ),
  ),
]]

local unop <const> = [[
  unop: $ =>  choice(
  prec.left(UN_PREC['-'], 
    '-',
  ),
  prec.left(UN_PREC['not'],
    'not',
  ),
  prec.left(UN_PREC['#'],
    '#',
  ),
  prec.left(UN_PREC['~'],
    '~',
  ),
  ),
]]

local function main()
   io.write([[
// from the teal-grammar page. Currently not auto-generated, could be in the future.
const BIN_PREC = {
 or: 10,
 and: 20,
 is: 30,
 "<":41,     ">": 42,     "<=": 43,    ">=": 44,    "~=":45,    "==":46,
 "|": 50,
 "~": 60,
 "&": 70,
 "<<": 81,    ">>": 82,
 "..": 90,
 "+": 101,     "-": 102,
 "*": 111,     "/": 112,    "//": 113,    "%": 114,
 // un_rec is originally here
 "^": 130,
 as: 140
}

const UN_PREC = {
"not": 121,   "#": 122,     "-": 123,     "~": 124,
}


module.exports = grammar({
name: 'teal',

conflicts: $ => [
  [$.stat, $.prefixexp],
  [$.var, $.field],
  [$.exp],
  [$.exp, $.functioncall],
  [$.nominal],
  [$.type],
  [$.parnamelist],
  [$.type, $.typelist],
  [$.var, $.exp],
  [$.functiontype],
  [$.typelist],
  [$.retlist]
],

// below is from tree-sitter-teal
extras: $ => [
  $.comment,
  /[\s\n]/,
],


// Lua's comment and strings are weird, especially with brackets and values between them
// tree-sitter-teal and other Lua ts grammars just use a scanner to handle this.
// Using tree-sitter-teal's implementation
externals: $ => [
  $.comment,

  $._long_string_start,
  $._long_string_char,
  $._long_string_end,

  $._short_string_start,
  $._short_string_char,
  $._short_string_end,
],

word: $ => $.identifier,

rules: {

  // custom chunk because tree-sitter requires each rule to not be able to pass in the empty string,
  // this should be equivalent to the original, but forces at least one of the choices to occur
  chunk: $ => seq(alias(optional(token.immediate(/#![^\n\r]*/)), $.shebang_comment), choice(
  seq(
    repeat1($.stat),
    optional($.retstat)
  ),
  $.retstat
  )),

]])
   for _, rule_name in ipairs(rule_order) do

      if rule_name == "binop" then
         io.write(binop)
      
      elseif rule_name == "unop" then
         io.write(unop)
      
      elseif rule_name == "chunk" or rule_name == "block" then
         -- doing nothing here, chunk has been re-written above to satisfy tree-sitter's "no-empty string" policy
         -- block has been replaced inline via writer.rule for similar reasons
      
      else
         io.write("  ", rule_name .. ": $ =>")
         writer.expression("  ", rule_data[rule_name])
         io.write("\n")
      end
   end

   io.write([[
   // below is from tree-sitter-teal
   identifier: $ => /[a-zA-Z_][a-zA-Z_0-9]*/,
    number: $ => choice(
      /\d+(\.\d+)?(e\d+)?/i,
      /\.\d+(e\d+)?/i,
      /0x[0-9a-fA-F]+(\.[0-9a-fA-F]+)?(p\d+)?/,
    ),

    _short_string_content: $ => alias(repeat1(choice(
      $.format_specifier,
      $.escape_sequence,
      token.immediate(prec(1, '%')),
      prec(0, $._short_string_char),
    )), $.string_content),

    _long_string_content: $ => alias(repeat1(choice(
      $.format_specifier,
      $._long_string_char,
      token.immediate(prec(1, '%')),
    )), $.string_content),

    string: $ => prec(2, choice(
      seq(
        field('start', alias($._short_string_start, 'short_string_start')),
        field('content', optional($._short_string_content)),
        field('end', alias($._short_string_end, 'short_string_end')),
      ),

      seq(
        field('start', alias($._long_string_start, 'long_string_start')),
        field('content', optional($._long_string_content)),
        field('end', alias($._long_string_end, 'long_string_end')),
      ),
    )),

    format_specifier: $ => token.immediate(prec(3, seq(
      '%',
      choice(
        '%',
        seq(
          optional(choice(
            '+', '-',
          )),
          optional(' '),
          optional('#'),
          optional(/[0-9]+/),
          optional('.'),
          optional(/[0-9]+/),
          /[AaEefGgcdiouXxpqs]/,
        ),
      ),
    ))),

    escape_sequence: $ => token.immediate(prec(3, seq(
      '\\',
      choice(
        /[abfnrtvz"'\\]/,
        seq('x', /[0-9a-fA-F]{2}/),
        seq('d', /[0-7]{3}/),
        seq('u{', /[0-9a-fA-F]{1,8}/, '}'),
      ),
    ))),

]])

   io.write("}\n})")

end

main()
