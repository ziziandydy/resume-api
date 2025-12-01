const http = require('http');

const payload = [
    {
        "$schema": "https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json",
        "basics": {
            "name": "Tu Chin Lun",
            "label": "Product Manager - Open API",
            "email": "ziziandydy@gmail.com",
            "phone": "+886 929 111 255",
            "url": "https://andismtu.com",
            "summary": "Product Manager with 7+ years of experience leading cross-functional teams and delivering complex digital products and platform solutions, including API integration and AI-driven features. Proven expertise in managing product roadmaps, improving process efficiency, and enhancing partner and customer experiences. Skilled in Agile methodologies and data-driven decision-making to drive impactful B2B2C API products in dynamic industries.",
            "location": {
                "region": "Taiwan"
            },
            "profiles": [
                {
                    "network": "LinkedIn",
                    "username": "",
                    "url": "https://www.linkedin.com/in/anderson-tu/"
                }
            ]
        },
        "work": [
            {
                "name": "Groundhog Inc.",
                "position": "Lead of PM & Product Manager",
                "startDate": "2020-11",
                "summary": "Led product development and delivery of programmatic advertising platforms with extensive API integration and data automation capabilities across multiple countries.",
                "highlights": [
                    "Directed end-to-end delivery of in-house DSP and DMP platforms integrating programmatic supply with multiple SSPs, expanding data sources for precision audience targeting, delivering 30%+ lift in campaign performance.",
                    "Spearheaded design and implementation of AI-driven audience segmentation and targeting features, increasing operational efficiency by 40% through rapid prototyping and cross-team collaboration.",
                    "Implemented a no-code AI-powered automated reporting management system with API integrations, reducing manual workload by 90% and achieving 99.9% on-time report delivery.",
                    "Collaborated with technical teams and external partners to ensure scalable and secure API management, data integrity, and seamless platform evolution to maximize value for partners."
                ]
            },
            {
                "name": "BuckChaf",
                "position": "Project Manager",
                "startDate": "2019-10",
                "endDate": "2020-09",
                "summary": "Managed blockchain-based product development including API-integrated e-commerce and crypto lending features focused on user experience and risk management.",
                "highlights": [
                    "Co-developed two ERC20 crypto wallet e-commerce platforms with standardized development processes to optimize delivery efficiency by 20%.",
                    "Launched Telegram-integrated lending bot providing 15% APY managing assets over $10K, incorporating automated trading and security controls.",
                    "Collaborated with engineers and stakeholders to define product requirements, prioritize features, and deliver secure API integrations in an Agile environment."
                ]
            },
            {
                "name": "CASETEK LTD",
                "position": "Program Manager",
                "startDate": "2018-04",
                "endDate": "2019-07",
                "summary": "Led multiple manufacturing and research projects, managing cross-functional teams and optimizing quality and workflow efficiency.",
                "highlights": [
                    "Headed overall project management for 7 manufacturing projects and 2 research initiatives, leading 4 junior managers coordinating end-to-end execution.",
                    "Implemented quality management systems achieving zero scrap rate and 90% yield rate, and set company records for rapid project ramp-up.",
                    "Applied Agile principles and team leadership to meet production goals on time and within budget."
                ]
            }
        ],
        "education": [
            {
                "institution": "National Taiwan Normal University",
                "area": "Physics",
                "studyType": "Bachelor",
                "startDate": "2011-09",
                "endDate": "2016-06"
            }
        ],
        "skills": [
            {
                "name": "Product Management",
                "level": "Advanced",
                "keywords": [
                    "API Management",
                    "Product Roadmap",
                    "Business Requirements",
                    "Agile/Scrum",
                    "Stakeholder Communication",
                    "Cross-Functional Leadership",
                    "API Strategy",
                    "Data-Driven Decisions"
                ]
            },
            {
                "name": "API Integration & Delivery",
                "level": "Advanced",
                "keywords": [
                    "Open APIs",
                    "API Security",
                    "Version Control",
                    "Release Management",
                    "Partner Engagement",
                    "Technical Collaboration"
                ]
            },
            {
                "name": "Data Analysis & Automation",
                "level": "Advanced",
                "keywords": [
                    "KPI Analysis",
                    "A/B Testing",
                    "Data Visualization",
                    "Automated Reporting",
                    "AI/ML Tools",
                    "Real-Time Bidding"
                ]
            },
            {
                "name": "Technical Tools & Platforms",
                "level": "Intermediate",
                "keywords": [
                    "GitLab",
                    "Figma",
                    "Grafana",
                    "Miro",
                    "Agile Tools",
                    "Blockchain",
                    "Make Automation"
                ]
            }
        ]
    }
];

const postData = JSON.stringify(payload);

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/resume',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Response received');
        try {
            const parsedData = JSON.parse(data);
            console.log('ID:', parsedData[0].id);
            console.log('View URL:', parsedData[0].viewUrl);
            console.log('PDF URL:', parsedData[0].pdfUrl);

            // Verify GET endpoints
            verifyGet(parsedData[0].viewUrl, 'HTML');
            verifyGet(parsedData[0].pdfUrl, 'PDF');

        } catch (e) {
            console.error('Error parsing response:', e);
            console.log('Raw response:', data);
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();

function verifyGet(path, type) {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: path,
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        console.log(`${type} GET STATUS: ${res.statusCode}`);
        console.log(`${type} Content-Type: ${res.headers['content-type']}`);
    });

    req.on('error', (e) => {
        console.error(`problem with ${type} GET request: ${e.message}`);
    });

    req.end();
}
