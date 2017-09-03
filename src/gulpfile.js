"use strict";
//---- PARAM-----------
var BUILD_PATH = "../wms/public/";
var SRC_PATH = "./app/";
var BUILD_CONFIG_FILE = SRC_PATH + "build.config.js";

//---------------
var gulp = require("gulp"),
    concat = require("gulp-concat"),
    cssmin = require("gulp-cssmin"),
    htmlmin = require("gulp-htmlmin"),
    uglify = require("gulp-uglify"),
    merge = require("merge-stream"),
    del = require("del"),
    rename = require("gulp-rename"),
    buffer = require("vinyl-buffer"),
    //browserify = require("browserify"),
    //tsify = require("tsify"),
    //source = require("vinyl-source-stream"),
    sourcemaps = require("gulp-sourcemaps"),
    inject = require("gulp-inject"),
    sass = require("gulp-sass"),
    ts = require("gulp-typescript"),
    tsReference = require("gulp-ts-reference"),
    runSequence = require("run-sequence"),
    cssBase64 = require("gulp-css-base64");

//---------- SCRIPTS
var SCRIPT_PATH = SRC_PATH + "scripts/";
var SCRIPT_TS_PATH = SCRIPT_PATH + "ts/";
var tsProject = ts.createProject(SCRIPT_TS_PATH + "tsconfig.json");
gulp.task("script:compile", function () {
    return tsProject.src()
        .pipe(sourcemaps.init({
            loadMaps: false
        }))
        .pipe(tsProject())
        .on("error", function (error) {
            process.exit(1);
        })
        .js
        .pipe(sourcemaps.write(".", {
            //    includeContent:false
        }))
        .pipe(gulp.dest(SCRIPT_TS_PATH))
});
gulp.task("script:min", function () {
    return gulp.src(SRC_PATH + "scripts/app.js")
        .pipe(sourcemaps.init({
            loadMaps: false
        }))
        .pipe(uglify())
        .pipe(rename({
            suffix: ".min"
        }))
        .pipe(sourcemaps.write(".", {
            //            includeContent:false
        }))
        .pipe(gulp.dest(SCRIPT_PATH));
});
gulp.task("script:ref", function () {
    var dest = SRC_PATH + "scripts/app.d.ts";
    gulp.src(SRC_PATH + "scripts/ts/**/*.ts")
        .pipe(tsReference(dest))
        .pipe(gulp.dest(dest));
});
gulp.task("script", function (callback) {
    runSequence(["script:ref", "script:compile"]
        //    ,"script:min" //tidak usah dimin, nanti di min bareng html
        , callback);
});

//---------- STYLE
var STYLE_SRC_PATH = SRC_PATH + "styles/";
gulp.task("style", function () {
    return gulp.src(STYLE_SRC_PATH + "scss/app.scss")
        .pipe(sass().on("error", sass.logError))
        .on("error", function (error) {
            process.exit(1);
        })
        .pipe(gulp.dest(STYLE_SRC_PATH))
    //        .pipe(cssmin()) //tidak usah dimin, nanti di min bareng html
    //        .pipe(rename("app.min.css"))
    //        .pipe(gulp.dest(STYLE_SRC_PATH))
    ;
});

//---------- PARTS
var PART_SRC_PATH = SRC_PATH + "parts/";
var partTSProject = ts.createProject(PART_SRC_PATH + "ts/tsconfig.json");
gulp.task("part:ts", function () {
    //compile, reform
    return partTSProject.src()
        .pipe(partTSProject())
        .on("error", function (error) {
            process.exit(1);
        })
        .js
        .pipe(gulp.dest(PART_SRC_PATH + "_"));
});
gulp.task("part:scss", function () {
    return gulp.src(PART_SRC_PATH + "scss/**/*.scss")
        .pipe(sass().on("error", sass.logError))
        .on("error", function (error) {
            process.exit(1);
        })
        .pipe(gulp.dest(PART_SRC_PATH + "_/css"))
});
gulp.task("part:merge", function () {
    var BUILD_PART_PATH = BUILD_PATH + "parts";
    gulp.src(PART_SRC_PATH + "html/**/[^_]*.html")
        //inject html
        .pipe(inject(gulp.src(SRC_PATH + "**/*.html"), {
            relative: true,
            starttag: "<!-- inject:{{path}} -->",
            transform: function (filePath, file) {
                // return file contents as string 
                return file.contents.toString("utf8")
            }
        }))
        //inject scripts
        .pipe(inject(gulp.src(SRC_PATH + "**/*.js"), {
            relative: true,
            starttag: "<!-- inject:{{path}} -->",
            transform: function (filePath, file) {
                // return file contents as string 
                return "<script>" + file.contents.toString("utf8") + "</script>"
            }
        }))
        //inject styles
        .pipe(inject(gulp.src(PART_SRC_PATH + "**/*.css"), {
            relative: true,
            starttag: "<!-- inject:{{path}} -->",
            transform: function (filePath, file) {
                // return file contents as string 
                return "<style>" + file.contents.toString("utf8") + "</style>"
            }
        }))
        .pipe(gulp.dest(BUILD_PART_PATH))
        //minify
        .pipe(htmlmin({
            collapseWhitespace: true,
            minifyCSS: true,
            minifyJS: true,
            removeComments: true
        }))
        .pipe(rename({
            suffix: ".min"
        }))
        .pipe(gulp.dest(BUILD_PART_PATH));
});
gulp.task("part:clean", function () {
    return del(PART_SRC_PATH + "_");
});

//------------------ FONTS --------------
gulp.task("font:embed", function () {
    var FONT_SRC_PATH = SRC_PATH + "fonts/";
    return gulp.src(FONT_SRC_PATH + "*[^(.embed)].css")
        .pipe(cssBase64(
        //     {
        //     baseDir: FONT_SRC_PATH,
        //     maxWeightResource: 100,
        //     //extensionsAllowed: [".png", ".woff2"]
        // }
        ))
        .pipe(rename({
            suffix: ".embed"
        }))
        .pipe(gulp.dest(FONT_SRC_PATH));
});

//------------------- INDEX --------------
gulp.task("index:merge", function () {
    gulp.src(SRC_PATH + "index.html")
        //inject config
        .pipe(inject(gulp.src(BUILD_CONFIG_FILE), {
            relative: true,
            starttag: "<!-- inject:config -->",
            transform: function (filePath, file) {
                // return file contents as string 
                return "<script>" + file.contents.toString("utf8") + "</script>"
            }
        }))
        //inject scripts
        .pipe(inject(gulp.src(SRC_PATH + "**/*.js"), {
            relative: true,
            starttag: "<!-- inject:{{path}} -->",
            transform: function (filePath, file) {
                // return file contents as string 
                return "<script>" + file.contents.toString("utf8") + "</script>"
            }
        }))
        //inject styles
        .pipe(inject(gulp.src(SRC_PATH + "**/*.css"), {
            relative: true,
            starttag: "<!-- inject:{{path}} -->",
            transform: function (filePath, file) {
                // return file contents as string 
                return "<style>" + file.contents.toString("utf8") + "</style>"
            }
        }))
        .pipe(gulp.dest(BUILD_PATH))
        //minify
        .pipe(htmlmin({
            collapseWhitespace: true,
            minifyCSS: true,
            minifyJS: true,
            removeComments: true
        }))
        .pipe(rename({
            suffix: ".min"
        }))
        .pipe(gulp.dest(BUILD_PATH));
});

//--------------------------------------------------------
gulp.task("watch", function () {
    gulp.watch(SCRIPT_TS_PATH + "**/*.ts", ["script"])
    gulp.watch(STYLE_SRC_PATH + "**/*.scss", ["style"])

    gulp.watch(PART_SRC_PATH + "**/*.ts", ["part:ts"])
    gulp.watch(PART_SRC_PATH + "**/*.scss", ["part:scss"])
});

//-------------------------------------------------
gulp.task("clean", function () {
    return del(BUILD_PATH);
});
gulp.task("move", function () {
    return merge([
        // gulp.src([
        //     SRC_PATH+"index.html",
        //     SRC_PATH+"index.min.html",
        //     SRC_PATH+"index.min.html/map"
        // ]).pipe(gulp.dest(BUILD_PATH)),

        // //scripts
        // gulp.src([
        //     SRC_PATH+"scripts/app.js",
        //     SRC_PATH+"scripts/app.min.js",
        //     SRC_PATH+"scripts/app.min.js.map",
        // ]).pipe(gulp.dest(BUILD_PATH + "scripts")),

        // //styles
        // gulp.src([
        //     SRC_PATH+"styles/app.css",
        //     SRC_PATH+"styles/app.min.css",
        //     SRC_PATH+"styles/app.min.css.map",
        // ]).pipe(gulp.dest(BUILD_PATH + "styles")),

        // //libs
        // gulp.src([
        //     SRC_PATH + "libs/bundle.js",
        //     SRC_PATH + "libs/bundle.min.js",
        //     SRC_PATH + "libs/bundle.min.js.map",
        //     SRC_PATH + "libs/bundle.css",
        //     SRC_PATH + "libs/bundle.min.css",
        //     SRC_PATH + "libs/bundle.min.css.map",
        // ]).pipe(gulp.dest(BUILD_PATH + "libs")),

        //fonts
        gulp.src([
            SRC_PATH + "fonts/**/*",
        ]).pipe(gulp.dest(BUILD_PATH + "fonts")),

        //images
        gulp.src([
            SRC_PATH + "img/**/*",
        ]).pipe(gulp.dest(BUILD_PATH + "img")),

        // //publish config
        // gulp.src(SRC_PATH+"build.config.js")
        //     .pipe(rename("config.js.sample"))
        //     .pipe(gulp.dest(BUILD_PATH)),
    ]);
});

//build app
gulp.task("build", function (callback) {
    runSequence(
        ["part:ts", "part:scss"], ["script", "style"],
        "part:merge",
        "move",
        "index:merge",
        callback);
});

//setup project
gulp.task("dev", function (callback) {
    runSequence(
        ["script", "style"],
        ["part:ts", "part:scss"], 
        callback);
});