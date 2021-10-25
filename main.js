//libraries used
let minimist=require('minimist');
let puppeteer = require('puppeteer');
let fs=require('fs');
let pdf=require('pdf-lib');
let path=require('path')

//how to run
// node main.js --source=data.json --url=https://www.leetcode.com

//taking input
let args=minimist(process.argv);

let dataJSON=fs.readFileSync(args.source,"utf-8");
let configjso=JSON.parse(dataJSON);

//main-leetcode problem
async function myleetcodebot() {
    //launch a browser using puppeteer
    let browser = await puppeteer.launch({
        headless:false,
        defaultViewport: null,
        args: ['--start-maximized'] 
    });

    //create a new page
    let page = await browser.newPage();
    //go to the input url
    await page.goto(args.url);
    
    //sign-in button
    await page.waitForSelector("a[href='/accounts/login/']");
    await page.click("a[href='/accounts/login/']");
    
    await page.waitForTimeout(5000)

    //input-username
    await page.waitForSelector("input[name='login']");
    await page.type("input[name='login']",configjso.emailid,{delay:30});

    //input-password
    await page.waitForSelector("input[name='password']");
    await page.type("input[name='password']",configjso.password,{delay:30});
    
    //button-login
    await page.waitForSelector("span[class='btn-content__2V4r']");
    await page.click("span[class='btn-content__2V4r']");

    //to select the problems
    await page.waitForSelector("a[href='/problemset/all/']");
    await page.click("a[href='/problemset/all/']");

    
    //urls of all the problems mention on leetcode
    await page.waitForSelector("a.inline-flex.items-center");
    let curls=await page.$$eval("a.inline-flex.items-center",function(atags){
         let problemset=[];
         for(let i=0;i<atags.length;i++){
             let url=atags[i].getAttribute("href");
             problemset.push(url);
         }
         return problemset;
    });

     await handleallproblems(curls,browser); 
     await page.close();
}
  
   //this function is used to handle new page for everygiven url
  async function handleallproblems(uniqueurls,browser){
       for(let i=0;i<uniqueurls.length;i++){
        let ntab=await browser.newPage();   
        await ntab.goto(args.url + uniqueurls[i]);
        await ntab.waitForTimeout(1000);
        await ntab.waitForSelector("h3.title__PM_F");
        let mytopicname=await ntab.$$eval("h3.title__PM_F",function(atags){
            let x=atags[0].textContent;
            return x;
        });

        let allproblems=await ntab.$$eval("div.title-cell__ZGos",function(atags){
             let prb=[];
             for(let j=0;j<atags.length;j++){
                 let myprb=atags[j].textContent;
                 prb.push(myprb);
             }
             return prb;
        });
        
         await createmypdf(mytopicname,allproblems);
        await ntab.close();
        await page.waitForTimeout(1000);
       }
       
  }

//this function is used to create the required pdf
  async function createmypdf(topicname,problems){

    let pdfdoc=await pdf.PDFDocument.create();
    let page=pdfdoc.addPage();
    let YCordinates = 700;
    let pages=pdfdoc.getPages();
    let fpage=pages[0];
    if(fpage){
        page.drawText(topicname,{
            x:150,
            y:800,
            size:25
        });
    }

    for(let i=0;i<problems.length;i++){
        if(YCordinates == 25 || YCordinates < 25) {
            page=pdfdoc.addPage();
            YCordinates=1000;
        }

        page.drawText(problems[i],{
            x:70,
            y:YCordinates,
            size:15
        });

        YCordinates -=25;
    }

    let finalPdf=await pdfdoc.save();
    let pname=await topicname+".pdf";
    let one=path.join(args.data,pname);
    fs.writeFileSync(one,finalPdf);
}
  myleetcodebot();