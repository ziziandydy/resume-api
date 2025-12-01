const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
// const puppeteer = require('puppeteer'); // Removed in favor of dynamic import

// Register Handlebars helpers
handlebars.registerHelper('formatDate', (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
});

handlebars.registerHelper('getYear', (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.getFullYear();
});

handlebars.registerHelper('join', (array, separator) => {
    return array.join(separator);
});

handlebars.registerHelper('removeProtocol', (url) => {
    return url.replace(/^https?:\/\//, '');
});

const TEMPLATE_PATH = path.join(__dirname, '../templates/resume.hbs');
const templateSource = fs.readFileSync(TEMPLATE_PATH, 'utf8');
const template = handlebars.compile(templateSource);

const generateHtml = (resumeData) => {
    return template(resumeData);
};

const generatePdf = async (html) => {
    let browser;
    try {
        if (process.env.NODE_ENV === 'production') {
            const chromium = require('@sparticuz/chromium');
            const puppeteer = require('puppeteer-core');

            browser = await puppeteer.launch({
                args: chromium.args,
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath(),
                headless: chromium.headless,
            });
        } else {
            const puppeteer = require('puppeteer');
            browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        }

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '0px',
                right: '0px',
                bottom: '0px',
                left: '0px'
            }
        });
        return pdfBuffer;
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};

module.exports = {
    generateHtml,
    generatePdf
};
