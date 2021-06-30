'use strict';
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const host = 'https://www.pristyncare.com/'; // website under test
const visitedFile = 'visitedUrl.txt'; //Viewed pages
const visitedFilePath = path.join(__dirname, visitedFile);
const brokenlinkFile = 'brokenLink.txt'; //404 link
const brokenlinkFilePath = path.join(__dirname, brokenlinkFile);
const validUrlFile = 'validUrlFile.txt'; //Available links
const validUrlFilePath = path.join(__dirname,validUrlFile);
const parChildMapFile = 'parChildMapFile.txt'; //ParChildMapFile
const parChildMapFilePath = path.join(__dirname,parChildMapFile);

class Url {
    constructor(childUrl, parentUrl) {
        this.childUrl = childUrl;
        this.parentUrl = parentUrl;
    }
}


// Queue class
class Queue
{
    // Array is used to implement a Queue
    constructor()
    {
        this.items = [];
    }

    // Functions to be implemented
    // enqueue(item)
    // dequeue()
    // front()
    // isEmpty()
    // printQueue()

    // enqueue function
    enqueue(element)
    {
        // adding element to the queue
        this.items.push(element);
    }

    // dequeue function
    dequeue()
    {
        // removing element from the queue
        // returns underflow when called
        // on empty queue
        if(this.isEmpty())
            return "Underflow";
        return this.items.shift();
    }

    // front function
    front()
    {
        // returns the Front element of
        // the queue without removing it.
        if(this.isEmpty())
            return "No elements in Queue";
        return this.items[0];
    }

    // isEmpty function
    isEmpty()
    {
        // return true if the queue is empty.
        return this.items.length == 0;
    }

    // printQueue function
    printQueue()
    {
        var str = "";
        for(var i = 0; i < this.items.length; i++)
            str += this.items[i] +" ";
        return str;
    }
}

const q = new Queue();

//q.enqueue("http://pristyncare.com");
q.enqueue(new Url(host, "root"))

let visitedLinkSet = new Set();
let count = 0;

crawlPage();

async function crawlPage() {

    while(!q.isEmpty()) {
        console.log("count: "+count)
        //if(count>100) return;
        count++;
        //console.log("print queue: "+q.printQueue());
        const urlStruct = q.front();
        q.dequeue();
        console.log("url under processe: "+urlStruct.childUrl)
        const parChildMapString = urlStruct.parentUrl+"=="+urlStruct.childUrl;
        console.log(parChildMapString);
        if(visitedLinkSet.has(urlStruct.childUrl)) {
            console.log("already existing url: "+urlStruct.childUrl)
            continue;
        } else {
            console.log("url: "+urlStruct.childUrl+"is not visited")
        }
        visitedLinkSet.add(urlStruct.childUrl);
        if(!isvaildUrl(urlStruct.childUrl)) {
            console.log("url: " + urlStruct.childUrl + " is not valid")
            continue;
        }
        const args = [
            "--disable-setuid-sandbox",
            "--no-sandbox",
            "--blink-settings=imagesEnabled=false",
        ];
        const options = {
            args,
            headless: true,
            ignoreHTTPSErrors: true,
        };
        const browser = await puppeteer.launch(options);
        const page = await browser.newPage();
        let res = await page.goto(urlStruct.childUrl, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        await linktoFile(parChildMapString, parChildMapFilePath);
        if (res && (res.status() == 404 || res.status()==301 || res.status()==307)) {
            await linktoFile(urlStruct.childUrl, brokenlinkFilePath);
        } else {
            await linktoFile(urlStruct.childUrl, validUrlFilePath);
            const hrefs = await page.$$eval('a', as => as.map(a => a.href));
            await page.close();
            await browser.close();

            for(const childUrlIndex in hrefs) {
                //console.log("childurl: "+hrefs[childUrlIndex])
                q.enqueue(new Url(hrefs[childUrlIndex], urlStruct.childUrl));
            }
        }
    }
}

let filetoLinks = async function (filepath) {
    if (! (await fs.existsSync(filepath))) {
        await fs.writeFileSync(filepath, '');

    }
    let data = await fs.readFileSync(filepath, 'utf-8')
    if(!data) return [] ;
    let links = data.trim().split('\n');
    return links;
}
let linktoFile = async function (link, filepath) {
    let foundLinks = await filetoLinks(filepath);
    if (!foundLinks.includes(link)) {
        await fs.appendFileSync(filepath, link + '\n');
    }
}
function isvaildUrl(url){
    if(url.endsWith('jpg') || url.endsWith('pdf') || url.endsWith('css') || !url.includes('pristyncare.com')
    || url.includes('facebook') || url.includes('instagram') || url.includes('twitter') ||
    url.includes('youtube') || url.includes('data') || url.includes('geo')
    || url.includes('javascript') || url.includes('mailto') || url.includes('sms') ||
    url.includes('tel')) {
        return false;
    }
    return true;
}














