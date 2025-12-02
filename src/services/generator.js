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
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, convertInchesToTwip } = require('docx');

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

    // Font settings - Roboto, black text, 11pt
    const bodyFont = { name: 'Roboto', size: 22 }; // 11pt = 22 half-points
    const headingFont = { name: 'Roboto', size: 26 }; // 13pt = 26 half-points
    const nameFont = { name: 'Roboto', size: 36 }; // 18pt = 36 half-points
    const textColor = '000000'; // Black

    // Header - Name
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: resumeData.basics.name,
                    font: nameFont.name,
                    size: nameFont.size,
                    bold: true,
                    color: textColor,
                })
            ],
            spacing: { after: 100 },
        })
    );

    // Header - Label/Title
    if (resumeData.basics.label) {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: resumeData.basics.label,
                        font: bodyFont.name,
                        size: bodyFont.size,
                        color: textColor,
                    })
                ],
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
                children: [
                    new TextRun({
                        text: contactParts.join(' | '),
                        font: bodyFont.name,
                        size: bodyFont.size,
                        color: textColor,
                    })
                ],
                spacing: { after: 400 },
            })
        );
    }

    // Summary Section
    if (resumeData.basics.summary) {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'Summary',
                        font: headingFont.name,
                        size: headingFont.size,
                        bold: true,
                        color: textColor,
                    })
                ],
                spacing: { before: 200, after: 200 },
            })
        );
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: resumeData.basics.summary,
                        font: bodyFont.name,
                        size: bodyFont.size,
                        color: textColor,
                    })
                ],
                spacing: { after: 400 },
            })
        );
    }

    // Work Experience Section
    if (resumeData.work && resumeData.work.length > 0) {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'Work Experience',
                        font: headingFont.name,
                        size: headingFont.size,
                        bold: true,
                        color: textColor,
                    })
                ],
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
                            font: bodyFont.name,
                            size: bodyFont.size,
                            bold: true,
                            color: textColor,
                        }),
                        new TextRun({
                            text: ` | ${formatDate(job.startDate)} - ${job.endDate ? formatDate(job.endDate) : 'Present'}`,
                            font: bodyFont.name,
                            size: bodyFont.size,
                            color: textColor,
                        }),
                    ],
                    spacing: { before: index > 0 ? 300 : 0, after: 100 },
                })
            );

            // Company name
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: job.name,
                            font: bodyFont.name,
                            size: bodyFont.size,
                            color: textColor,
                        })
                    ],
                    spacing: { after: 100 },
                })
            );

            // Summary
            if (job.summary) {
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: job.summary,
                                font: bodyFont.name,
                                size: bodyFont.size,
                                color: textColor,
                            })
                        ],
                        spacing: { after: 100 },
                    })
                );
            }

            // Highlights - using standard bullet points
            if (job.highlights && job.highlights.length > 0) {
                job.highlights.forEach(highlight => {
                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: highlight,
                                    font: bodyFont.name,
                                    size: bodyFont.size,
                                    color: textColor,
                                })
                            ],
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
                children: [
                    new TextRun({
                        text: 'Education',
                        font: headingFont.name,
                        size: headingFont.size,
                        bold: true,
                        color: textColor,
                    })
                ],
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
                            font: bodyFont.name,
                            size: bodyFont.size,
                            bold: true,
                            color: textColor,
                        }),
                        new TextRun({
                            text: ` | ${getYear(edu.startDate)} - ${getYear(edu.endDate)}`,
                            font: bodyFont.name,
                            size: bodyFont.size,
                            color: textColor,
                        }),
                    ],
                    spacing: { before: index > 0 ? 200 : 0, after: 100 },
                })
            );

            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: edu.institution,
                            font: bodyFont.name,
                            size: bodyFont.size,
                            color: textColor,
                        })
                    ],
                    spacing: { after: 200 },
                })
            );
        });
    }

    // Skills Section - single column
    if (resumeData.skills && resumeData.skills.length > 0) {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'Skills',
                        font: headingFont.name,
                        size: headingFont.size,
                        bold: true,
                        color: textColor,
                    })
                ],
                spacing: { before: 400, after: 200 },
            })
        );

        resumeData.skills.forEach(skill => {
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: skill.name + ': ',
                            font: bodyFont.name,
                            size: bodyFont.size,
                            bold: true,
                            color: textColor,
                        }),
                        new TextRun({
                            text: skill.keywords.join(' • '),
                            font: bodyFont.name,
                            size: bodyFont.size,
                            color: textColor,
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
