const express = require('express');
const router = express.Router(); 
const request = require('request');
const got     = require('got');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

let browser;

router.get('/',async(req,res) => {
    res.render('wsearch');
});

async function scrapeData(url,page) {
    try{
        await page.goto(url, {waitUntil : 'load', timeout : 0});
        const html = await page.evaluate(() => document.body.innerHTML);

        const $ = await cheerio.load(html);
        
        let title = $("h2").text();
        let releaseDate = $(".release_date").text();
        let overview = $(".overview > p").text();
        let userScore = $(".user_score_chart").attr("data-percent");
        let imgUrl = $("#main > section > div.header.large.border.first.lazyloaded > div > div > section > div.poster > div.image_content > a > img").attr("src");

        imgUrl = imgUrl.replace('_filter(blur)','');

        let crewLength = $("div.header_info > ol > li").length;

        let crew =[];

        for(let i=1; i<=crewLength; i++) {
            let name = $("div.header_info > ol > li:nth-child("+i+") > p:nth-child(1)").text();
            let role = $("div.header_info > ol > li:nth-child("+i+") > p.character").text();

            crew.push({
                "name" : name,
                "role" : role
            });
        }

        


        browser.close();
        
        return {
            title,
            releaseDate,
            overview,
            userScore,
            imgUrl,
            crew
            
        }
    }catch(ex) {
        console.log(ex);
    }
}

router.get('/results', async function (req, res) {

    let url = req.query.search;

    browser = await puppeteer.launch({headless : false});
    const page = await browser.newPage();

    let data = await scrapeData(url, page);
    res.render('wresults', {data:data});
    
});

module.exports = router;