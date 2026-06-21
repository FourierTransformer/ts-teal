local sbyte = string.byte
local bytes: {string: integer} = {
   -- ['"'] = sbyte('"'), -- was using this when previously converting angled quotes to double quotes
   ["'"] = sbyte("'"),
   ['‘'] = sbyte('‘'),
   ["{"] = sbyte("{"),
   ["}"] = sbyte("}"),
   ["["] = sbyte("["),
   ["]"] = sbyte("]"),
   ["|"] = sbyte("|")
}

local record ebnf

   enum symbol_kind
      "literal"
      "repeat"
      "optional"
      "lua_base"
      "lookup"
   end

   enum lua_symbol_kind
      "Name"
      "LiteralString"
      "Numeral"
   end

   interface symbol
      kind: symbol_kind
      field: string
   end

   interface literal_symbol is symbol where self.kind == "literal"
      value: string
   end

   interface repeat_symbol is symbol where self.kind == "repeat"
      value: {{symbol}}
   end

   interface optional_symbol is symbol where self.kind == "optional"
      value: {{symbol}}
   end

   interface lua_symbol is symbol where self.kind == "lua_base"
      value: lua_symbol_kind
   end

   interface lookup_symbol is symbol where self.kind == "lookup"
      value: string
   end
end

-- Adding field names with `@` in teal-grammar.ebnf, this parses out as a field name
local function read_annotation(full_expression: string, i: integer): string, integer
   if string.sub(full_expression, i + 1, i + 1) == "@" then
      local _: integer
      local field_name: string
      _, i, field_name = string.find(full_expression, "@([%a_]+)", i + 1)
      return field_name, i
   end
   return nil, i
end

local function parse_expression(full_expression: string, i?: integer): {{ebnf.symbol}}, integer
   i = i or 1
   local rules: {{ebnf.symbol}} = {{}}
   local current_rule: integer = 1
   local str_value: string
   local _: integer
   local current_byte: integer
   _, i = string.find(full_expression, "[^%s]", i)
   while i <= #full_expression do
      current_byte = sbyte(full_expression, i)
      -- literal string
      if current_byte == bytes['‘'] then
         _, i, str_value = string.find(full_expression, '‘(.-)’', i)
         local s: ebnf.literal_symbol = {kind="literal", value=str_value}
         table.insert(rules[current_rule], s)

      -- literal string, but copied from Patrick Donnely with different quotes...
      elseif current_byte == bytes["'"] then
         _, i, str_value = string.find(full_expression, "'(.-)'", i)
         local s: ebnf.literal_symbol = {kind="literal", value=str_value}
         table.insert(rules[current_rule], s)

      -- can repeat
      elseif current_byte == bytes['{'] then
         local s: ebnf.repeat_symbol = {kind="repeat"}
         s.value, i = parse_expression(full_expression, i + 1)
         table.insert(rules[current_rule], s)

      elseif current_byte == bytes["}"] then
         return rules, i

      -- optional
      elseif current_byte == bytes['['] then
         local s: ebnf.optional_symbol = {kind="optional"}
         s.value, i = parse_expression(full_expression, i + 1)
         table.insert(rules[current_rule], s)

      elseif current_byte == bytes["]"] then
         return rules, i

      -- or, creates a new expression to try and evaluate with a rule
      elseif current_byte == bytes['|'] then
         current_rule = current_rule + 1
         rules[current_rule] = {}

      else

         -- uppercase, should be LiteralString, Name, or Numeral
         if current_byte >= 65 and current_byte <= 90 then
            _, i, str_value = string.find(full_expression, "([A-Za-z]+)", i)
            local s: ebnf.lua_symbol = {kind="lua_base", value=(str_value as ebnf.lua_symbol_kind)}
            s.field, i = read_annotation(full_expression, i)
            table.insert(rules[current_rule], s)

         -- lowercase, refers to a lookup
         elseif current_byte >= 97 and current_byte <= 122 then
            _, i, str_value = string.find(full_expression, "([a-z]+)", i)
            local s: ebnf.lookup_symbol = {kind="lookup", value=str_value}
            s.field, i = read_annotation(full_expression, i)
            table.insert(rules[current_rule], s)

         end

      end

      i = i + 1
   end
   return rules, i
end

function ebnf.parse(): {string: {{ebnf.symbol}}}, {string}
   local grammar: string
   do
      local ebnf_file = io.open("teal-grammar.ebnf", "r")
      -- This should probably be updated to properly handle the empty newlines instead of
      -- just relying on them to exist...
      grammar = ebnf_file:read("*all") .. "\n"
      ebnf_file:close()
   end

   local expressions: {string: {{ebnf.symbol}}} = {}
   local rule_order: {string} = {}
   -- local start = os.clock()

   for rule in string.gmatch(grammar, "(.-)\n\n") do
      -- could update pattern to include +/*
      local rule_name, full_expression = string.match(rule, "^[+*]?%s*(.-)%s*::=(.-)$")
      local split = parse_expression(full_expression)
      expressions[rule_name] = split
      table.insert(rule_order, rule_name)
   end

   -- print("ebnf", os.clock() - start)

   -- super cheap validation
   for _, expression in pairs(expressions) do
      for _, rules in ipairs(expression) do
         for _, rule in ipairs(rules) do
            if rule  is ebnf.lookup_symbol then
               if not expressions[rule.value] then
                  error("Trying to access a rule that isn't defined: " .. rule.value)
               end
            end
         end
      end
   end

   return expressions, rule_order

end

-- strip annotations from file, used when comparing with original-teal.ebnf
function ebnf.unannotated(): string
   local ebnf_file = io.open("teal-grammar.ebnf", "r")
   local text = ebnf_file:read("*all")
   ebnf_file:close()
   return (text:gsub("@[%a_]+", ""))
end

return ebnf
