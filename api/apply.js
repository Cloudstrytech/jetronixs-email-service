import nodemailer from "nodemailer";
import formidable from "formidable";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // ✅ Allow both localhost + production
  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const form = formidable({
    multiples: false,
    keepExtensions: true,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(500).json({ error: "Form parsing failed" });
    }

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // ✅ SAFE ATTACHMENT HANDLING
      let attachments = [];

      if (files.resume) {
        const file = Array.isArray(files.resume)
          ? files.resume[0]
          : files.resume;

        attachments.push({
          filename: file.originalFilename,
          path: file.filepath, // ✅ use path instead of fs.readFileSync
        });
      }

      await transporter.sendMail({
        from: `"Jetronixs Careers" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_RECIPIENT,
        subject: `New Application – ${fields.jobTitle}`,
        html: `
          <h2>New Application</h2>
          <p><strong>Name:</strong> ${fields.fullName}</p>
          <p><strong>Email:</strong> ${fields.email}</p>
          <p><strong>Phone:</strong> ${fields.phone}</p>
          <p><strong>Job ID:</strong> ${fields.jobId}</p>
          <p>${fields.coverLetter}</p>
        `,
        attachments,
      });

      return res.status(200).json({ success: true });

    } catch (error) {
      console.error("Email error:", error);
      return res.status(500).json({ error: error.message });
    }
  });
}
