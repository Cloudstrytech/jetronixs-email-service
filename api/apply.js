import nodemailer from "nodemailer";
import formidable from "formidable";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // ✅ Allow both localhost + production
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

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
        from: `"Jetronixs Careers" <${process.env.EMAIL_SENDER}>`,
        to: process.env.EMAIL_RECIPIENT,
        subject: `New Application – ${fields.jobTitle}`,
        html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>New Job Application</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0; background-color:#f4f6f8;">
    <tr>
      <td align="center">

        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#0f172a; padding:24px; text-align:center;">
              <h1 style="color:#ffffff; margin:0; font-size:22px;">
                Jetronixs Careers
              </h1>
              <p style="color:#cbd5e1; margin:5px 0 0; font-size:14px;">
                New Job Application Received
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:30px;">

              <h2 style="margin-top:0; color:#111827; font-size:20px;">
                ${fields.jobTitle}
              </h2>

              <p style="color:#6b7280; font-size:14px; margin-bottom:25px;">
                Job ID: <strong>${fields.jobId}</strong>
              </p>

              <!-- Applicant Details -->
              <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="background:#f9fafb; border:1px solid #e5e7eb;">
                    <strong>Full Name</strong>
                  </td>
                  <td style="border:1px solid #e5e7eb;">
                    ${fields.fullName}
                  </td>
                </tr>
                <tr>
                  <td style="background:#f9fafb; border:1px solid #e5e7eb;">
                    <strong>Email</strong>
                  </td>
                  <td style="border:1px solid #e5e7eb;">
                    ${fields.email}
                  </td>
                </tr>
                <tr>
                  <td style="background:#f9fafb; border:1px solid #e5e7eb;">
                    <strong>Phone</strong>
                  </td>
                  <td style="border:1px solid #e5e7eb;">
                    ${fields.phone}
                  </td>
                </tr>
              </table>

              <!-- Cover Letter -->
              <div style="margin-top:30px;">
                <h3 style="margin-bottom:10px; color:#111827;">Cover Letter</h3>
                <div style="background:#f3f4f6; padding:15px; border-radius:6px; font-size:14px; color:#374151; line-height:1.6;">
                  ${fields.coverLetter}
                </div>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb; padding:20px; text-align:center; font-size:12px; color:#6b7280;">
              © ${new Date().getFullYear()} Jetronixs. All rights reserved.
              <br/>
              This email was generated automatically from your careers portal.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
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
