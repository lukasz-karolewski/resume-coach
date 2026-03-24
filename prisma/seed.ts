import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import {
  EducationType,
  PrismaClient,
  SectionType,
} from "../src/generated/prisma/client";

dotenv.config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set. Expected it in .env.local.");
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({
  adapter,
});

const seedUser = {
  email: "lkarolewski@gmail.com",
  id: "seed-user-id",
  linkedInProfileURL: "https://www.linkedin.com/in/lkarolewski/",
  name: "Lukasz Karolewski",
};

const seededContactInfo = {
  email: "lkarolewski@gmail.com",
  name: "Lukasz Karolewski",
  phone: "408 680 9149",
};

const seededResumeName = "Resume";

const seededSummary = `
Accomplished engineering leader with over a decade of experience driving product innovation, strategic vision, and substantial revenue growth through high-performing teams.
Expert in LLM-driven solutions, search technologies, AI modernization, and operational efficiency.
Known for fostering innovation, mentoring top talent, and consistently exceeding business goals.
Excels in strategic planning, team leadership, and detailed execution.
`.trim();

const seededExperience = [
  {
    companyName: "LinkedIn",
    link: "https://linkedin.com",
    positions: [
      {
        accomplishments: `
- Tech lead for Sales Assistant, defining product and technical vision for organization of 120 engineers
- Driving AI strategy for Sales Navigator, including integration with MSFT Copilot for Sales
- Leading cross-functional teams to deliver AI-driven features, collaborating closely with PM, Design, Data Science, and Infra teams to ensure alignment with strategic goals.
- Mentoring engineering leaders and fostering a culture of innovation and technical excellence.
`.trim(),
        endDate: null,
        location: "Sunnyvale, CA",
        startDate: new Date("2024-03-01T00:00:00.000Z"),
        title: "Sr Staff Engineer",
      },
      {
        accomplishments: `
- Delivered Account IQ, the fastest-growing enterprise product at LinkedIn, generating roughly $50M ARR lift in six months.
- Defined product vision, influenced GTM strategy and design, created teams, defined technical vision and roadmap, and drove execution including trust requirements and automatic evaluation.
- Influenced LinkedIn's GenAI technology stack through close collaboration with infrastructure teams.
- Filed two patent applications that were key to the product's success.
`.trim(),
        endDate: new Date("2024-02-29T00:00:00.000Z"),
        location: "Sunnyvale, CA",
        startDate: new Date("2022-12-01T00:00:00.000Z"),
        title: "Sr Manager, Engineering",
      },
      {
        accomplishments: `
- Led LinkedIn's Sales Solutions search, messaging, and mobile teams.
- Influenced product vision, defined strategy, established metrics, organized teams, and partnered on the technical vision for each area.
- Partnered with AI teams to modernize the AI tech stack, reducing turnaround from four months to two weeks and increasing A/B test velocity from one per quarter to five.
- Improved recommendations CTR by 10x and save action by 22% in the first year.
- Partnered with Search Infra to modernize the search stack, reducing maintenance cost from three person-quarters to one and increasing successful search rate by 3%.
- Drove hardware optimization that resulted in $4M annual savings and improved p50 latency by roughly 20%.
- Reduced team on-call workload by 80% by prioritizing engineering excellence.
- Proposed and established a process to drive technical direction and manage foundational investments for the business unit.
- Partnered with Data and DS teams to establish search quality metrics, improving freshness, consistency, and accuracy, which increased successful search rate by 6% and CSAT by 2 points.
`.trim(),
        endDate: new Date("2022-11-30T00:00:00.000Z"),
        location: "Sunnyvale, CA",
        startDate: new Date("2019-09-09T00:00:00.000Z"),
        title: "Sr Manager, Engineering",
      },
    ],
  },
  {
    companyName: "Move Inc. - realtor.com",
    link: "https://www.realtor.com/",
    positions: [
      {
        accomplishments: `
- Responsible for the web tier of www.realtor.com, leading three managers and 38 engineers across six teams.
- Proposed, managed, and delivered an SRP overhaul that increased company revenue by 9%, roughly $35M.
- Built the business case for rewriting realtor.com to React and delivered the project on time, improving above-the-fold render time by 45%, full page load by 40%, reducing bounce by 20%, increasing CSAT by 2 points, and increasing revenue by roughly $15M.
- Led a rewrite of business-layer APIs that saved 13 people-years of ongoing development effort at the cost of one people-year.
- Drove a 95% reduction in 500 errors, moving the error rate from roughly 0.2% to 0.01%, contributing to a 2-point CSAT increase and improved SEO metrics.
- Collaborated with QE to implement automated testing, enabling a shift from bi-weekly releases to multiple daily releases.
- Refined hiring process to increase onsite interview hire rate from 10% to 60%.
- Led the web technologies center of excellence, raising frontend expertise across the company.
- Led the transition of www.realtor.com to HTTPS.
- Helped establish a data-driven experimentation program that enabled over 30 experiments in the first year and increased revenue by 21% over two years.
- Drove CI/CD adoption, reducing release duration from two days to one hour.
`.trim(),
        endDate: new Date("2019-09-30T00:00:00.000Z"),
        location: "Santa Clara, CA",
        startDate: new Date("2016-10-01T00:00:00.000Z"),
        title: "Sr Manager, Engineering",
      },
    ],
  },
  {
    companyName: "TelmedIQ",
    link: "https://www.telmediq.com/",
    positions: [
      {
        accomplishments: `
- Joined as the third employee, built the engineering organization by hiring 18 engineers and two managers across backend, web, Android, iOS, QE, and DevOps.
- Led development of a HIPAA-compliant communication workflow for healthcare providers, recognized as the top vendor by KLAS and Gartner and later acquired by PerfectServe.
- Collaborated with the CEO to define product strategy and company culture.
- Negotiated contracts with customers and vendors and handled the technical side of RFPs.
- Represented TelmedIQ at trade shows and worked closely with research firms.
`.trim(),
        endDate: new Date("2016-10-30T00:00:00.000Z"),
        location: "Victoria, BC",
        startDate: new Date("2014-09-01T00:00:00.000Z"),
        title: "CTO and VP of Engineering",
      },
    ],
  },
  {
    companyName: "Symantec",
    link: "https://www.symantec.com/",
    positions: [
      {
        accomplishments: `
### Enterprise Security Group
- Led migration of eight Symantec cloud products to Angular and mentored frontend development teams.
- Initiated the Symantec Open Source program, creating company-wide leverage.
- Introduced Git as the official code repository, securing executive support and company-wide adoption.
- Achieved 70% frontend unit test coverage and implemented e2e automation, reducing bug introduction rate by 60%.

### Information Security Group
- Optimized SQL queries for VIP Intelligent Authentication Services.
- Reduced build time from 15 minutes to under 1 minute by migrating the build system from Ant to Gradle.
- Reduced deployment time from three days to one hour by automating the CI/CD pipeline.

### Internationalization Team
- Designed and implemented internationalization strategies, tooling, and process across multiple security products translated into 14 languages.
`.trim(),
        endDate: new Date("2015-06-30T00:00:00.000Z"),
        location: "Mountain View, CA",
        startDate: new Date("2008-09-01T00:00:00.000Z"),
        title: "Principal Software Engineer",
      },
    ],
  },
  {
    companyName: "Simple S.A.",
    link: "https://www.simple.com/",
    positions: [
      {
        accomplishments:
          "Designed and implemented a prototype automated supply chain management system that used inventory thresholds to request quotes, select bids, and track payments and shipments as an extension for a market-leading ERP.",
        endDate: new Date("2008-08-31T00:00:00.000Z"),
        location: "Warsaw, Poland",
        startDate: new Date("2007-08-01T00:00:00.000Z"),
        title: "Software Engineer",
      },
    ],
  },
  {
    companyName: "Fast Internet",
    link: null,
    positions: [
      {
        accomplishments:
          "Started a business providing broadband internet to a local community of about 40 users. Built systems for billing, traffic shaping, and captive portal device registration before selling the business to a larger ISP.",
        endDate: new Date("2010-08-31T00:00:00.000Z"),
        location: "Warsaw, Poland",
        startDate: new Date("2004-09-01T00:00:00.000Z"),
        title: "Founder",
      },
    ],
  },
];

const seededEducation = [
  {
    distinction: "Master of Science in Computer Science",
    endDate: new Date("2010-10-01T00:00:00.000Z"),
    institution: "Warsaw University of Technology",
    link: "https://www.elka.pw.edu.pl/",
    location: "Warsaw, Poland",
    notes: null,
    startDate: new Date("2008-02-01T00:00:00.000Z"),
    type: EducationType.EDUCATION,
  },
  {
    distinction: "Bachelor of Science in Computer Science",
    endDate: new Date("2008-01-01T00:00:00.000Z"),
    institution: "Warsaw University of Technology",
    link: "https://www.elka.pw.edu.pl/",
    location: "Warsaw, Poland",
    notes: null,
    startDate: new Date("2004-01-01T00:00:00.000Z"),
    type: EducationType.EDUCATION,
  },
  {
    distinction: "Certificate of Business Excellence",
    endDate: new Date("2022-01-01T00:00:00.000Z"),
    institution: "Haas School of Business, University of California Berkeley",
    link: "https://executive.berkeley.edu/certificate-of-business-excellence",
    location: "Berkeley, CA",
    notes:
      "Negotiation and Influence, Product Management, Communication Excellence, Executive Decision Making with Data Science, Corporate Business Model Innovation",
    startDate: new Date("2019-01-01T00:00:00.000Z"),
    type: EducationType.CERTIFICATION,
  },
  {
    distinction: "Stanford Continuing Studies",
    endDate: new Date("2018-01-01T00:00:00.000Z"),
    institution: "Stanford University",
    link: "https://continuingstudies.stanford.edu/",
    location: "Stanford, CA",
    notes:
      "Leadership and Decision-Making (BUS 53), The Exceptional Leader: A Framework for Impactful Leadership (WSP 199 B)",
    startDate: new Date("2017-01-01T00:00:00.000Z"),
    type: EducationType.CERTIFICATION,
  },
  {
    distinction: "Certificate, IT Management and IT Governance",
    endDate: new Date("2011-01-01T00:00:00.000Z"),
    institution: "SGH Warsaw School of Economics",
    link: "http://www.sgh.waw.pl/en/Pages/default.aspx",
    location: "Warsaw, Poland",
    notes: null,
    startDate: new Date("2010-01-01T00:00:00.000Z"),
    type: EducationType.CERTIFICATION,
  },
  {
    distinction: "Certificate, Project Management",
    endDate: new Date("2009-01-01T00:00:00.000Z"),
    institution: "Ernst & Young Academy of Business",
    link: "https://www.academyofbusiness.pl/en",
    location: "Warsaw, Poland",
    notes: null,
    startDate: new Date("2009-01-01T00:00:00.000Z"),
    type: EducationType.CERTIFICATION,
  },
];

async function seedSkills() {
  for (const name of ["Prisma ORM", "TypeScript"]) {
    await prisma.skill.upsert({
      create: { name },
      update: {},
      where: { name },
    });
  }
}

async function seedResume() {
  const user = await prisma.user.upsert({
    create: {
      email: seedUser.email,
      emailVerified: true,
      id: seedUser.id,
      linkedInProfileURL: seedUser.linkedInProfileURL,
      name: seedUser.name,
    },
    update: {
      emailVerified: true,
      linkedInProfileURL: seedUser.linkedInProfileURL,
      name: seedUser.name,
    },
    where: { email: seedUser.email },
  });

  await prisma.resume.deleteMany({
    where: {
      name: seededResumeName,
      userId: user.id,
    },
  });

  await prisma.contactInfo.deleteMany({
    where: {
      email: seededContactInfo.email,
    },
  });

  const contactInfo = await prisma.contactInfo.create({
    data: seededContactInfo,
  });

  await prisma.resume.create({
    data: {
      contactInfoId: contactInfo.id,
      education: {
        create: seededEducation,
      },
      experience: {
        create: seededExperience.map((experience) => ({
          companyName: experience.companyName,
          link: experience.link,
          positions: {
            create: experience.positions,
          },
        })),
      },
      name: seededResumeName,
      sections: {
        create: [
          { title: "Experience", type: SectionType.EXPERIENCE },
          { title: "Education", type: SectionType.EDUCATION },
          { title: "Certification", type: SectionType.CERTIFICATION },
          { title: "Skills Summary", type: SectionType.SKILLS_SUMMARY },
        ],
      },
      summary: seededSummary,
      userId: user.id,
    },
  });
}

async function main() {
  await seedSkills();
  await seedResume();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
