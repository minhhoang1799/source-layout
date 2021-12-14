const { src, dest, watch, series, parallel } = require('gulp')
const sass = require('gulp-sass')(require('sass'))
const browsersync = require('browser-sync').create()
const del = require('del')
const htmlhint = require('gulp-htmlhint')
const sassGlob = require('gulp-sass-glob')
const postcss = require('gulp-postcss') //autoprefixerとセット
const autoprefixer = require('autoprefixer') //ベンダープレフィックス付与
const cssdeclsort = require('css-declaration-sorter') //css並べ替え

const paths = {
  dist: './dist',
  src: './src',
}

// Browsersync Tasks
const browser = (cb) => {
  browsersync.init({
    server: paths.dist
  });
  cb();
}

const clear = () => {
  return del(paths.dist)
}
const copy = () => {
  return src(`${paths.src}/assets/**/*`).pipe(dest(`${paths.dist}/assets/`))
}

/* HTML */
const copyHTML = () => {
  return src(`${paths.src}/html/**/*`).pipe(dest(paths.dist))
}
const html = () => {
  return src(`${paths.src}/html/**/*.html`)
    .pipe(htmlhint('.htmlhintrc'))
    // .pipe(htmlhint.reporter())
    .pipe(dest(paths.dist))
};
const lintHTML = () => {
  return src(`${paths.src}/html/**/*.html`)
    .pipe(htmlhint('.htmlhintrc'))
    .pipe(htmlhint.reporter())
}

/* CSS */
const buildCSS = () => {
  return src([
    `${paths.src}/scss/**/*.scss`,
    `!${paths.src}/scss/**/--*.scss`
  ])
    .pipe(sassGlob())
    .pipe(sass({
      outputStyle: 'expanded' //expanded, nested, campact, compressedから選択
    }))
    .pipe(postcss([
      cssdeclsort({ order: 'smacss' }), //プロパティをソートし直す(アルファベット順)
      autoprefixer({
        // ☆IEは11以上、Androidは4.4以上
        // その他は最新2バージョンで必要なベンダープレフィックスを付与する
        "overrideBrowserslist": ["last 2 versions", "ie >= 11", "Android >= 4"],
        cascade: false
      }),
    ]))
    .pipe(dest(`${paths.dist}/assets/css/`))
    .pipe(browsersync.stream())
}

/* JS */
const copyJS = () => {
  return src(`${paths.src}/assets/js/*.js`).pipe(dest(`${paths.dist}/assets/js/`))
}

/* IMAGES */
const copyIMG = () => {
  return src(`${paths.src}/assets/images/**/*`).pipe(dest(`${paths.dist}/assets/images/`))
}

/* FONTS */
const copyFONT = () => {
  return src(`${paths.src}/assets/fonts/**/*`).pipe(dest(`${paths.dist}/assets/fonts/`))
}

/* WATCHING */
const watchFiles = (cb) => {
  function reload(cb2) {
    browsersync.reload()
    cb2()
  }
  watch(`${paths.src}/assets/fonts/**/*`, series(copyFONT, reload))
  watch(`${paths.src}/assets/images/**/*`, series(copyIMG, reload))
  watch(`${paths.src}/assets/js/*.js`, series(copyJS, reload))
  watch(`${paths.src}/scss/**/*.scss`, series(buildCSS))
  watch(`${paths.src}/html/**/*.html`, series(html, reload))
  cb()
}

/* INIT */
const lint = parallel(lintHTML)
const build = series(clear, copy, parallel(copyHTML, buildCSS, copyJS, copyIMG, copyFONT))
const dev = series(build, parallel(browser, watchFiles))

exports.lint = lint
exports.build = build
exports.dev = dev