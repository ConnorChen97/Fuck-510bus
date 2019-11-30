const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');

const url = 'http://www.bjbus.com/home/ajax_rtbus_data.php?act=busTime&selBLine=510&selBDir=5669226867236987371&selBStop=16';

const sendGet = (options) => {
    return new Promise((resolve, reject) => {
        request.get(options, (err, res, body) => {
            if (err) {
                reject(new Error('request get url error'));
            } else {
                resolve({ res, body });
            }
        });  
    });
}

const getHTML = async (url) => {
    const options = {
        url,
        gzip: true,
    };
    const { res, body } = await sendGet(options);
    if (res.statusCode == 200) {
        const html = JSON.parse(body).html;
        return html; 
    }
}

const writeToFile = (data) => {
    fs.writeFile('./bus.html', data, (err) => {
        if (err) throw err;
    });
}

const parseHTML = async () => {
    const HTML = await getHTML(url);
    // writeToFile(HTML);
    const $ = cheerio.load(HTML);
    const content = $('p').text().split('所属客一分公司')[1];
    return content.replace('此', '林萃路口北');
}

const start = async () => {
    const data = await parseHTML();
    console.log(data);
}

start();