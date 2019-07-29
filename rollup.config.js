import alias from 'rollup-plugin-alias';
import uglify from 'rollup-plugin-uglify';
import replace from 'rollup-plugin-replace';
import packagejson from './package.json';

var target = process.env.target;
var version = packagejson.version;
var banner, output, input, file, name , min;

switch (target) {
  case 'extag':
    min = false;
    name = 'Extag';
    file = 'extag.js';
    input = 'src/Extag.js';
    break;
  case 'extag-dom':
    min = false;
    name = 'ExtagDom';
    file = 'extag-dom.js';
    input = 'src/views/ExtagDom.js';
    break;
  case 'extag-jsx':
  min = false;
    name = 'ExtagJsx';
    file = 'extag-jsx.js';
    input = 'src/more/ExtagJsx.js';
    break;
  case 'extag-test':
    min = false;
    name = 'Extag';
    file = 'extag.test.js';
    input = 'src/Extag.js';
}

banner = `
/**
 * ${file} v${version}
 * (c) enjolras.chen
 * Released under the MIT License.
 */
`;

var plugins = [
  alias({
    src: `${__dirname}/src`
  }),
  replace({
    delimiters: ['', ''],
    '__ENV__': min ? '"production"' : '"development"',
    '__VERSION__': `"${version}"`,
    'config.env': file.lastIndexOf('.old') > 0 ? 'config.env' : '">=ES5"',
    '//#test': file.lastIndexOf('.test') > 0 ? '' : '//'
  })
];

if (min) {
  plugins.push(uglify());
}

export default {
  input: input,
  output: {
    name: name,
    format: 'umd',
    file: `dist/${file}`,
    banner: banner.trim()
  },
  plugins: plugins
};