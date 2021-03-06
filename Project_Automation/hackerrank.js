// node hackerrank.js --url=https://www.hackerrank.com --config=config.json

// npm init -y

// npm install minimist

// npm install puppeteer

let minimist = require("minimist");

let puppeteer = require("puppeteer");

let fs = require("fs") ;

let args = minimist(process.argv);

//console.log(args.url);

//console.log(args.config);

let configJSON = fs.readFileSync(args.config , "utf-8");

let configJSO = JSON.parse(configJSON);

//console.log(config.userid);

//console.log(config.password);

//console.log(config.moderators);

async function run() {

    let browser = await puppeteer.launch ({

        headless : false ,

        args : [

            ' --start-maximized '
        ] ,
        defaultViewport : null 
    }) ;

    let pages = await browser.pages();

    let page = pages[0];

    // open url

    await page.goto(args.url) ;

     // click login 1

    await page.waitForSelector(" a[data-event-action = 'Login']");

    await page.click("a[data-event-action='Login']");

    // click login 2

   await page.waitForSelector("a[href= 'https://www.hackerrank.com/login']");

   await page.click("a[href= 'https://www.hackerrank.com/login']");

    // username 

    await page.waitForSelector("input[name='username']");

    await page.type("input[name='username']", configJSO.userid , { delay: 20 });

    // password

    await page.waitForSelector("input[ name ='password']");

    await page.type("input[name='password']", configJSO.password , { delay: 20 });

    await page.waitFor(3000);

    //click login on page 3

    await page.waitForSelector("button[data-analytics='LoginPassword' ]");

    await page.click("button[data-analytics='LoginPassword' ]");


    // compete

    await page.waitForSelector("a[data-analytics='NavBarContests']");

    await page.click("a[data-analytics='NavBarContests']");

    //manage contests

    await page.waitForSelector("a[href='/administration/contests/']");

    await page.click("a[href='/administration/contests/']");


 // find number of pages 

     await page.waitForSelector("a[data-attr1='Last']");

    let numPages = await page.$eval("a[data-attr1='Last']", function (atag) {

       let totPages = parseInt(atag.getAttribute("data-page"));

        return totPages;
    });

    //  call function handleAllcontestsofaSinglePage

    for (let i = 1; i <= numPages; i++) {

        await handleAllcontestsofaSinglePage(page, browser);

        //right arrow click after all done from a single

       if (i != numPages) {

        await page.waitForSelector("a[data-attr1='Right']");

        await page.click("a[data-attr1='Right']");

        }
    }
       await page.close();

       console.log(" Aur Kaam Hogya Sarkaar :) ");
 }






     async function handleAllcontestsofaSinglePage(page , browser){

     //find urls

     await page.waitForSelector("a.backbone.block-center");
        
     let curls = await page.$$eval("a.backbone.block-center", function(atags){

     let urls = [] ;

        for(let i = 0 ; i< atags.length ; i++){

            let url = atags[i].getAttribute("href");

            urls.push(url);
              }

          return  urls ;
      });

    


     for(let i = 0 ; i< curls.length; i++){

         let ctab = await browser.newPage();

         await SaveModeratorIncontest(ctab, args.url + curls[i], configJSO.moderator);

         await ctab.close();

         await page.waitFor(3000);

        }
    }
    //chances of mistake

    async function SaveModeratorIncontest( ctab , fullcurl , moderator){

      await ctab.bringToFront();

      await ctab.goto(fullcurl);

      await ctab.waitFor(3000);

      // add moderator 

      await ctab.waitForSelector("li[data-tab='moderators']");

      await ctab.click("li[data-tab='moderators']");

     // type moderator

      await ctab.waitForSelector("input#moderator");

      await ctab.type("input#moderator", moderator, { delay : 50 });

        // press enter

      await ctab.keyboard.press("Enter");
    }



run();




