// Monarch tokenizer for Pact language, adapted from TextMate grammar in `syntaxes/pact.tmLanguage.json`
// Focuses on: keywords, literals, comments, strings, numbers, binders, lists/objects/sexps, and simple type annotations

export const pactLanguage = {
  defaultToken: '',
  tokenPostfix: '.pact',

  brackets: [
    { open: '(', close: ')', token: 'delimiter.parenthesis' },
    { open: '[', close: ']', token: 'delimiter.bracket' },
    { open: '{', close: '}', token: 'delimiter.brace' },
  ],

  keywords: [
    'module', 'interface', 'list', 'let', 'let*', 'defun', 'defpact', 'defconst',
    'defschema', 'deftable', 'defcap', 'step', 'use', 'step-with-rollback',
    'invariant', 'invariants', 'properties', 'property', 'defproperty', 'bless',
    'implements'
  ],

  // Basic set of Pact types (including annotation style like :integer, :object{...})
  types: [
    'integer', 'decimal', 'time', 'bool', 'string', 'list', 'value', 'keyset',
    'guard', 'object', 'table'
  ],

  symbols: /[=><!~?:&|+\-*\/%^]+/,

  tokenizer: {
    root: [
      // Comments
      [/;.*/, 'comment'],

      // Strings
      [/"([^"\\]|\\.)*$/, 'string.invalid'], // non-terminated string
      [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],

      // Numbers
      [/[-]?\d+\.[0-9]+\b/, 'number.float'],
      [/[-]?\d+\b/, 'number'],

      // Booleans
      [/(?:\b)(true|false)(?:\b)/, 'constant'],

      // Binder ( := or : )
      [/:(?==)/, 'keyword'],
      [/(:=)/, 'keyword'],

      // Type annotations like :integer, :object{...}
      [/:(?:\{|[a-zA-Z][\w-]*)(?:[^\s)]*)?/, {
        cases: {
          '@types': 'type',
          '@default': 'type'
        }
      }],

      // Quoted symbol: 'foo
      [/\'[^\s\)\]\},:\"']+/, 'string'],

      // Brackets
      [/[\(\)\[\]\{\}]/, '@brackets'],

      // Operators/symbols
      [/@symbols/, 'operator'],

      // Keywords and identifiers (Pact identifiers allow many symbols)
      [/[_\w%#\+\-\._&\$@<>=\?\*!\|\/]+/, {
        cases: {
          '@keywords': 'keyword',
          '@default': 'identifier'
        }
      }],

      // whitespace
      [/\s+/, 'white'],
    ],

    string: [
      [/[^\\\"]+/, 'string'],
      [/\\./, 'string.escape'],
      [/\"/, { token: 'string.quote', bracket: '@close', next: '@root' }],
    ],
  },
} as const;


