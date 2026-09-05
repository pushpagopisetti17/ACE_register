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
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b0b0f;
      font-family: Arial, Helvetica, sans-serif;
      color: #ffffff;
    }

    .wrapper {
      width: 100%;
      background-color: #0b0b0f;
      padding: 30px 0;
    }

    .container {
      max-width: 680px;
      margin: auto;
      background-color: #15151c;
      border-radius: 14px;
      overflow: hidden;
      border: 1px solid #2b2b35;
    }

    .header img {
      width: 100%;
      display: block;
    }

    .content {
      padding: 30px;
    }

    h1 {
      margin: 0 0 15px;
      font-size: 28px;
      color: #ffffff;
    }

    h2 {
      color: #ffffff;
      margin-top: 28px;
      font-size: 21px;
    }

    p {
      color: #d5d5dc;
      font-size: 15px;
      line-height: 1.7;
    }

    .highlight {
      color: #ffffff;
      font-weight: bold;
    }

    .credentials {
      margin-top: 25px;
      background: #1e1e27;
      border: 1px solid #343441;
      border-radius: 12px;
      padding: 22px;
    }

    .credentials-title {
      font-size: 19px;
      font-weight: bold;
      color: #ffffff;
      margin-bottom: 15px;
    }

    .row {
      padding: 9px 0;
      border-bottom: 1px solid #30303a;
      font-size: 14px;
    }

    .row:last-child {
      border-bottom: none;
    }

    .label {
      color: #9999a5;
      display: inline-block;
      width: 150px;
    }

    .value {
      color: #ffffff;
      font-weight: bold;
    }

    .learn-box {
      margin-top: 25px;
      background: #1b1b24;
      border-radius: 12px;
      padding: 20px;
    }

    .learn-box ul {
      padding-left: 20px;
      margin-bottom: 0;
    }

    .learn-box li {
      color: #d5d5dc;
      margin-bottom: 10px;
      line-height: 1.5;
    }

    .certificate {
      margin-top: 25px;
      padding: 18px;
      background: #20202a;
      border-radius: 10px;
      text-align: center;
    }

    .certificate p {
      margin: 5px 0;
    }

    .footer {
      text-align: center;
      padding: 25px;
      background: #0052B8;
      color: #9999a5;
      font-size: 13px;
    }

    .footer a {
      color: #ffffff;
      text-decoration: none;
      font-weight: bold;
    }

    @media only screen and (max-width: 600px) {
      .content {
        padding: 20px;
      }

      .label {
        display: block;
        width: auto;
        margin-bottom: 4px;
      }
    }
  </style>
</head>

<body>

<div class="wrapper">

  <div class="container">

    <!-- GAME THEME HEADER -->
    <div class="header">
      <img
        src="${process.env.EMAIL_HEADER_URL}"
        alt="SRKR ACE"
      >
    </div>

    <div class="content">

      <h1>🎮 Welcome to ACE!</h1>

      <p>
        Hi <span class="highlight">${name}</span>,
      </p>

      <p>
        Congratulations! Your registration for
        <strong>ACE – Association of Computer Engineers</strong>
        has been successfully completed.
      </p>

      <p>
        Your journey begins here. Get ready to
        <strong>Level Up Your Skills, Build, Create & Grow.</strong>
      </p>

      <!-- CREDENTIALS -->
      <div class="credentials">

        <div class="credentials-title">
          🎯 Your ACE Credentials
        </div>

        <div class="row">
          <span class="label">ACE Regd. ID</span>
          <span class="value">${ace_id}</span>
        </div>

        <div class="row">
          <span class="label">Name</span>
          <span class="value">${name}</span>
        </div>

        <div class="row">
          <span class="label">Department</span>
          <span class="value">${branch}</span>
        </div>

        <div class="row">
          <span class="label">Year of Study</span>
          <span class="value">${year}</span>
        </div>

        <div class="row">
          <span class="label">Goodies</span>
          <span class="value">${goodies || "—"}</span>
        </div>

      </div>

      <!-- WHAT YOU WILL LEARN -->
      <div class="learn-box">

        <h2>🚀 What You'll Learn & Gain</h2>

        <ul>
          <li>
            💻 Hands-on exposure to modern technologies and development tools
          </li>

          <li>
            🧠 Practical knowledge through workshops and technical sessions
          </li>

          <li>
            🤝 Collaboration and teamwork through real-world activities
          </li>

          <li>
            🛠️ Problem-solving and project-building skills
          </li>

          <li>
            🎤 Communication, leadership and presentation skills
          </li>

          <li>
            🌱 Opportunities to explore, experiment and continuously grow
          </li>
        </ul>

      </div>

      <!-- CERTIFICATE -->
      <div class="certificate">

        <h2>🏆 Your Certificate</h2>

        <p>
          Your ACE registration certificate is attached to this email
          as a PDF.
        </p>

        <p>
          Please keep it safely for your future reference.
        </p>

      </div>

      <p style="margin-top:30px;">
        Once again, welcome to ACE! 🎮
      </p>

      <p>
        Let's learn, build, compete and <strong>level up together.</strong>
      </p>

    </div>

    <!-- FOOTER -->
    <div class="footer">

      <p>
        Follow us on Social Media
      </p>

      <p>
        <a href="${process.env.INSTAGRAM_URL || '#'}">
          Instagram
        </a>
      </p>

      <p>
        © 2026 ACE — Association of Computer Engineers
      </p>

    </div>

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