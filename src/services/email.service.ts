import nodemailer from "nodemailer";
import { config } from "../config/v1/config";
import { toDateTime, toIcsDate } from "../utils/v1/helpers";

const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: false,
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
  },
});

/* ------------------------------------------------------------------ */
/*  Build .ics calendar invite string                                  */
/* ------------------------------------------------------------------ */
function buildIcs(params: {
  uid: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  meetLink: string;
  organiserEmail: string;
}): string {
  const { uid, title, description, date, startTime, endTime, meetLink, organiserEmail } = params;

  const start = toDateTime(date, startTime);
  const end = toDateTime(date, endTime);
  const now = new Date();

  const stamp = toIcsDate(now) + "Z";
  const dtStart = toIcsDate(start);
  const dtEnd = toIcsDate(end);

  const safeDesc = `${description}\\n\\nJoin Meeting: ${meetLink}`.replace(/\n/g, "\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Virtual Event Platform//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${safeDesc}`,
    `LOCATION:${meetLink}`,
    `ORGANIZER:mailto:${organiserEmail}`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder: Your event starts in 30 minutes",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/* ------------------------------------------------------------------ */
/*  Welcome email                                                      */
/* ------------------------------------------------------------------ */
export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  try {
    await transporter.sendMail({
      from: `"Virtual Events" <${config.FROM_EMAIL}>`,
      to,
      subject: "Welcome to Virtual Event Platform!",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto">
          <h2 style="color:#4f46e5">Welcome, ${name}!</h2>
          <p>Your account has been created successfully.</p>
          <p>You can now browse events and register as an attendee, or create your own events as an organizer.</p>
          <p style="color:#6b7280;font-size:13px">— Virtual Event Platform</p>
        </div>
      `,
    });
    console.info(`Welcome email sent to ${to}`);
  } catch (err) {
    console.error(`Failed to send welcome email to ${to}:`, err);
  }
}

/* ------------------------------------------------------------------ */
/*  Registration confirmation email with .ics + Meet link             */
/* ------------------------------------------------------------------ */
export async function sendEventRegistrationEmail(params: {
  to: string;
  name: string;
  eventTitle: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  description: string;
  meetLink: string;
  eventId: string;
}): Promise<void> {
  const { to, name, eventTitle, eventDate, startTime, endTime, description, meetLink, eventId } = params;

  try {
    const icsContent = buildIcs({
      uid: `event-${eventId}@virtualeventplatform`,
      title: eventTitle,
      description,
      date: eventDate,
      startTime,
      endTime,
      meetLink,
      organiserEmail: config.FROM_EMAIL,
    });

    await transporter.sendMail({
      from: `"Virtual Events" <${config.FROM_EMAIL}>`,
      to,
      subject: `Registration Confirmed: ${eventTitle}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto">
          <h2 style="color:#4f46e5">You're registered, ${name}!</h2>
          <p>You have successfully registered for <strong>${eventTitle}</strong>.</p>
          <table style="border-collapse:collapse;margin:16px 0">
            <tr>
              <td style="padding:6px 16px 6px 0;color:#6b7280;font-size:14px">Date</td>
              <td style="padding:6px 0;font-size:14px;font-weight:600">${eventDate}</td>
            </tr>
            <tr>
              <td style="padding:6px 16px 6px 0;color:#6b7280;font-size:14px">Start Time</td>
              <td style="padding:6px 0;font-size:14px;font-weight:600">${startTime}</td>
            </tr>
            <tr>
              <td style="padding:6px 16px 6px 0;color:#6b7280;font-size:14px">End Time</td>
              <td style="padding:6px 0;font-size:14px;font-weight:600">${endTime}</td>
            </tr>
            <tr>
              <td style="padding:6px 16px 6px 0;color:#6b7280;font-size:14px">Meeting Link</td>
              <td style="padding:6px 0;font-size:14px">
                <a href="${meetLink}" style="color:#4f46e5;font-weight:600">${meetLink}</a>
              </td>
            </tr>
          </table>
          <p style="font-size:14px;color:#374151">
            A calendar invite is attached — open it to add this event directly to 
            Google Calendar, Outlook, or Apple Calendar. You will also receive a 
            reminder 30 minutes before the event starts.
          </p>
          <a href="${meetLink}" style="display:inline-block;margin-top:12px;padding:10px 24px;background:#4f46e5;color:#fff;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600">
            Join Meeting
          </a>
          <p style="color:#6b7280;font-size:13px;margin-top:24px">— Virtual Event Platform</p>
        </div>
      `,
      attachments: [
        {
          filename: `${eventTitle.replace(/\s+/g, "_")}.ics`,
          content: icsContent,
          contentType: "text/calendar; method=REQUEST",
        },
      ],
    });
    console.info(`Registration email with calendar invite sent to ${to}`);
  } catch (err) {
    console.error(`Failed to send registration email to ${to}:`, err);
  }
}

/* ------------------------------------------------------------------ */
/*  30-minute reminder email — scheduled via setTimeout               */
/* ------------------------------------------------------------------ */
export function scheduleReminderEmail(params: {
  to: string;
  name: string;
  eventTitle: string;
  eventDate: string;
  startTime: string;
  meetLink: string;
}): void {
  const { to, name, eventTitle, eventDate, startTime, meetLink } = params;

  const eventStart = toDateTime(eventDate, startTime);
  const reminderTime = new Date(eventStart.getTime() - 30 * 60 * 1000); // 30 min before
  const now = new Date();
  const delay = reminderTime.getTime() - now.getTime();

  if (delay <= 0) {
    console.info(`Reminder for "${eventTitle}" to ${to} skipped — event starts in less than 30 minutes or already passed`);
    return;
  }

  console.info(`Reminder email for "${eventTitle}" scheduled to ${to} in ${Math.round(delay / 60000)} minutes`);

  setTimeout(async () => {
    try {
      await transporter.sendMail({
        from: `"Virtual Events" <${config.FROM_EMAIL}>`,
        to,
        subject: `Reminder: "${eventTitle}" starts in 30 minutes!`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:auto">
            <h2 style="color:#4f46e5">⏰ Starting Soon, ${name}!</h2>
            <p><strong>${eventTitle}</strong> starts in <strong>30 minutes</strong>.</p>
            <table style="border-collapse:collapse;margin:16px 0">
              <tr>
                <td style="padding:6px 16px 6px 0;color:#6b7280;font-size:14px">Date</td>
                <td style="padding:6px 0;font-size:14px;font-weight:600">${eventDate}</td>
              </tr>
              <tr>
                <td style="padding:6px 16px 6px 0;color:#6b7280;font-size:14px">Start Time</td>
                <td style="padding:6px 0;font-size:14px;font-weight:600">${startTime}</td>
              </tr>
              <tr>
                <td style="padding:6px 16px 6px 0;color:#6b7280;font-size:14px">Meeting Link</td>
                <td style="padding:6px 0;font-size:14px">
                  <a href="${meetLink}" style="color:#4f46e5;font-weight:600">${meetLink}</a>
                </td>
              </tr>
            </table>
            <a href="${meetLink}" style="display:inline-block;margin-top:12px;padding:10px 24px;background:#4f46e5;color:#fff;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600">
              Join Meeting Now
            </a>
            <p style="color:#6b7280;font-size:13px;margin-top:24px">— Virtual Event Platform</p>
          </div>
        `,
      });
      console.info(`Reminder email sent to ${to} for "${eventTitle}"`);
    } catch (err) {
      console.error(`Failed to send reminder email to ${to}:`, err);
    }
  }, delay);
}
