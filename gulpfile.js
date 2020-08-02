const fs = require('fs');
const gulp = require('gulp');
const rollup = require('rollup');
const alias = require('rollup-plugin-alias');
const uglify = require('rollup-plugin-uglify');
const replace = require('rollup-plugin-replace');

function rmDirSync(base) {
  let files = [];
  if(fs.existsSync(base)){
      files = fs.readdirSync(base);
      for (let i = 0; i < files.length; ++i) {
        let path = base + "/" + files[i];
          if(fs.statSync(path).isDirectory()){
            rmDirSync(path); 
          } else {
            fs.unlinkSync(path);
          }
      }
      fs.rmdirSync(base);
  }
}

function copyFilesSync(files, src, dst) {
  if (!files) {
    files = fs.readdirSync(src);
  }
  for (let i = 0; i < files.length; ++i) {
    let file = files[i];
    // if (!fs.existsSync(src + '/' + file)) {
    //   continue;
    // }
    if (file.indexOf('/') > 0) {
      file = file.slice(0, file.indexOf('/'));
    }
    if (fs.statSync(src + '/' + file).isDirectory()) {
      fs.mkdirSync(dst + '/' + file);
      copyFilesSync(null, src + '/' + file, dst + '/' + file)
    } else {
      fs.copyFileSync(src + '/' + file, dst + '/' + file);
    }
  }
}

function exclude(some, files) {
  const list = [];
  for (let i = 0; i < files.length; ++i) {
    let index = some.indexOf(files[i]);
    if (index < 0) {
      list.push(files[i]);
    }
  }
  return list;
}

async function build(opts) {
  const format = opts.format || 'umd';
  const input = opts.input;
  const name = opts.name;
  const file = opts.file;
  const pack = opts.pack;

  let packageDir = '.'
  if (pack && name !== 'Extag') {
    packageDir = `npm/${pack}`;
  } 
  const pkgjson = JSON.parse(fs.readFileSync(packageDir + '/package.json'));
  const version = pkgjson.version;

  const banner = `
/**
 * ${name} v${version}
 * (c) 2017-present enjolras.chen
 * Released under the MIT License.
 */
  `;

  let plugins = [
    alias({
      src: `${__dirname}/src`
    }),
    replace({
      delimiters: ['', ''],
      '//@test': file.lastIndexOf('.test.') > 0 ? '' : '//',
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
    file: `dist/${file}`,
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
      '//@test': file.lastIndexOf('.test.') > 0 ? '' : '//',
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
    file: `dist/${minfile}`
  });

  if (!pack) {
    return;
  }

  if (!fs.existsSync(packageDir)) {
    fs.mkdirSync(packageDir);
  }
  let versionDir = `npm/${pack}/v${version}`;
  if (fs.existsSync(versionDir)) {
    rmDirSync(versionDir);
  }
  let targetDir = versionDir + '/dist';
  fs.mkdirSync(targetDir, {recursive: true});

  if (name !== 'Extag') {
    copyFilesSync(exclude('dist/', pkgjson.files), packageDir, versionDir);
  } else {
    copyFilesSync(exclude('dist/', pkgjson.files), '.', versionDir);
  }
  copyFilesSync([file, minfile], 'dist', targetDir);
}

gulp.task('rollup-extag', async function () {
  await build({
    format: 'umd',
    input: 'Extag.js',
    file: 'extag.js',
    name: 'Extag',
    pack: 'extag'
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
    input: 'more/extag-dom/index.js',
    file: 'extag-dom.js',
    pack: 'extag-dom',
    name: 'ExtagDOM'
  })
});

gulp.task('rollup-extag-ssr', async function () {
  await build({
    format: 'umd',
    input: 'more/ExtagSSR.js',
    file: 'extag-ssr.js',
    pack: 'extag-ssr',
    name: 'ExtagSSR'
  })
});