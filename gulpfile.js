const gulp = require('gulp');
const fs = require('fs');

var src = {
    email: './fixtures/emails/src/'
  },
  dest = {
    email: './fixtures/emails/dist/'
  };

// Text-only emails
gulp.task('rawemails', function (cb) {
  var fls = fs.readdirSync(src.email),
    basetemplate = fs
      .readFileSync(src.email + "_base_raw.txt")
      .toString();
  for (var i = 0; i < fls.length; i++) {
    let file = fls[i];
    if (file.indexOf("_base") == -1 && file.indexOf("_raw.txt") > -1) {
      let fcontents = fs
        .readFileSync(src.email + file)
        .toString();
      fcontents = basetemplate.replace(/\<\%\= main \%\>/, fcontents);
      
      fs.writeFileSync(dest.email + file, fcontents);
    }
  }
});

gulp.task('default', ['rawemails']);