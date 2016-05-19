var gulp = require('gulp');

var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var minifyCSS = require('gulp-clean-css');
var rm = require('gulp-rimraf');

var editorJS = ['client/editor/*.js', 'client/editor/components/*.js', 'client/editor/components/*/*.js'];
var editorCSS = ['client/editor/*.css', 'client/editor/components/*/*.css'];
// var gameJS = ['client/game/*.js'];

// lint checks for syntax and JS best practices
gulp.task('lint', function() {
  return gulp.src(editorJS)
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

// clean previously built JS files
gulp.task('cleanJS', function() {
  return gulp.src('client/editor/dist/*.js')
    .pipe(rm());
});

// clean CSS
gulp.task('cleanCSS', function() {
  return gulp.src('client/editor/dist/*.css')
    .pipe(rm());
});

// minify and concat css
gulp.task('css', function() {
  return gulp.src(editorCSS)
    .pipe(concat('all.min.css'))
    .pipe(minifyCSS())
    .pipe(gulp.dest('./client/editor/dist'));
});

// concat and minify JS
gulp.task('scripts', function() {
  return gulp.src(editorJS)
    .pipe(concat('all.js'))
    .pipe(gulp.dest('client/editor/dist'))
    .pipe(rename('all.min.js'))
    .pipe(uglify({ mangle: false }))
    .pipe(gulp.dest('client/editor/dist'));
});

// watch for file changes
gulp.task('watch', function() {
  gulp.watch(editorJS,['lint', 'cleanJS', 'scripts']);
  gulp.watch(editorCSS, ['cleanCSS', 'css']);
});

// clean all built files
gulp.task('clean', ['cleanJS', 'cleanCSS']);

// default task builds and watches
gulp.task('default', ['lint', 'clean', 'css', 'scripts', 'watch']);

// build without watching
gulp.task('build', ['lint', 'clean', 'css', 'scripts']);
