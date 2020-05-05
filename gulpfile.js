const gulp = require('gulp');
const rollup = require('rollup');
const alias = require('rollup-plugin-alias');
const uglify = require('rollup-plugin-uglify');
const replace = require('rollup-plugin-replace');
const pkgjson = require('./package.json');

const version = pkgjson.version;

async function build(opts) {
  const format = opts.format || 'umd';
  const input = opts.input;
  const name = opts.name;
  const file = opts.file;
  const banner = `
/**
 * ${name} v${version}
 * (c) enjolras.chen
 * Released under the MIT License.
 */
  `;

  let plugins = [
    alias({
      src: `${__dirname}/src`
    }),
    replace({
      delimiters: ['', ''],
      '//#test': file.lastIndexOf('.test') > 0 ? '' : '//',
      '__ENV__': '"development"',
      '__VERSION__': `"${version}"`
    })
  ];

  let bundle = await rollup.rollup({
    input: `src/${input}`,
    plugins: plugins
  });

  await bundle.write({
    name: name,
    format: format,
    file: `dist/${version}/${file}`,
    banner: banner.trim()
  });

  let i = file.lastIndexOf('.');
  let minfile = file.slice(0, i) + '.min' + file.slice(i);

  plugins = [
    alias({
      src: `${__dirname}/src`
    }),
    replace({
      delimiters: ['', ''],
      '//#test': file.lastIndexOf('.test') > 0 ? '' : '//',
      '__ENV__': '"production"',
      '__VERSION__': `"${version}"`
    }),
    uglify.uglify()
  ]

  bundle = await rollup.rollup({
    input: `src/${input}`,
    plugins: plugins
  });

  await bundle.write({
    name: name,
    format: format,
    file: `dist/${version}/${minfile}`
  });
}


gulp.task('rollup-extag', async function () {
  await build({
    format: 'umd',
    input: 'Extag.js',
    file: 'extag.js',
    name: 'Extag'
  })
});

gulp.task('rollup-extag-test', async function () {
  await build({
    format: 'umd',
    input: 'Extag.js',
    file: 'extag.test.js',
    name: 'Extag'
  })
});

gulp.task('rollup-extag-dom', async function () {
  await build({
    format: 'umd',
    input: 'views/ExtagDom.js',
    file: 'extag-dom.js',
    name: 'ExtagDom'
  })
});

gulp.task('rollup-extag-ssr', async function () {
  await build({
    format: 'umd',
    input: 'views/ExtagSSR.js',
    file: 'extag-ssr.js',
    name: 'ExtagSSR'
  })
});