import type { ContactInfo, Education } from "~/generated/prisma/client";
import { EducationType } from "~/generated/prisma/client";
import { normalizeWhitespace } from "~/utils";

// Match the exact return type from getResume query
export type ResumeWithRelations = {
  id: number;
  name: string;
  userId: string;
  jobId: string | null;
  contactInfoId: number | null;
  contactInfo: ContactInfo | null;
  summary: string[]; // Parsed from JSON
  createdAt: Date;
  updatedAt: Date;
  education: Education[];
  experience: {
    id: number;
    companyName: string;
    link: string | null;
    resumeId: number | null;
    positions: {
      id: number;
      title: string;
      startDate: Date;
      endDate: Date | null;
      location: string;
      accomplishments: string[]; // Parsed from JSON
      experienceId: number | null;
    }[];
  }[];
};

export type ResumeDB = {
  [resumeId: string]: ResumeWithRelations;
};

const contactInfo: ContactInfo = {
  email: "lkarolewski@gmail.com",
  id: 1,
  name: "Lukasz Karolewski",
  phone: "408 680 9149",
};

const linkedInPositions = [
  {
    accomplishments: [
      `Tech lead for Sales Assistant, defining product and technical vision for organization of 120 engineers`,
      `Driving AI strategy for Sales Navigator, including integration with MSFT Copilot for Sales`,
      `Leading cross-functional teams to deliver AI-driven features, collaborating closely with PM, Design, Data Science, and Infra teams to ensure alignment with strategic goals.`,
      `Mentoring engineering leaders and fostering a culture of innovation and technical excellence.`,
    ].map((item) => normalizeWhitespace(item)),
    endDate: null,
    experienceId: 1,
    id: 1,
    location: "Sunnyvale, CA",
    startDate: new Date("2024-03-01"),
    title: "Sr Staff Engineer",
  },
  {
    accomplishments: [
      `Delivered Account IQ - fastest-growing enterprise product at LinkedIn, generated ~$50M ARR lift in 6 months.`,
      `Defined product vision, influenced GTM strategy and designs,
        created teams, defined technical vision, and roadmap, and drove
        execution, including trust requirements, and automatic evaluation.
        Regularly presenting to the executive team.`,
      `Influenced LI GenAI tech stack, by actively collaborating with
        infra teams.`,
      `Filed 2 patent applications, which were key to the product's
        success.`,
    ].map((item) => normalizeWhitespace(item)),
    endDate: new Date("2024-02-30"),
    experienceId: 1,
    id: 2,
    location: "Sunnyvale, CA",
    startDate: new Date("2022-12-01"),
    title: "Sr Manager, Engineering",
  },
  {
    accomplishments: [
      `Led LinkedIn's Sales Solutions search, messaging and mobile teams.`,
      `For each of the areas I've influenced product vision, defined
        strategy, established metrics, organized teams, and worked with
        them to define a technical vision to support the goals.`,
      `Partnered with AI team to modernize AI tech stack. Reduced
        turnaround to 2 weeks vs 4 months before, increased number of A/B
        tests from an average of 1 a quarter to 5. In the first year
        recommendations CTR increased by 10x and save action by 22%.`,
      `Partnered with Search Infra and led search stack modernization
        that reduced maintenance cost from 3 person quarter to 1,
        increased Successful Search rate by 3%.`,
      `Drove hardware optimization initiative which resulted in $4M
        annual savings, improved p50 latency by ~20%.`,
      `Reduced team on-call workload by 80%, by prioritizing engineering
        excellence.`,
      `Proposed and established a new process to drive overall technical
        direction and manage foundation investments for the LSS Business
        unit.`,
      `Partnered with the Data and DS teams to establish search quality
        metrics, dramatically improved freshness, consistency, and
        accuracy, which increased Successful Search Rate by 6% and CSAT by
        2 points.`,
    ].map((item) => normalizeWhitespace(item)),
    endDate: new Date("2022-11-30"),
    experienceId: 1,
    id: 3,
    location: "Sunnyvale, CA",
    startDate: new Date("2019-09-09"),
    title: "Sr Manager, Engineering",
  },
];

const realtorPositions = [
  {
    accomplishments: [
      `Responsible for the web tier of the www.realtor.com site. Leading 3 managers and 38 engineers organized into 6 teams.`,
      `Proposed, managed, and delivered a project that overhauled SRP experience. Project increased company revenue by 9% (~35M).`,
      `I've built a business case for rewriting realtor.com to React.
        Delivered the project in time, exceeding project goals and meeting
        the company's annual growth goals. On average improved
        above-the-fold render time by 45%, full page load by 40%,
        decreased bounce rate by 20%, Increased CSAT by 2 points, and
        increased company revenue by 3% (~15M)`,
      `Led rewrite of business layer APIs that drove 13 people/year
        ongoing savings in development by spending 1 person/year of
        effort.`,
      `Drove a 95% reduction in the number of 500 errors driving the
        error rate from ~0.2% to ~0.01% which was attributed to 2 point
        increase in CSAT and improved SEO metrics.`,
      `Collaborated with QE team to implement fully automated testing,
        which allowed moving from bi-weekly release to multiple daily
        releases, decreasing the number of defects leaking to production.`,
      `Refined hiring process to increase onsite interview hire rate from
        10% to 60%.`,
      `Lead web technologies center of excellence, raising frontend
        technology expertise across the company.`,
      `Led the transition of www.realtor.com to HTTPS.`,
      `Contributed to embracing a data-driven culture by building an
        experimentation program. Enabled the PM team to run over 30
        experiments in the first year and increased company revenue by 21%
        over two years.`,
      `Drove adoption of CICD reducing release process duration from 2
        days to 1 hour.`,
    ].map((item) => normalizeWhitespace(item)),
    endDate: new Date("2019-09-30"),
    experienceId: 2,
    id: 4,
    location: "Santa Clara, CA",
    startDate: new Date("2016-10-01"),
    title: "Sr Manager, Engineering",
  },
];

const telmediqPositions = [
  {
    accomplishments: [
      `Joined as 3rd employee, built engineering organization hiring 18 engineers and 2 managers into DEV (be, web, android, ios), QE, and DevOps roles and established engineering culture.`,
      `Led the development of a HIPAA compliant communication workflow for healthcare providers, recognized as the #1 vendor by KLAS and Gartner and acquired by PerfectServe.`,
      `Collaborated with the CEO to define product strategy and establish company culture.`,
      `Negotiated contracts with customers and vendors, and handled the technical side of RFPs.`,
      `Represented TelmedIQ at trade shows and worked closely with research firms.`,
    ].map((item) => normalizeWhitespace(item)),
    endDate: new Date("2016-10-30"),
    experienceId: 3,
    id: 5,
    location: "Victoria, BC",
    startDate: new Date("2014-09-01"),
    title: "CTO and VP of Engineering",
  },
];

const symantecPositions = [
  {
    accomplishments: [
      `**Enterprise Security Group**`,
      `Led migration of 8 Symantec cloud products to Angular; mentored frontend development teams.`,
      `Initiated 'Symantec Open Source' program, creating company wide-leverage.`,
      `Introduced Git as the official code repository, securing executive support and company-wide adoption.`,
      `Achieved 70% frontend unit test coverage; implemented e2e automation, reducing bug introduction rate by 60%.`,
      `**Information Security Group**`,
      `Optimized SQL queries for VIP Intelligent Authentication Services.`,
      `Reduced build time from 15 minutes to under 1 minute by migrating build system from Ant to Gradle`,
      `Reduced deployment time from 3 days to 1 hour by automating CiCD pipeline.`,
      `**Internationalization team**`,
      `Designed and implemented comprehensive internationalization (i18n) strategies, tooling and process across multiple security products, translated into 14 languages.`,
    ].map((item) => normalizeWhitespace(item)),
    endDate: new Date("2015-06-31"),
    experienceId: 4,
    id: 6,
    location: "Mountain View, CA",
    startDate: new Date("2008-09-01"),
    title: "Principal Software Engineer",
  },
];

const simplePositions = [
  {
    accomplishments: [
      "Designed and implemented a prototype of automated supply chain management system that based on inventory thresholds inquired for quotes, picked the best bid, tracked payments and shipments. It was an extension for a market leading ERP.",
    ].map((item) => normalizeWhitespace(item)),
    endDate: new Date("2008-08-31"),
    experienceId: 5,
    id: 7,
    location: "Warsaw, Poland",
    startDate: new Date("2007-08-01"),
    title: "Software Engineer",
  },
];

const internetPositions = [
  {
    accomplishments: [
      "Started a business providing broadband internet to a local community of about 40 users. Built all of the systems to support operations, most notably: billing, traffic shaping, captive portal for device registration. Sold business to a larger ISP.",
    ].map((item) => normalizeWhitespace(item)),
    endDate: new Date("2010-08-31"),
    experienceId: 6,
    id: 8,
    location: "Warsaw, Poland",
    startDate: new Date("2004-09-01"),
    title: "Founder",
  },
];

const education: Education[] = [
  {
    distinction: "Master of Science in Computer Science",
    endDate: new Date("2010-10-01"),
    id: 1,
    institution: "Warsaw University of Technology",
    link: "https://www.elka.pw.edu.pl/",
    location: "Warsaw, Poland",
    notes: null,
    resumeId: null,
    startDate: new Date("2008-02-01"),
    type: EducationType.EDUCATION,
  },
  {
    distinction: "Bachelor of Science in Computer Science",
    endDate: new Date("2008-01-01"),
    id: 2,
    institution: "Warsaw University of Technology",
    link: "https://www.elka.pw.edu.pl/",
    location: "Warsaw, Poland",
    notes: null,
    resumeId: null,
    startDate: new Date("2004-01-01"),
    type: EducationType.EDUCATION,
  },
  {
    distinction: "Certificate of Business Excellence",
    endDate: new Date("2022-01-01"),
    id: 3,
    institution: "Haas School of Business, University of California Berkeley",
    link: "https://executive.berkeley.edu/certificate-of-business-excellence",
    location: "Berkeley, CA",
    notes:
      "Negotiation and Influence, Product Management, Communication Excellence, Executive Decision Making with Data Science, Corporate Business Model Innovation",
    resumeId: null,
    startDate: new Date("2019-01-01"),
    type: EducationType.CERTIFICATION,
  },
  {
    distinction: "Stanford Continuing Studies",
    endDate: new Date("2018-01-01"),
    id: 4,
    institution: "Stanford University",
    link: "https://continuingstudies.stanford.edu/",
    location: "Stanford, CA",
    notes:
      "Leadership and Decision-Making (BUS 53), The Exceptional Leader: A Framework for Impactful Leadership (WSP 199 B)",
    resumeId: null,
    startDate: new Date("2017-01-01"),
    type: EducationType.CERTIFICATION,
  },
  {
    distinction: "Certificate, IT Management and IT Governance",
    endDate: new Date("2011-01-01"),
    id: 5,
    institution: "SGH Warsaw School of Economics",
    link: "http://www.sgh.waw.pl/en/Pages/default.aspx",
    location: "Warsaw, Poland",
    notes: null,
    resumeId: null,
    startDate: new Date("2010-01-01"),
    type: EducationType.CERTIFICATION,
  },
  {
    distinction: "Certificate, Project Management",
    endDate: new Date("2009-01-01"),
    id: 6,
    institution: "Ernst & Young Academy of Business",
    link: "https://www.academyofbusiness.pl/en",
    location: "Warsaw, Poland",
    notes: null,
    resumeId: null,
    startDate: new Date("2009-01-01"),
    type: EducationType.CERTIFICATION,
  },
];

export const mockDB: ResumeDB = {
  base: {
    contactInfo: contactInfo,
    contactInfoId: contactInfo.id,
    createdAt: new Date("2024-01-01"),
    education,
    experience: [
      {
        companyName: "LinkedIn",
        id: 1,
        link: "https://linkedin.com",
        positions: linkedInPositions,
        resumeId: null,
      },
      {
        companyName: "Move Inc. - realtor.com",
        id: 2,
        link: "https://www.realtor.com/",
        positions: realtorPositions,
        resumeId: null,
      },
      {
        companyName: "TelmedIQ",
        id: 3,
        link: "https://www.telmediq.com/",
        positions: telmediqPositions,
        resumeId: null,
      },
      {
        companyName: "Symantec",
        id: 4,
        link: "https://www.symantec.com/",
        positions: symantecPositions,
        resumeId: null,
      },
      {
        companyName: "Simple S.A.",
        id: 5,
        link: "https://www.simple.com/",
        positions: simplePositions,
        resumeId: null,
      },
      {
        companyName: "Fast Internet",
        id: 6,
        link: null,
        positions: internetPositions,
        resumeId: null,
      },
    ],
    id: 1,
    jobId: null,
    name: "Resume",
    summary: [
      "Accomplished engineering leader with over a decade of experience driving product innovation, strategic vision, and substantial revenue growth through high-performing teams.",
      "Expert in LLM-driven solutions, search technologies, AI modernization, and operational efficiency.",
      "Known for fostering innovation, mentoring top talent, and consistently exceeding business goals.",
      "Excels in strategic planning, team leadership, and detailed execution.",
    ],
    updatedAt: new Date("2024-01-01"),
    userId: "mock-user-id",
  },

  salesforce: {
    contactInfo: contactInfo,
    contactInfoId: contactInfo.id,
    createdAt: new Date("2024-01-01"),
    education,
    experience: [
      {
        companyName: "LinkedIn",
        id: 1,
        link: "https://linkedin.com",
        positions: [
          {
            ...linkedInPositions[0]!,
            accomplishments: [
              "Led development of Generative AI features, contributing ~$100M incremental revenue. Projects included Account IQ, LeadIQ, Message Assist, and AI-Assisted Search, MSFT Co-Pilot for Sales integration, and most recently, overseeing Seller Agent product.",
              "Defined product and technical vision, collaborated with cross-functional teams, and delivered AI-driven features to market, aligning closely with the strategic goals of the organization.",
              "Filed two patents, key to the success of AI-based product innovations.",
              "Partnered with infrastructure teams to influence the Generative AI strategy and implementation.",
            ],
          },
          linkedInPositions[1]!,
        ],
        resumeId: null,
      },
    ],
    id: 2,
    jobId: null,
    name: "Salesforce Resume",
    summary: [
      "Engineering leader with over a decade of experience leading cross-functional teams to build AI-driven products and solutions.",
      "Strong expertise in Generative AI, Retrieval-Augmented Generation (RAG), large language models (LLMs), and Agentic workflows.",
      "Proven ability to define technical strategy, drive product innovation, and deliver value-driven outcomes.",
      "Passionate about fostering high-performing teams, mentoring engineering talent, and maintaining technical excellence while delivering impactful results.",
    ],
    updatedAt: new Date("2024-01-01"),
    userId: "mock-user-id",
  },
};
