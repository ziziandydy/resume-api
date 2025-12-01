const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const generator = require('../src/services/generator');
const storage = require('../src/services/storage');

const app = express();

app.use(cors());
app.use(bodyParser.json());

// POST /resume
app.post('/resume', async (req, res) => {
    try {
        const resumeData = req.body;

        // Basic validation
        if (!Array.isArray(resumeData) || resumeData.length === 0 || !resumeData[0].basics) {
            return res.status(400).json({ error: 'Invalid resume data format' });
        }

        const data = resumeData[0];
        const id = uuidv4();

        // Generate HTML
        const html = generator.generateHtml(data);
        await storage.saveFile(id, html, 'html');

        // Generate PDF (with error handling for serverless environments)
        let pdfBuffer = null;
        try {
            pdfBuffer = await generator.generatePdf(html);
            await storage.saveFile(id, pdfBuffer, 'pdf');
        } catch (pdfError) {
            console.error('PDF generation failed:', pdfError);
            // Continue without PDF if generation fails
            // The HTML version will still be available
        }

        const response = [
            {
                id: id,
                theme: 'consultant-polished',
                viewUrl: `/resume/${id}`,
                pdfUrl: `/resume/${id}?format=pdf`,
                html: html,
                pdfAvailable: pdfBuffer !== null
            }
        ];

        res.json(response);
    } catch (error) {
        console.error('Error generating resume:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// GET /resume/:id
app.get('/resume/:id', async (req, res) => {
    const { id } = req.params;
    const { format } = req.query;

    try {
        if (format === 'pdf') {
            const fileData = await storage.getFile(id, 'pdf');
            if (!fileData) {
                return res.status(404).send('Resume not found or expired');
            }

            // If it's a URL (Vercel Blob), redirect to it
            if (typeof fileData === 'string' && fileData.startsWith('http')) {
                return res.redirect(fileData);
            }

            // If it's a local file path
            if (typeof fileData === 'string' && fileData.includes('/')) {
                const path = require('path');
                res.contentType('application/pdf');
                return res.sendFile(path.resolve(fileData));
            }

            // If it's a buffer
            res.contentType('application/pdf');
            res.send(fileData);
        } else {
            const fileData = await storage.getFile(id, 'html');
            if (!fileData) {
                return res.status(404).send('Resume not found or expired');
            }

            // If it's a URL (Vercel Blob), fetch and serve the content
            if (typeof fileData === 'string' && fileData.startsWith('http')) {
                const response = await fetch(fileData);
                const html = await response.text();
                res.contentType('text/html');
                return res.send(html);
            }

            // If it's a local file path
            if (typeof fileData === 'string' && fileData.includes('/')) {
                const path = require('path');
                res.contentType('text/html');
                return res.sendFile(path.resolve(fileData));
            }

            // If it's already the content
            res.contentType('text/html');
            res.send(fileData);
        }
    } catch (error) {
        console.error('Error retrieving resume:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// Export the Express app as a serverless function for Vercel
module.exports = app;

