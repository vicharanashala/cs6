import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const descriptions = {
  'About the internship': 'What VINS is, who can apply (currently enrolled students only), the four phases Bronze/Silver/Gold/Platinum, what each badge means, and the strict no-leave policy.',
  'Timing and dates': 'Start dates, the 2-month window with 1-month grace (must finish by 31 Dec 2026), no leave exemptions during the 55-day continuous window, and cohort networking benefits.',
  'NOC (No Objection Certificate)': 'NOC format and download from dashboard, who can sign it (HOD/Dean/TPO), email-forward path to sudarshan@iitrpr.ac.in, and how to get a tentative offer letter while waiting.',
  'Selection, offer letter, and certificate': 'Check selection via yellow VINS panel on dashboard, opt-in via Yaksha, exact offer letter acceptance format, date change rules, and tentative offer letter path.',
  'Work, mentorship, and projects': 'Real open-source projects (AI/ML, web, NLP, agriculture-tech, ViBe), 6-10 hour daily commitment, unpaid with no stipend, laptop requirements, and when mentors are assigned after Bronze.',
  'Code of conduct — communication channels': 'Official channels: samagama Announcements, Yaksha chat with #escalate, discussion forum, and sudarshansudarshan@gmail.com. No WhatsApp/Telegram/Discord allowed — termination offence.',
  'Interviews Related': 'Dashboard sync issues when interviews are not marked complete — how to get manually unblocked within 1-2 hours and when to escalate to sudarshansudarshan@gmail.com.',
  'Certificate': 'E-certificate downloaded from dashboard after completing Bronze and Silver; same document for online and offline tracks; no grade reports sent to universities.',
  'Rosetta — your internship journal': '65-day daily journal (one entry every day), thinking routines (3-2-1, Muddy/Clear, What?/So What?/Now What?), no AI-generated content allowed, and submission instructions on Day 65.',
  'Phase 1 — coursework, Vibe LMS, and live sessions': 'AI Fundamentals registration on Vibe, MERN exemption claim via Yaksha, mandatory live sessions for all paths, and session schedule posted in Announcements.',
  'Yaksha Chat Related': 'Yaksha chat activation fix — if you cannot type after clicking Interact, scroll up and click the Chat with Yaksha button to activate it.',
  'ViBe Platform': 'ViBe login, email linking to Samagama, video proctoring and the quiet-helper camera system, linear progression and Access Restricted errors, study corner setup, and exception exam path.',
  'Team Formation': 'Compulsory 4-member teams from different institutions, random assignment for later cohorts, team locking rules, no switches after assignment, and how team performance affects individual evaluation.'
};

async function updateDescriptions() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    console.log('Connected to MongoDB');

    const col = db.collection('categories');

    for (const [name, description] of Object.entries(descriptions)) {
      const result = await col.updateOne(
        { name },
        { $set: { description } }
      );
      console.log(`${result.modifiedCount > 0 ? '✓' : '⊘'} "${name}"`);
    }

    console.log('\nAll done!');
    await client.close();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

updateDescriptions();