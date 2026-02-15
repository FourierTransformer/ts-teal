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

  stat: $ =>  choice(
    ';',
  seq(
    $.varlist,
    '=',
    $.explist,
  ),
    $.functioncall,
    $.label,
    'break',
  seq(
    'goto',
    $.identifier,
  ),
  seq(
    'do',
    repeat($.stat), optional($.retstat),
    'end',
  ),
  seq(
    'while',
    $.exp,
    'do',
    repeat($.stat), optional($.retstat),
    'end',
  ),
  seq(
    'repeat',
    repeat($.stat), optional($.retstat),
    'until',
    $.exp,
  ),
  seq(
    'if',
    $.exp,
    'then',
    repeat($.stat), optional($.retstat),
    repeat(
      seq(
       'elseif',
       $.exp,
       'then',
       repeat($.stat), optional($.retstat),
      ),
    ),
    optional(
      seq(
       'else',
       repeat($.stat), optional($.retstat),
      ),
    ),
    'end',
  ),
  seq(
    'for',
    $.identifier,
    '=',
    $.exp,
    ',',
    $.exp,
    optional(
      seq(
       ',',
       $.exp,
      ),
    ),
    'do',
    repeat($.stat), optional($.retstat),
    'end',
  ),
  seq(
    'for',
    $.namelist,
    'in',
    $.explist,
    'do',
    repeat($.stat), optional($.retstat),
    'end',
  ),
  seq(
    'function',
    $.funcname,
    $.funcbody,
  ),
  seq(
    'local',
    $.attnamelist,
    optional(
      seq(
       ':',
       $.typelist,
      ),
    ),
    optional(
      seq(
       '=',
       $.explist,
      ),
    ),
  ),
  seq(
    'local',
    'function',
    $.identifier,
    $.funcbody,
  ),
  seq(
    'local',
    'record',
    $.identifier,
    $.recordbody,
  ),
  seq(
    'local',
    'interface',
    $.identifier,
    $.recordbody,
  ),
  seq(
    'local',
    'enum',
    $.identifier,
    $.enumbody,
  ),
  seq(
    'local',
    'type',
    $.identifier,
    '=',
    $.newtype,
  ),
  seq(
    'global',
    $.attnamelist,
    ':',
    $.typelist,
    optional(
      seq(
       '=',
       $.explist,
      ),
    ),
  ),
  seq(
    'global',
    $.attnamelist,
    '=',
    $.explist,
  ),
  seq(
    'global',
    'function',
    $.identifier,
    $.funcbody,
  ),
  seq(
    'global',
    'record',
    $.identifier,
    $.recordbody,
  ),
  seq(
    'global',
    'interface',
    $.identifier,
    $.recordbody,
  ),
  seq(
    'global',
    'enum',
    $.identifier,
    $.enumbody,
  ),
  seq(
    'global',
    'type',
    $.identifier,
    optional(
      seq(
       '=',
       $.newtype,
      ),
    ),
  ),
  ),

  attnamelist: $ =>  seq(
   $.identifier,
   optional(
      $.attrib,
   ),
   repeat(
     seq(
      ',',
      $.identifier,
      optional(
         $.attrib,
      ),
     ),
   ),
  ),

  attrib: $ =>  seq(
   '<',
   $.identifier,
   '>',
  ),

  retstat: $ =>  seq(
   'return',
   optional(
      $.explist,
   ),
   optional(
      ';',
   ),
  ),

  label: $ =>  seq(
   '::',
   $.identifier,
   '::',
  ),

  funcname: $ =>  choice(
  seq(
    $.identifier,
    repeat(
      seq(
       '.',
       $.identifier,
      ),
    ),
    ':',
    $.identifier,
  ),
  seq(
    $.identifier,
    repeat(
      seq(
       '.',
       $.identifier,
      ),
    ),
    '.',
    $.identifier,
  ),
  ),

  varlist: $ =>  seq(
   $.var,
   repeat(
     seq(
      ',',
      $.var,
     ),
   ),
  ),

  var: $ =>  choice(
    $.identifier,
  seq(
    $.prefixexp,
    '[',
    $.exp,
    ']',
  ),
  seq(
    $.prefixexp,
    '.',
    $.identifier,
  ),
  ),

  namelist: $ =>  seq(
   $.identifier,
   repeat(
     seq(
      ',',
      $.identifier,
     ),
   ),
  ),

  explist: $ =>  seq(
   $.exp,
   repeat(
     seq(
      ',',
      $.exp,
     ),
   ),
  ),

  exp: $ =>  choice(
    'nil',
    'false',
    'true',
    $.number,
    $.string,
    '...',
    $.functiondef,
    $.prefixexp,
    $.tableconstructor,
  seq(
    $.exp,
    $.binop,
    $.exp,
  ),
  seq(
    $.unop,
    $.exp,
  ),
  seq(
    $.exp,
    prec.left(BIN_PREC['as'], 'as'),
    $.type,
  ),
  seq(
    $.exp,
    prec.left(BIN_PREC['as'], 'as'),
    '(',
    $.typelist,
    ')',
  ),
  seq(
    $.identifier,
    'is',
    $.type,
  ),
  ),

  prefixexp: $ =>  choice(
    $.var,
    $.functioncall,
  seq(
    '(',
    $.exp,
    ')',
  ),
  ),

  functioncall: $ =>  choice(
  seq(
    $.prefixexp,
    $.args,
  ),
  seq(
    $.prefixexp,
    ':',
    $.identifier,
    $.args,
  ),
  ),

  args: $ =>  choice(
  seq(
    '(',
    optional(
       $.explist,
    ),
    ')',
  ),
    $.tableconstructor,
    $.string,
  ),

  functiondef: $ =>  seq(
   'function',
   $.funcbody,
  ),

  funcbody: $ =>  seq(
   optional(
      $.typeargs,
   ),
   '(',
   optional(
      $.parlist,
   ),
   ')',
   optional(
     seq(
      ':',
      $.retlist,
     ),
   ),
   repeat($.stat), optional($.retstat),
   'end',
  ),

  parlist: $ =>  choice(
  seq(
    $.parnamelist,
    optional(
      seq(
       ',',
       '...',
       optional(
         seq(
          ':',
          $.type,
         ),
       ),
      ),
    ),
  ),
  seq(
    '...',
    optional(
      seq(
       ':',
       $.type,
      ),
    ),
  ),
  ),

  tableconstructor: $ =>  seq(
   '{',
   optional(
      $.fieldlist,
   ),
   '}',
  ),

  fieldlist: $ =>  seq(
   $.field,
   repeat(
     seq(
      $.fieldsep,
      $.field,
     ),
   ),
   optional(
      $.fieldsep,
   ),
  ),

  field: $ =>  choice(
  seq(
    '[',
    $.exp,
    ']',
    '=',
    $.exp,
  ),
  seq(
    $.identifier,
    optional(
      seq(
       ':',
       $.type,
      ),
    ),
    '=',
    $.exp,
  ),
    $.exp,
  ),

  fieldsep: $ =>  choice(
    ',',
    ';',
  ),

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
  type: $ =>  choice(
  seq(
    '(',
    $.type,
    ')',
  ),
  seq(
    $.basetype,
    repeat(
      seq(
       '|',
       $.basetype,
      ),
    ),
  ),
  ),

  nominal: $ =>  seq(
   $.identifier,
   repeat(
     seq(
      '.',
      $.identifier,
     ),
   ),
   optional(
      $.typeargs,
   ),
  ),

  basetype: $ =>  choice(
    'string',
    'boolean',
    'nil',
    'number',
  seq(
    '{',
    $.type,
    repeat(
      seq(
       ',',
       $.type,
      ),
    ),
    '}',
  ),
  seq(
    '{',
    $.type,
    ':',
    $.type,
    '}',
  ),
    $.functiontype,
    $.nominal,
  ),

  typelist: $ =>  seq(
   $.type,
   repeat(
     seq(
      ',',
      $.type,
     ),
   ),
  ),

  retlist: $ =>  choice(
  seq(
    '(',
    optional(
       $.typelist,
    ),
    optional(
       '...',
    ),
    ')',
  ),
  seq(
    $.typelist,
    optional(
       '...',
    ),
  ),
  ),

  typeargs: $ =>  seq(
   '<',
   $.identifier,
   repeat(
     seq(
      ',',
      $.identifier,
     ),
   ),
   '>',
  ),

  newtype: $ =>  choice(
  seq(
    'record',
    $.recordbody,
  ),
  seq(
    'enum',
    $.enumbody,
  ),
    $.type,
  seq(
    'require',
    '(',
    $.string,
    ')',
    repeat(
      seq(
       '.',
       $.identifier,
      ),
    ),
  ),
  ),

  interfacelist: $ =>  choice(
  seq(
    $.nominal,
    repeat(
      seq(
       ',',
       $.nominal,
      ),
    ),
  ),
  seq(
    '{',
    $.type,
    '}',
    repeat(
      seq(
       ',',
       $.nominal,
      ),
    ),
  ),
  ),

  recordbody: $ =>  seq(
   optional(
      $.typeargs,
   ),
   optional(
     seq(
      'is',
      $.interfacelist,
     ),
   ),
   optional(
     seq(
      'where',
      $.exp,
     ),
   ),
   repeat(
      $.recordentry,
   ),
   'end',
  ),

  recordentry: $ =>  choice(
    'userdata',
  seq(
    'type',
    $.identifier,
    '=',
    $.newtype,
  ),
  seq(
    optional(
       'metamethod',
    ),
    $.recordkey,
    ':',
    $.type,
  ),
  seq(
    'record',
    $.identifier,
    $.recordbody,
  ),
  seq(
    'enum',
    $.identifier,
    $.enumbody,
  ),
  ),

  recordkey: $ =>  choice(
    $.identifier,
  seq(
    '[',
    $.string,
    ']',
  ),
  ),

  enumbody: $ =>  seq(
   repeat(
      $.string,
   ),
   'end',
  ),

  functiontype: $ =>  seq(
   'function',
   optional(
      $.typeargs,
   ),
   '(',
   $.partypelist,
   ')',
   optional(
     seq(
      ':',
      $.retlist,
     ),
   ),
  ),

  partypelist: $ =>  seq(
   $.partype,
   repeat(
     seq(
      ',',
      $.partype,
     ),
   ),
  ),

  partype: $ =>  choice(
  seq(
    $.identifier,
    optional(
       '?',
    ),
    ':',
    $.type,
  ),
  seq(
    optional(
       '?',
    ),
    $.type,
  ),
  ),

  parnamelist: $ =>  seq(
   $.parname,
   repeat(
     seq(
      ',',
      $.parname,
     ),
   ),
  ),

  parname: $ =>  seq(
   $.identifier,
   optional(
      '?',
   ),
   optional(
     seq(
      ':',
      $.type,
     ),
   ),
  ),

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

}
})