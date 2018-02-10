const gulp = require('gulp');
const fs = require('fs');
const mjml = require('mjml');

var src = {
    email: './fixtures/emails/src/'
  },
  dest = {
    email: './fixtures/emails/dist/'
  };

// Rich html emails
gulp.task('mjml', function (cb) {
  var fls = fs.readdirSync(src.email),
    basetemplate = fs
      .readFileSync(src.email + "_base.mjml")
      .toString();
  for (var i = 0; i < fls.length; i++) {
    let file = fls[i];
    if (file.indexOf("_base") == -1 && file.indexOf(".mjml") > -1) {
      let fcontents = fs
        .readFileSync(src.email + file)
        .toString();
      var finalTemplate = basetemplate.replace(/\<\%\= main \%\>/, fcontents);
      //console.log(finalTemplate);
      fcontents = mjml.mjml2html(finalTemplate);
      
      if (fcontents.errors.length > 0) {
        console.log("Errors", fcontents.errors);
      }
      fs.writeFileSync(dest.email + file.replace(".mjml", ".html"), fcontents.html);
    }
  }
});

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

gulp.task('default', ['mjml', 'rawemails']);