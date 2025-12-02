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
                top: '20mm',
                right: '0px',
                bottom: '20mm',
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

const generateDocx = async (resumeData) => {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, UnderlineType, convertInchesToTwip } = require('docx');

    const children = [];

    // Helper function to format dates
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    };

    const removeProtocol = (url) => {
        return url.replace(/^https?:\/\//, '');
    };

    // Header - Name
    children.push(
        new Paragraph({
            text: resumeData.basics.name,
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 100 },
        })
    );

    // Header - Label/Title
    if (resumeData.basics.label) {
        children.push(
            new Paragraph({
                text: resumeData.basics.label,
                spacing: { after: 200 },
            })
        );
    }

    // Contact Info
    const contactParts = [];
    if (resumeData.basics.email) contactParts.push(resumeData.basics.email);
    if (resumeData.basics.phone) contactParts.push(resumeData.basics.phone);
    if (resumeData.basics.url) contactParts.push(removeProtocol(resumeData.basics.url));
    if (resumeData.basics.profiles) {
        resumeData.basics.profiles.forEach(profile => {
            contactParts.push(removeProtocol(profile.url));
        });
    }

    if (contactParts.length > 0) {
        children.push(
            new Paragraph({
                text: contactParts.join(' | '),
                spacing: { after: 400 },
            })
        );
    }

    // Summary Section
    if (resumeData.basics.summary) {
        children.push(
            new Paragraph({
                text: 'Summary',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 200 },
            })
        );
        children.push(
            new Paragraph({
                text: resumeData.basics.summary,
                spacing: { after: 400 },
            })
        );
    }

    // Work Experience Section
    if (resumeData.work && resumeData.work.length > 0) {
        children.push(
            new Paragraph({
                text: 'Work Experience',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 200 },
            })
        );

        resumeData.work.forEach((job, index) => {
            // Job title and date
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: job.position,
                            bold: true,
                        }),
                        new TextRun({
                            text: ` | ${formatDate(job.startDate)} - ${job.endDate ? formatDate(job.endDate) : 'Present'}`,
                        }),
                    ],
                    spacing: { before: index > 0 ? 300 : 0, after: 100 },
                })
            );

            // Company name
            children.push(
                new Paragraph({
                    text: job.name,
                    spacing: { after: 100 },
                })
            );

            // Summary
            if (job.summary) {
                children.push(
                    new Paragraph({
                        text: job.summary,
                        spacing: { after: 100 },
                    })
                );
            }

            // Highlights
            if (job.highlights && job.highlights.length > 0) {
                job.highlights.forEach(highlight => {
                    children.push(
                        new Paragraph({
                            text: highlight,
                            bullet: { level: 0 },
                            spacing: { after: 80 },
                        })
                    );
                });
            }
        });
    }

    // Education Section
    if (resumeData.education && resumeData.education.length > 0) {
        children.push(
            new Paragraph({
                text: 'Education',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 },
            })
        );

        resumeData.education.forEach((edu, index) => {
            const getYear = (dateString) => {
                if (!dateString) return '';
                return new Date(dateString).getFullYear();
            };

            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `${edu.studyType} in ${edu.area}`,
                            bold: true,
                        }),
                        new TextRun({
                            text: ` | ${getYear(edu.startDate)} - ${getYear(edu.endDate)}`,
                        }),
                    ],
                    spacing: { before: index > 0 ? 200 : 0, after: 100 },
                })
            );

            children.push(
                new Paragraph({
                    text: edu.institution,
                    spacing: { after: 200 },
                })
            );
        });
    }

    // Skills Section
    if (resumeData.skills && resumeData.skills.length > 0) {
        children.push(
            new Paragraph({
                text: 'Skills',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 },
            })
        );

        resumeData.skills.forEach(skill => {
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: skill.name + ': ',
                            bold: true,
                        }),
                        new TextRun({
                            text: skill.keywords.join(' • '),
                        }),
                    ],
                    spacing: { after: 150 },
                })
            );
        });
    }

    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    margin: {
                        top: convertInchesToTwip(0.79),    // 20mm
                        right: convertInchesToTwip(1.18),  // 30mm
                        bottom: convertInchesToTwip(0.79), // 20mm
                        left: convertInchesToTwip(1.18),   // 30mm
                    },
                },
            },
            children: children,
        }],
    });

    return await Packer.toBuffer(doc);
};

module.exports = {
    generateHtml,
    generatePdf,
    generateDocx
};
