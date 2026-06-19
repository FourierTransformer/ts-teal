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
  [$.nominal, $.typeparam],
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
    field('variables', $.varlist),
    '=',
    field('expressions', $.explist),
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
    field('condition', $.exp),
    'do',
    repeat($.stat), optional($.retstat),
    'end',
  ),
  seq(
    'repeat',
    repeat($.stat), optional($.retstat),
    'until',
    field('condition', $.exp),
  ),
  seq(
    'if',
    field('condition', $.exp),
    'then',
    repeat($.stat), optional($.retstat),
    repeat(
      seq(
       'elseif',
       field('condition', $.exp),
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
    field('variable', $.identifier),
    '=',
    field('initializer', $.exp),
    ',',
    field('target', $.exp),
    optional(
      seq(
       ',',
       field('step', $.exp),
      ),
    ),
    'do',
    repeat($.stat), optional($.retstat),
    'end',
  ),
  seq(
    'for',
    field('variable', $.namelist),
    'in',
    field('iterator', $.explist),
    'do',
    repeat($.stat), optional($.retstat),
    'end',
  ),
  seq(
    'function',
    field('name', $.funcname),
    $.funcbody,
  ),
  seq(
    'local',
    field('declarators', $.attnamelist),
    optional(
      seq(
       ':',
       field('type_annotation', $.typelist),
      ),
    ),
    optional(
      seq(
       '=',
       field('initializers', $.explist),
      ),
    ),
  ),
  seq(
    'local',
    'function',
    field('name', $.identifier),
    $.funcbody,
  ),
  seq(
    'local',
    'macroexp',
    field('name', $.identifier),
    '(',
    optional(
       field('arguments', $.parlist),
    ),
    ')',
    optional(
      seq(
       ':',
       field('return_type', $.retlist),
      ),
    ),
    repeat($.stat), optional($.retstat),
    'end',
  ),
  seq(
    'local',
    'record',
    field('name', $.identifier),
    field('record_body', $.recordbody),
  ),
  seq(
    'local',
    'interface',
    field('name', $.identifier),
    field('interface_body', $.recordbody),
  ),
  seq(
    'local',
    'enum',
    field('name', $.identifier),
    field('enum_body', $.enumbody),
  ),
  seq(
    'local',
    'type',
    field('name', $.identifier),
    optional(
       $.typeargs,
    ),
    '=',
    field('value', $.newtype),
  ),
  seq(
    'global',
    field('declarators', $.attnamelist),
    ':',
    field('type_annotation', $.typelist),
    optional(
      seq(
       '=',
       field('initializers', $.explist),
      ),
    ),
  ),
  seq(
    'global',
    field('declarators', $.attnamelist),
    '=',
    field('initializers', $.explist),
  ),
  seq(
    'global',
    'function',
    field('name', $.identifier),
    $.funcbody,
  ),
  seq(
    'global',
    'record',
    field('name', $.identifier),
    field('record_body', $.recordbody),
  ),
  seq(
    'global',
    'interface',
    field('name', $.identifier),
    field('interface_body', $.recordbody),
  ),
  seq(
    'global',
    'enum',
    field('name', $.identifier),
    field('enum_body', $.enumbody),
  ),
  seq(
    'global',
    'type',
    field('name', $.identifier),
    optional(
       $.typeargs,
    ),
    optional(
      seq(
       '=',
       field('value', $.newtype),
      ),
    ),
  ),
  ),

  attnamelist: $ =>  seq(
   $.identifier,
   optional(
      field('attribute', $.attrib),
   ),
   repeat(
     seq(
      ',',
      $.identifier,
      optional(
         field('attribute', $.attrib),
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
    field('base', $.identifier),
    repeat(
      seq(
       '.',
       $.identifier,
      ),
    ),
    ':',
    field('method', $.identifier),
  ),
  seq(
    field('base', $.identifier),
    repeat(
      seq(
       '.',
       $.identifier,
      ),
    ),
    '.',
    field('entry', $.identifier),
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
    field('object', $.prefixexp),
    '[',
    field('expr_key', $.exp),
    ']',
  ),
  seq(
    field('object', $.prefixexp),
    '.',
    field('key', $.identifier),
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
    field('left', $.exp),
    field('op', $.binop),
    field('right', $.exp),
  ),
  seq(
    field('op', $.unop),
    field('right', $.exp),
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
    field('called_object', $.prefixexp),
    field('arguments', $.args),
  ),
  seq(
    field('called_object', $.prefixexp),
    ':',
    field('method', $.identifier),
    field('arguments', $.args),
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
      field('typeargs', $.typeargs),
   ),
   '(',
   optional(
      field('arguments', $.parlist),
   ),
   ')',
   optional(
     seq(
      ':',
      field('return_type', $.retlist),
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
    field('expr_key', $.exp),
    ']',
    '=',
    field('value', $.exp),
  ),
  seq(
    field('key', $.identifier),
    optional(
      seq(
       ':',
       field('type', $.type),
      ),
    ),
    '=',
    field('value', $.exp),
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
   field('name', $.identifier),
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
    'integer',
    'any',
    'thread',
  seq(
    '{',
    field('tuple_type', $.type),
    repeat(
      seq(
       ',',
       field('tuple_type', $.type),
      ),
    ),
    '}',
  ),
  seq(
    '{',
    field('key_type', $.type),
    ':',
    field('value_type', $.type),
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
   $.typeparam,
   repeat(
     seq(
      ',',
      $.typeparam,
     ),
   ),
   '>',
  ),

  typeparam: $ =>  choice(
  seq(
    field('name', $.identifier),
    optional(
      seq(
       'is',
       field('constraint', $.nominal),
      ),
    ),
  ),
    $.type,
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
      field('is_types', $.interfacelist),
     ),
   ),
   optional(
     seq(
      'where',
      field('where', $.exp),
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
    field('name', $.identifier),
    '=',
    field('value', $.newtype),
  ),
  seq(
    optional(
       'metamethod',
    ),
    field('name', $.recordkey),
    ':',
    field('type', $.type),
    optional(
      seq(
       '=',
       $.macroexpbody,
      ),
    ),
  ),
  seq(
    'record',
    field('name', $.identifier),
    field('record_body', $.recordbody),
  ),
  seq(
    'enum',
    field('name', $.identifier),
    field('enum_body', $.enumbody),
  ),
  seq(
    'interface',
    field('name', $.identifier),
    field('interface_body', $.recordbody),
  ),
  ),

  _keyword_identifier: $ => alias(choice(
    'type', 'record', 'interface', 'enum',
    'global', 'macroexp', 'is', 'as',
    'where', 'userdata', 'metamethod',
  ), $.identifier),

  recordkey: $ =>  choice(
    $.identifier,
    $._keyword_identifier, // to support Teal keywords as record keys
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
      field('typeargs', $.typeargs),
   ),
   '(',
   optional(
      field('arguments', $.partypelist),
   ),
   ')',
   optional(
     seq(
      ':',
      field('return_type', $.retlist),
     ),
   ),
  ),

  partypelist: $ =>  choice(
  seq(
    $.partype,
    repeat(
      seq(
       ',',
       $.partype,
      ),
    ),
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

  partype: $ =>  choice(
  seq(
    field('name', $.identifier),
    optional(
       '?',
    ),
    ':',
    field('type', $.type),
  ),
  seq(
    optional(
       '?',
    ),
    field('type', $.type),
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
   field('name', $.identifier),
   optional(
      '?',
   ),
   optional(
     seq(
      ':',
      field('type', $.type),
     ),
   ),
  ),

  macroexpbody: $ =>  seq(
   'macroexp',
   '(',
   optional(
      field('arguments', $.parlist),
   ),
   ')',
   optional(
     seq(
      ':',
      field('return_type', $.retlist),
     ),
   ),
   repeat($.stat), optional($.retstat),
   'end',
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
        /[0-9]{1,3}/,
      ),
    ))),

}
})