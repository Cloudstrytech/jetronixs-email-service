const express = require("express");
const nodemailer = require("nodemailer");
const path = require("path");
const multer = require("multer");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ------------------ MULTER ------------------

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF or Word allowed"));
    }
  },
});

// ------------------ API ROUTE ------------------

app.post("/api/apply", upload.single("resume"), async (req, res) => {
  console.log("---- /api/apply HIT ----");

  try {
    const { fullName, email, phone, coverLetter, jobTitle, jobId } = req.body;

    console.log("BODY:", req.body);
    console.log("FILE:", req.file ? req.file.originalname : "No file");

    if (!fullName || !email || !phone || !coverLetter) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.verify();
    console.log("SMTP verified");

    await transporter.sendMail({
      from: `"Jetronixs Careers" <${process.env.EMAIL_SENDER}>`,
      to: process.env.EMAIL_RECIPIENT,
      subject: `New Application – ${jobTitle} (ID: ${jobId})`,
      html: `
        <h2>New Job Application</h2>
        <p><strong>Job:</strong> ${jobTitle}</p>
        <p><strong>ID:</strong> ${jobId}</p>
        <hr/>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Cover Letter:</strong></p>
        <p>${coverLetter}</p>
      `,
      attachments: req.file
        ? [
            {
              filename: req.file.originalname,
              content: req.file.buffer,
            },
          ]
        : [],
    });

    console.log("Email sent successfully");

    res.json({ success: true });
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ------------------ SERVE REACT ------------------

// app.use(express.static(path.join(__dirname, "Client/dist")));

// app.get(/.*/, (req, res) => {
//   res.sendFile(path.join(__dirname, "Client/dist/index.html"));
// });

// ------------------ START ------------------

const PORT = 8000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
