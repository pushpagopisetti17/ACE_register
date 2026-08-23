const path = require('path');
require('dotenv').config({
    path: path.join(__dirname, '.env')
});

const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

const app = express();

app.use(
    '/assets',
    express.static(path.join(__dirname, 'templates'))
);

const PORT = process.env.PORT || 5001;


// ─── CORS ─────────────────────────────────────────────────────────────────────

app.use(
    cors({
        origin:
            process.env.FRONTEND_URL ||
            'http://localhost:5173',

        methods: ['POST', 'GET', 'OPTIONS'],

        allowedHeaders: ['Content-Type'],
    })
);

app.use(bodyParser.json());


// ─── MongoDB Atlas Connection ────────────────────────────────────────────────

mongoose
    .connect(process.env.MONGODB_URL)
    .then(() => {
        console.log('✅ Connected to MongoDB Atlas');
    })
    .catch((err) => {
        console.error(
            '❌ MongoDB connection error:',
            err.message
        );
    });


// ─── Registration Schema ─────────────────────────────────────────────────────

const registrationSchema = new mongoose.Schema(
    {
        ace_id: {
            type: String,
            required: true,
            unique: true,
        },

        name: {
            type: String,
            required: true,
        },

        email: {
            type: String,
            required: true,
        },

        phone: {
            type: String,
            required: true,
            unique: true,
        },

        branch: {
            type: String,
            required: true,
        },

        year: {
            type: String,
            required: true,
        },

        gender: {
            type: String,
            required: true,
        },

        payment: {
            type: String,
            required: true,
        },

        goodies: {
            type: String,
            required: true,
        },

        timestamp: {
            type: String,
        },
    }
);

const Registration = mongoose.model(
    'Registration',
    registrationSchema
);


// ─── Counter Schema ──────────────────────────────────────────────────────────
// Used for generating:
// 26ACEC001
// 26ACEC002
// 26ACEC003
// etc.

const counterSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
    },

    seq: {
        type: Number,
        default: 0,
    },
});

const Counter = mongoose.model(
    'Counter',
    counterSchema
);


// ─── Nodemailer ───────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
    service: 'gmail',

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});


// ─── Pre-load image buffers ──────────────────────────────────────────────────

const assetsPath = path.join(
    __dirname,
    'templates'
);

const IMG = {};

for (
    const file of [
        'bg1.jpg',
        'hod_sign.png',
        'sec_sign.png'
    ]
) {

    const fp = path.join(
        assetsPath,
        file
    );

    if (fs.existsSync(fp)) {

        IMG[file] =
            fs.readFileSync(fp);

        console.log(
            `Loaded image buffer: ${file}`
        );

    } else {

        console.warn(
            `Image not found at startup: ${fp}`
        );
    }
}


// ─── PDF Generation ──────────────────────────────────────────────────────────

const CM = 28.346;

function generatePDF(data) {

    const {
        ace_id,
        name,
        phone,
        email,
        year,
        gender,
        branch,
        goodies,
        payment
    } = data;

    return new Promise(
        (resolve, reject) => {

            const doc =
                new PDFDocument({
                    size: 'A4',
                    margin: 0
                });

            const chunks = [];

            doc.on(
                'data',
                (c) => chunks.push(c)
            );

            doc.on(
                'end',
                () => {
                    resolve(
                        Buffer.concat(chunks)
                    );
                }
            );

            doc.on(
                'error',
                reject
            );


            // ── Background ─────────────────────────────────────────────────

            if (IMG['bg1.jpg']) {

                doc.image(
                    IMG['bg1.jpg'],
                    0,
                    0,
                    {
                        width: 595.28,
                        height: 841.89
                    }
                );
            }


            // ── Layout ─────────────────────────────────────────────────────

            const left =
                3 * CM;

            const cw =
                595.28 - 6 * CM;

            let y =
                (0.5 + 4.3) * CM;


            // ── Title ──────────────────────────────────────────────────────

            doc
                .font('Helvetica-Bold')
                .fontSize(18)
                .fillColor('#000000')
                .text(
                    'Enrollment Confirmation',
                    left,
                    y,
                    {
                        width: cw,
                        align: 'center'
                    }
                );

            y += 35;


            // ── Name + ID ──────────────────────────────────────────────────

            doc
                .font('Helvetica')
                .fontSize(11)
                .fillColor('#000000')
                .text(
                    'Dear ',
                    left,
                    y,
                    {
                        continued: true
                    }
                );

            doc
                .font('Helvetica-Bold')
                .fillColor('#0066cc')
                .text(`${name},`);

            doc
                .font('Helvetica-Bold')
                .fontSize(11)
                .fillColor('#0066cc')
                .text(
                    `ID: ${ace_id}`,
                    left,
                    y,
                    {
                        width: cw,
                        align: 'right'
                    }
                );

            y += 22;


            // ── Body ───────────────────────────────────────────────────────

            doc
                .font('Helvetica')
                .fontSize(10)
                .fillColor('#000000')
                .text(
                    'We, ACE, are pleased to confirm your approval as a valued member of the ASSOCIATION OF COMPUTER ENGINEERS (ACE) under the DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING. This confirmation serves as official documentation of your membership and includes your ACE identification details. We are confident that this association will empower your professional journey, strengthen your technical expertise, and play a significant role in your continued success.',
                    left,
                    y,
                    {
                        width: cw,
                        align: 'justify'
                    }
                );

            y =
                doc.y + 15;


            // ── Submitted Details ──────────────────────────────────────────

            doc
                .font('Helvetica-Bold')
                .fontSize(12)
                .fillColor('#000000')
                .text(
                    'SUBMITTED DETAILS',
                    left + 15,
                    y
                );

            y =
                doc.y + 5;


            // ── Registration details ───────────────────────────────────────

            const rows = [

                ['ACE Regd.NO', ace_id],

                ['Name', name],

                ['Phone Number', phone],

                ['Email', email],

                ['Year Of Study', year],

                ['Gender', gender],

                ['Department', branch],

                ['Goodies', goodies],

                ['Payment Mode', payment],

            ];


            for (
                const [label, value]
                of rows
            ) {

                doc
                    .font('Helvetica')
                    .fontSize(10)
                    .fillColor('#000000')
                    .text(
                        `${label} : `,
                        left + 15,
                        y,
                        {
                            continued: true
                        }
                    );

                doc
                    .font('Helvetica-Bold')
                    .fillColor('#0066cc')
                    .text(
                        value || ''
                    );

                y =
                    doc.y + 2;
            }


            y += 8;


            doc
                .font('Helvetica-Bold')
                .fontSize(10)
                .fillColor('#000000')
                .text(
                    'This invoice declares that the above information submitted is true.',
                    left + 15,
                    y,
                    {
                        width: cw
                    }
                );


            // ── Signatures ──────────────────────────────────────────────────

            const sigBottomEdge =
                841.89 - 1.5 * CM;

            const sigImgH = 45;

            const sigImgY =
                sigBottomEdge -
                sigImgH -
                20;

            const sigLabelY =
                sigBottomEdge - 18;

            const sigW = 150;


            // HOD

            if (IMG['hod_sign.png']) {

                doc.image(
                    IMG['hod_sign.png'],
                    1.2 * CM,
                    sigImgY,
                    {
                        height: sigImgH
                    }
                );
            }

            doc
                .font('Helvetica')
                .fontSize(9)
                .fillColor('#000000')
                .text(
                    '(Head of CSE Dept)',
                    1.2 * CM,
                    sigLabelY,
                    {
                        width: sigW,
                        align: 'center'
                    }
                );


            // Secretary

            const rightX =
                595.28 -
                1.2 * CM -
                sigW;

            if (IMG['sec_sign.png']) {

                doc.image(
                    IMG['sec_sign.png'],
                    rightX,
                    sigImgY,
                    {
                        height: sigImgH
                    }
                );
            }

            doc
                .font('Helvetica')
                .fontSize(9)
                .fillColor('#000000')
                .text(
                    '(Secretary of ACE)',
                    rightX,
                    sigLabelY,
                    {
                        width: sigW,
                        align: 'center'
                    }
                );


            doc.end();
        }
    );
}


// ─── Generate ACE ID ─────────────────────────────────────────────────────────

async function generateACEID() {

    const counter =
        await Counter.findOneAndUpdate(

            {
                _id: 'ace_id'
            },

            {
                $inc: {
                    seq: 1
                }
            },

            {
                new: true,
                upsert: true
            }
        );

    return (
        `26ACEC${counter.seq
            .toString()
            .padStart(3, '0')}`
    );
}


// ─── POST /register ──────────────────────────────────────────────────────────

app.post(
    '/register',
    async (req, res) => {

        try {

            // These EXACTLY match your frontend

            const {
                name,
                email,
                phone,
                branch,
                year,
                gender,
                payment,
                goodies
            } = req.body;


            // ── Duplicate phone check ──────────────────────────────────────

            const existing =
                await Registration.findOne({
                    phone
                });


            if (existing) {

                console.log(
                    `Duplicate phone: ${phone}`
                );

                return res.status(409).json({
                    error:
                        'Phone number already registered'
                });
            }


            // ── Generate ACE ID ─────────────────────────────────────────────

            const ace_id =
                await generateACEID();


            // ── Timestamp ──────────────────────────────────────────────────

            const timestamp =
                new Date().toLocaleString(
                    'en-IN',
                    {
                        timeZone:
                            'Asia/Kolkata'
                    }
                );


            // ── Send response immediately ───────────────────────────────────

            res.status(200).json({
                success: true,
                ace_id
            });


            // ── Background processing ──────────────────────────────────────

            setImmediate(
                async () => {

                    try {

                        // Generate PDF + invitation link

                        const [
                            buffer,
                            inviteResp
                        ] =
                            await Promise.all([

                                generatePDF({
                                    ace_id,
                                    name,
                                    phone,
                                    email,
                                    year,
                                    gender,
                                    branch,
                                    goodies,
                                    payment
                                }),

                                axios
                                    .get(
                                        `${process.env.INV_SERVER_URL}/generate`
                                    )
                                    .catch(
                                        (err) => {

                                            console.warn(
                                                'Invite fetch failed (non-fatal):',
                                                err.message
                                            );

                                            return {
                                                data: {
                                                    link: ''
                                                }
                                            };
                                        }
                                    )

                            ]);


                        const link =
                            inviteResp?.data?.link ||
                            process.env.LINK_TREE;


                        // ── Email body ──────────────────────────────────────

                        const emailBody = `

<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<title>ACE Enrollment Confirmation</title>

<style>

body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
}

.container {
    max-width: 700px;
    margin: 30px auto;
    border: 1px solid #014099;
    border-radius: 8px;
    overflow: hidden;
}

.header img {
    width: 100%;
    height: auto;
    display: block;
}

.content {
    padding: 30px;
    background: #ffffff;
}

.content h1 {
    color: #1a1a1a;
    font-size: 24px;
    margin-bottom: 10px;
}

.content p {
    color: #333;
    line-height: 1.6;
    font-size: 16px;
}

.features {
    margin-top: 20px;
    padding-left: 20px;
}

.features li {
    margin-bottom: 10px;
}

.footer {
    padding: 20px 30px;
    background: #014099;
    color: #fff;
    font-size: 14px;
    text-align: center;
}

.footer a {
    color: #fff;
    text-decoration: underline;
}

.highlight {
    color: #0057b8;
    font-weight: bold;
}

</style>

</head>

<body>

<div class="container">

<div class="header">

<img
src="https://res.cloudinary.com/domogztsv/image/upload/v1755586033/letter_header_daa86v.jpg"
alt="ACE Header">

</div>

<div class="content">

<h1>Dear ${name},</h1>

<p>
We're absolutely thrilled to welcome you to the
<span class="highlight">ACE community</span>! 🌟
Your registration is officially complete.
</p>

<p>
From all of us at ACE —
<strong>thank you for joining us</strong>.
You're now part of a vibrant and growing family that celebrates ideas,
empowers innovation, and believes in lifting each other higher.
</p>

<p>
<strong>As a member of ACE, you'll have access to:</strong>
</p>

<ul class="features">

<li>✨ Inspiring events and workshops</li>

<li>🤝 A network of passionate changemakers</li>

<li>🚀 Opportunities to lead, learn, and grow</li>

<li>🎯 A platform to turn your ideas into impact</li>

</ul>

<p>
Your enrollment certificate is attached to this email.
<strong>Welcome aboard — your ACE journey starts now.</strong>
</p>

<p>
Warm wishes,<br>
<strong>Team ACE</strong><br>
<em>Where Ambition Meets Action</em>
</p>

</div>

<div class="footer">

Follow us on Social Media &nbsp;

<a
href="${link}"
target="_blank"
>
${link}
</a>

</div>

</div>

</body>

</html>

`;


                        // ── Send email ──────────────────────────────────────

                        await transporter.sendMail({

                            from:
                                process.env.EMAIL_USER,

                            to: email,

                            subject:
                                'ACE Registration Confirmation with Certificate',

                            html:
                                emailBody,

                            attachments: [

                                {
                                    filename:
                                        `${ace_id}_enrollment.pdf`,

                                    content:
                                        buffer,

                                    contentType:
                                        'application/pdf'
                                }

                            ]
                        });


                        // ── Save to MongoDB ─────────────────────────────────

                        await Registration.create({

                            ace_id,

                            name,

                            email,

                            phone,

                            branch,

                            year,

                            gender,

                            payment,

                            goodies,

                            timestamp

                        });


                        console.log(
                            `✅ Emailed & Registered: ${ace_id}`
                        );


                    } catch (bgErr) {

                        console.error(
                            `❌ Background job failed for ${ace_id}:`,
                            bgErr.message
                        );
                    }

                }
            );


        } catch (e) {

            console.error(
                'Registration error:',
                e.message
            );

            if (!res.headersSent) {

                res.status(500).json({
                    error:
                        'Unknown error occurred'
                });
            }
        }
    }
);


// ─── Start Server ─────────────────────────────────────────────────────────────

app.listen(
    PORT,
    () => {

        console.log(
            `Server running at http://localhost:${PORT}`
        );

    }
);