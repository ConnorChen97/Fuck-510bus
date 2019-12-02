const fs = require('fs');
const request = require('request');

const cheerio = require('cheerio');
const moment = require('moment');
const nodemailer = require('nodemailer');
const emailConfig = require('./config/email-config.json');
const config = require('./config/config.json');

const url = 'http://www.bjbus.com/home/ajax_rtbus_data.php?act=busTime&selBLine=510&selBDir=5669226867236987371&selBStop=16';

const mailOptions = {
    from: emailConfig.from,
    to: emailConfig.to,
    subject: emailConfig.subject,
    text: emailConfig.text
};

const transporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: {
        user: emailConfig.auth.user,
        pass: emailConfig.auth.pass
    }
});

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

const sendNotify = (data) => {
    // let onTime = false;
    // if (config.fromTime && config.toTime && moment().isBetween(config.fromTime, config.toTime, '')) {
    //     timeRanges = true;
    // }
    // if (!onTime) {
    //     console.log('not onTime');
    //     return false
    // }
    if (data.length >= 55 && data.length <= 60) {
        const stations = data.substr(35, 2);
        const distance = data.substr(41, 4);
        const minite = data.substr(56, 2);
        if ((config.maxMinite && minite <= config.maxMinite) || 
            (config.maxStations && stations <= config.maxStations) || 
            (config.maxDistance && distance <= config.maxDistance)) {
            return true;
        }
    }
    return false;
}

const start = async () => {
    setInterval(async () => {
        const data = await parseHTML();
        mailOptions.text = data;
        const isSendNotify = sendNotify(data);
        console.log(moment().format('YYYY-MM-DD HH:mm:ss ') + data);
        config.emailNotify && isSendNotify && transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    }, 30000);
}

start();