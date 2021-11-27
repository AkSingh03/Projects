// npm init -y 

//npm install minimist

//npm install axios

// npm install jsdom

// npm install excel4node

// npm install pdf-lib

// node cric.js --excel=cup.csv --dataFolder=data --source=https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results

let minimist = require("minimist");

let axios = require("axios");

let jsdom = require("jsdom");

let excel = require("excel4node");

let fs = require("fs");

let path = require("path");

let pdf = require("pdf-lib");
const { match } = require("assert");


let args = minimist(process.argv);

//console.log(args.excel);

//console.log(args.datafolder);

//console.log(args.source);

// download using axios
// extract info using jsdom
// 

let responsekaPromise = axios.get(args.source);

responsekaPromise.then(function(response){

    let html = response.data ;

    //console.log(html);

    // ab html se sense nikalenge 

    let dom = new jsdom.JSDOM(html);

    let document = dom.window.document;

    let matches = [] ;

    let matchdivs = document.querySelectorAll("div.match-score-block");

    //console.log(matchDivs.length);

    for(let i = 0 ;i < matchdivs.length; i++) {
        
        let matchdiv = matchdivs[i];

        let match = {

            t1 : "" ,

            t2 : "" ,
            
            t1s : "" ,

            t2s : "" ,

            result : "" ,

            description : "" 

        } ;

        let descriptiondiv = matchdiv.querySelector(" div.match-info.match-info-FIXTURES > div.description");

        match.description = descriptiondiv.textContent ;

        let resultspan = matchdiv.querySelector("div.status-text > span");

        match.result = resultspan.textContent ;

        let teamparas = matchdiv.querySelectorAll("div.name-detail > p.name");

        match.t1 = teamparas[0].textContent ;

        match.t2 = teamparas[1].textContent ;

        let scoreSpans = matchdiv.querySelectorAll("div.score-detail > span.score");

        if (scoreSpans.length == 2){
            
            match.t1s = scoreSpans[0].textContent;
            match.t2s = scoreSpans[1].textContent;

        } else if(scoreSpans.length == 1 ){

            match.t1s = scoreSpans[0].textContent;
            match.t2s = "";

        } else{ 

            match.t1s = "";
            match.t2s = "";
        } 

        matches.push(match);

    }

    //console.log(matches); 
    
    let matchesJSON = JSON.stringify(matches);
    fs.writeFileSync("matches.json", matchesJSON , "utf-8" );


    let teams = [] ;

    for(let i = 0 ; i < matches.length ; i++){

        putTeamInTeamsArrayIfMissing(teams, matches[i]);

        putMatchInAppropriateTeam( teams , matches[i]);


        

    }

    //console.log(teams)
    //console.log(JSON.stringify(teams))

    let teamsJSON = JSON.stringify(teams);
    fs.writeFileSync("teams.json", teamsJSON, "utf-8");

    createExcelFile(teams);

    createFolders(teams);



    




})

function createFolders(teams) {

    fs.mkdirSync(args.dataFolder);
    for(let i = 0; i < teams.length; i++) {

        let teamFN = path.join(args.dataFolder, teams[i].name);

        fs.mkdirSync(teamFN);

        for(let j = 0 ; j < teams[i].matches.length; j++) {

           let matchFileName = path.join(teamFN, teams[i].matches[j].vs + ".pdf");

            createScorecard(teams[i].name, teams[i].matches[j], matchFileName);

        }

    }
}

function createScorecard(teamName , match , matchFileName){

    let t1 = teamName;

    let t2 = match.vs;

    let t1s = match.SelfScore;

    let t2s = match.oppScore;

    let result = match.result;

    let description = match.description;

    let bytesofPDFTemplate = fs.readFileSync("template.pdf");

    let PDFDockaPromise = pdf.PDFDocument.load(bytesofPDFTemplate);

    PDFDockaPromise.then(function(pdfdoc){

        let page = pdfdoc.getPage(0);

        page.drawText(t1 , {

            x : 320 ,
            y : 710 ,
            size : 8
        });

        page.drawText(t2 , {

            x : 320 ,
            y : 696 ,
            size : 8
        });

        page.drawText(t1s , {

            x : 320 ,
            y : 682 ,
            size : 8
        });

        page.drawText(t2s , {

            x : 320 ,
            y : 668 ,
            size : 8
        });

        page.drawText(result , {

            x : 320 ,
            y : 654 ,
            size : 8
        });

        page.drawText(description , {

            x : 320 ,
            y : 640 ,
            size : 8
        });

        let finalPDFByteskaPromise = pdfdoc.save();

        finalPDFByteskaPromise.then(function(finalPDFBytes){

            fs.writeFileSync(matchFileName, finalPDFBytes);
        }) 
    }) 
}



function createExcelFile(teams) {

    let wb = new excel.Workbook();

    for(let i = 0 ; i < teams.length ; i++){

        let sheet = wb.addWorksheet(teams[i].name);

        //sheet.cell(1,1).string("Rank");

        //sheet.cell(1,2).number(teams[i].rank);

        sheet.cell(1,1).string("VS");

        sheet.cell(1,2).string("Self Score");

        sheet.cell(1,3).string("Opp Score");

        sheet.cell(1,4).string("Result");

        sheet.cell(1,5).string("Description");


        for(let j = 0 ; j < teams[i].matches.length;j++) {

            sheet.cell(2 + j , 1).string(teams[i].matches[j].vs);
            sheet.cell(2 + j , 2).string(teams[i].matches[j].SelfScore);
            sheet.cell(2 + j , 3).string(teams[i].matches[j].oppScore);
            sheet.cell(2 + j , 4).string(teams[i].matches[j].result);
            sheet.cell(2 + j , 5).string(teams[i].matches[j].description);

        }
    }

    wb.write(args.excel);


}





function putTeamInTeamsArrayIfMissing(teams, match){ 

    let t1idx = -1;

    for(let i = 0 ; i < teams.length ; i++){

        if(teams[i].name == match.t1){
            t1idx = i;
            break;
        }
    }

    if(t1idx == -1){
        teams.push({
            name : match.t1 ,
            matches : [] 
        });
    }

    let  t2idx = -1;
    for(let i = 0 ; i < teams.length ; i++){

        if(teams[i].name == match.t2){

            t2idx = i;
            break;
        }

    }

    if(t2idx == -1){
        teams.push({
            name : match.t2 ,
            matches : []

        });

    }

}

function putMatchInAppropriateTeam( teams , match){

    let t1idx = -1
    for(let i = 0 ; i < teams.length ; i++){

        if(teams[i].name == match.t1){

            t1idx = i ;
            break ;
        }
        
    }

    let team1 = teams[t1idx];
    team1.matches.push({

        vs : match.t2 ,
        SelfScore : match.t1s ,
        oppScore: match.t2s ,
        result : match.result ,
        description : match.description
    });



    let t2idx = -1
    for(let i = 0 ; i < teams.length ; i++){

        if(teams[i].name == match.t1){

            t2idx = i ;
            break ;
        }
        
    }

    let team2 = teams[t1idx];
    team2.matches.push({

        vs : match.t1 ,
        SelfScore : match.t2s ,
        oppScore: match.t1s ,
        result : match.result ,
        description : match.description
    });




}









