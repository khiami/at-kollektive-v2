const gulp = require('gulp')
const sass = require('gulp-sass')(require('sass'))
const purgeSourcemaps = require('gulp-purge-sourcemaps')
const concat = require('gulp-concat')

gulp
  .task('sass', ()=> 
    gulp.src('./assets/*.scss')
      .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
      .pipe(gulp.dest('./assets')))

gulp
  .task('watch-sass', ()=> 
    gulp.watch('assets/*.scss', gulp.series('sass')))

gulp
  .task('vendor', ()=> 
    gulp.src([ 
      './node_modules/keen-slider/keen-slider.js',
      ])
    .pipe(concat('vendor.js'))
    .pipe(purgeSourcemaps())
    .pipe(gulp.dest('./assets/')))