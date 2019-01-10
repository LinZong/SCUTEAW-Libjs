const fs = require('fs');

function GetHomepageScore(RawHTMLString) {

    let CourseReg = /<span class="title">(.*?)(?:<\/span>)/g;
    let ScoreReg = /<span class="fraction float_r">([0-9]+?)<\/span>/g;

    let CourseMatch = RawHTMLString.match(CourseReg).slice(1);
    let ScoreMatch = RawHTMLString.match(ScoreReg);
    CourseMatch = CourseMatch.map((it, idx) => {
        return {
            Name: it.replace("<span class=\"title\">", "").replace("</span>", ""),
            Score: ScoreMatch[idx].replace("<span class=\"fraction float_r\">", "").replace("</span>", ""),
        }
    });
    console.log(CourseMatch);
}
let file = fs.readFileSync("Homepage-score.html");
file = file.toString().trim().replace(/[\r\n\t]/g, "");

let Result = GetHomepageScore(file);