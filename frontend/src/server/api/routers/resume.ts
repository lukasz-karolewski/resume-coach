import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { normalizeWhitespace } from "~/utils";

interface ContactInfo {
  name: string;
  email: string;
  phone: string;
}

interface Position {
  title: string;
  startDate: Date;
  endDate?: Date;
  location: string;
  accomplishments: string[];
}

interface Experience {
  company: string;
  link?: string;
  positions: Position[];
}

interface Education {
  institution: string;
  distinction: string;
  startDate: Date;
  endDate: Date;
  location: string;
  link: string;
  notes?: string;
}

interface CompanyData {
  contactInfo: ContactInfo;
  professionalSummary: string[];
  experience: Experience[];
  education: Education[];
  certificates: Education[];
}

interface DB {
  [companyName: string]: CompanyData;
}

const contactInfo: ContactInfo = {
  name: "Lukasz Karolewski",
  email: "lkarolewski@gmail.com",
  phone: "408 680 9149",
};

const linkedIn: Experience = {
  company: "LinkedIn",
  link: "https://linkedin.com",
  positions: [
    {
      title: "Sr Staff Engineer",
      startDate: new Date("2024-03-01"),
      location: "Sunnyvale, CA",
      accomplishments: [
        `Tech lead for Prospecting Agent, defining product and technical vision for organization of 120 engineers`,
      ].map((item) => normalizeWhitespace(item)),
    },
    {
      title: "Sr Manager, Engineering",
      startDate: new Date("2022-12-01"),
      endDate: new Date("2024-02-30"),
      location: "Sunnyvale, CA",
      accomplishments: [
        `Delivered fastest-growing enterprise product at LinkedIn, generated ~$100M ARR lift.`,
        `Defined product vision, influenced GTM strategy and designs,
            created teams, defined technical vision, and roadmap, and drove
            execution, including trust requirements, and automatic evaluation.
            Regularly presenting to the executive team.`,
        `Influenced LI GenAI tech stack, by actively collaborating with
            infra teams.`,
        `Filed 2 patent applications, which were key to the product's
            success.`,
      ].map((item) => normalizeWhitespace(item)),
    },
    {
      title: "Sr Manager, Engineering",
      startDate: new Date("2019-09-09"),
      endDate: new Date("2022-11-30"),
      location: "Sunnyvale, CA",
      accomplishments: [
        `Led core capabilities of $1.5B B2B product, achieving ~20% YoY growth through innovative lead-finding, search, and messaging strategies.`,
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
    },
  ],
};

const realtor: Experience = {
  company: "Move Inc. - realtor.com",
  link: "https://www.realtor.com/",
  positions: [
    {
      title: "Sr Manager, Engineering",
      location: "Santa Clara, CA",
      startDate: new Date("2016-10-01"),
      endDate: new Date("2019-09-30"),
      accomplishments: [
        `Responsible for the web tier of the www.realtor.com site. Leading 3 managers and 38 engineers organized into 6 teams.`,
        `Proposed, managed, and delivered a project that overhauled SRP experience. Project increased company revenue by 9% (~35M).`,
        `I’ve built a business case for rewriting realtor.com to React.
                Delivered the project in time, exceeding project goals and meeting
                the company’s annual growth goals. On average improved
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
    },
  ],
};

const telmediq: Experience = {
  company: "TelmedIQ",
  link: "https://www.telmediq.com/",
  positions: [
    {
      title: "CTO and VP of Engineering",
      location: "Victoria, BC",
      startDate: new Date("2014-09-01"),
      endDate: new Date("2016-10-30"),
      accomplishments: [
        `Joined as 3rd employee, built engineering organization hiring 18 engineers and 2 managers into DEV (be, web, android, ios), QE, and DevOps roles and established engineering culture.`,
        `Led the development of a HIPAA compliant communication workflow for healthcare providers, recognized as the #1 vendor by KLAS and Gartner and acquired by PerfectServe.`,
        `Collaborated with the CEO to define product strategy and establish company culture.`,
        `Negotiated contracts with customers and vendors, and handled the technical side of RFPs.`,
        `Represented TelmedIQ at trade shows and worked closely with research firms.`,
      ].map((item) => normalizeWhitespace(item)),
    },
  ],
};

const symantec: Experience = {
  company: "Symantec",
  link: "https://www.symantec.com/",
  positions: [
    {
      title: "Principal Software Engineer",
      startDate: new Date("2008-09-01"),
      endDate: new Date("2015-06-31"),
      location: "Mountain View, CA",
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
    },
  ],
};

const simple: Experience = {
  company: "Simple S.A.",
  link: "https://www.simple.com/",
  positions: [
    {
      title: "Software Engineer",
      location: "Warsaw, Poland",
      startDate: new Date("2007-08-01"),
      endDate: new Date("2008-08-31"),
      accomplishments: [
        `Designed and implemented a prototype of automated supply chain management system that based
          on inventory thresholds inquired for quotes, picked the best bid, tracked payments and shipments. 
          It was an extension for a market leading ERP.`,
      ].map((item) => normalizeWhitespace(item)),
    },
  ],
};

const internet: Experience = {
  company: "Fast Internet",
  positions: [
    {
      title: "Founder",
      location: "Warsaw, Poland",
      startDate: new Date("2004-09-01"),
      endDate: new Date("2010-08-31"),

      accomplishments: [
        `Started a business providing broadband internet to a local
          community of about 40 users. Built all of the systems to support
          operations, most notably: billing, traffic shaping, captive portal
          for device registration. Sold business to a larger ISP.`,
      ].map((item) => normalizeWhitespace(item)),
    },
  ],
};

// <Section title="Patents">
//   <ul className="text-sm">
//     <li>
//       Semantic-aware next best action recommendation systems - 18/243883
//     </li>
//     <li>
//       Synthetic label generation for Natural Language-to-API systems
//     </li>
//   </ul>
// </Section>

const education: Education[] = [
  {
    institution: "Warsaw University of Technology",
    distinction: "Master of Science in Computer Science",
    startDate: new Date("2008-02-01"),
    endDate: new Date("2010-10-01"),
    location: "Warsaw, Poland",
    link: "https://www.elka.pw.edu.pl/",
  },
  {
    institution: "Warsaw University of Technology",
    distinction: "Bachelor of Science in Computer Science",
    startDate: new Date("2004-01-01"),
    endDate: new Date("2008-01-01"),
    location: "Warsaw, Poland",
    link: "https://www.elka.pw.edu.pl/",
  },
];

const certificates: Education[] = [
  {
    institution: "Haas School of Business, University of California Berkeley",
    distinction: "Certificate of Business Excellence",
    startDate: new Date("2019-01-01"),
    endDate: new Date("2022-01-01"),
    location: "Berkeley, CA",
    link: "https://executive.berkeley.edu/certificate-of-business-excellence",
    notes:
      "Negotiation and Influence, Product Management, Communication Excellence, Executive Decision Making with Data Science, Corporate Business Model Innovation",
  },
  {
    institution: "Stanford University",
    distinction: "Stanford Continuing Studies",
    notes:
      "Leadership and Decision-Making (BUS 53), The Exceptional Leader: A Framework for Impactful Leadership (WSP 199 B)",
    startDate: new Date("2017-01-01"),
    endDate: new Date("2018-01-01"),
    location: "Stanford, CA",
    link: "https://continuingstudies.stanford.edu/",
  },

  {
    institution: "SGH Warsaw School of Economics",
    distinction: "Certificate, IT Management and IT Governance",
    startDate: new Date("2010-01-01"),
    endDate: new Date("2011-01-01"),
    location: "Warsaw, Poland",
    link: "http://www.sgh.waw.pl/en/Pages/default.aspx",
  },
  {
    institution: "Ernst & Young Academy of Business",
    distinction: "Certificate, Project Management",
    startDate: new Date("2009-01-01"),
    endDate: new Date("2009-01-01"),
    location: "Warsaw, Poland",
    link: "https://www.academyofbusiness.pl/en",
  },
];

export const resumeRouter = createTRPCRouter({
  getResume: protectedProcedure
    .input(
      z.object({
        company_name: z.string(),
        version: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const db: DB = {
        base: {
          contactInfo,
          professionalSummary: [
            `Accomplished engineering leader with over a decade driving product innovation, strategic vision, and substantial revenue growth through high-performing teams. Expert in LLM-driven solutions, search technologies, AI modernization, and operational efficiency. Known for fostering innovation, mentoring top talent, and consistently exceeding business goals.`,
            `Recently I've been focused on taming the power of LLMs to create
            impossible-before products and delved into world of agents, prompt engineering,
            EBR, RAG, evals and LLM fine-tuning. My experience also includes managing the ROI of these investments. Additionally, I
            have experience with search, large-scale applications, A/B testing,
            SEO, Growth, leading large technology migrations, and driving tech excellence in organizations.`,
          ],
          experience: [
            {
              ...linkedIn,
            },
            {
              ...realtor,
            },
            {
              ...telmediq,
            },
            {
              ...symantec,
            },
            {
              ...simple,
            },
            {
              ...internet,
            },
          ],
          education,
          certificates,
        },

        salesforce: {
          contactInfo,
          professionalSummary: [
            `Engineering leader with over a decade of experience leading
            cross-functional teams to build AI-driven products and solutions.
            Strong expertise in Generative AI, Retrieval-Augmented Generation
            (RAG), large language models (LLMs), and Agentic workflows. Proven
            ability to define technical strategy, drive product innovation, and
            deliver value-driven outcomes. Passionate about fostering
            high-performing teams, mentoring engineering talent, and maintaining
            technical excellence while delivering impactful results.`,
          ],
          experience: [
            {
              ...linkedIn,
              positions: [
                {
                  ...linkedIn.positions[0],
                  accomplishments: [
                    "Led development of Generative AI features, contributing ~$100M incremental revenue. Projects included Account IQ, LeadIQ, Message Assist, and AI-Assisted Search, MSFT Co-Pilot for Sales integration, and most recently, overseeing Seller Agent product.",
                    "Defined product and technical vision, collaborated with cross-functional teams, and delivered AI-driven features to market, aligning closely with the strategic goals of the organization.",
                    "Filed two patents, key to the success of AI-based product innovations.",
                    "Partnered with infrastructure teams to influence the Generative AI strategy and implementation.",
                  ],
                },
                { ...linkedIn.positions[1] },
              ],
            },
            {
              ...realtor,
            },
            {
              ...telmediq,
            },
            {
              ...symantec,
            },
            {
              ...simple,
            },
            {
              ...internet,
            },
          ],
          education,
          certificates,
        },
      };

      return db[input.company_name.toLowerCase()];
    }),
});
