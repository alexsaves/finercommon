var gulp = require('gulp'),
  mjml = require('gulp-mjml');

var src = {
    email: './fixtures/emails/src/'
  },
  dest = {
    email: './fixtures/emails/dist'
  };

gulp.task('mjml', function () {
  return gulp
    .src(src.email + '**/*.mjml')
    .pipe(mjml())
    .pipe(gulp.dest(dest.email))
});

gulp.task('rawemails', function () {
  return gulp
    .src(src.email + '**/*.txt')
    .pipe(gulp.dest(dest.email))
});

gulp.task('default', ['mjml', 'rawemails']);