const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const generator = require('./services/generator');
const storage = require('./services/storage');

const app = express();
const PORT = process.env.PORT || 3000;

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
        storage.saveFile(id, html, 'html');

        // Generate PDF
        const pdfBuffer = await generator.generatePdf(html);
        storage.saveFile(id, pdfBuffer, 'pdf');

        const response = [
            {
                id: id,
                theme: 'consultant-polished',
                viewUrl: `/resume/${id}`,
                pdfUrl: `/resume/${id}?format=pdf`,
                html: html
            }
        ];

        res.json(response);
    } catch (error) {
        console.error('Error generating resume:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /resume/:id
app.get('/resume/:id', (req, res) => {
    const { id } = req.params;
    const { format } = req.query;

    if (format === 'pdf') {
        const filePath = storage.getFile(id, 'pdf');
        if (!filePath) {
            return res.status(404).send('Resume not found or expired');
        }
        res.contentType('application/pdf');
        res.sendFile(filePath);
    } else {
        const filePath = storage.getFile(id, 'html');
        if (!filePath) {
            return res.status(404).send('Resume not found or expired');
        }
        res.contentType('text/html');
        res.sendFile(filePath);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
