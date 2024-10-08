import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

interface ContactInfo {
  name: string;
  email: string;
  phone: string;
}

interface Experience {
  company: string;
  link: string;
  title: string;
  from: Date;
  location: string;
  accomplishments: string[];
}

interface Education {
  institution: string;
  distinction: string;
  startDate: Date;
  endDate: Date;
  location: string;
  link: string;
}

interface CompanyData {
  contactInfo: ContactInfo;
  professionalSummary: string[];
  experience: Experience[];
  education: Education[];
}

interface DB {
  [companyName: string]: CompanyData;
}

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
        salesforce: {
          contactInfo: {
            name: "Lukasz Karolewski",
            email: "lkarolewski@gmail.com",
            phone: "408 680 9149",
          },
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
              company: "LinkedIn",
              link: "https://linkedin.com",
              title: "Sr Manager, Engineering",
              from: new Date("2022-11-01"),
              location: "Sunnyvale, CA",
              accomplishments: [
                "Led development of Generative AI features, contributing ~$100M incremental revenue. Projects included Account IQ, LeadIQ, Message Assist, and AI-Assisted Search, MSFT Co-Pilot for Sales integration, and most recently, overseeing Seller Agent product.",
                "Defined product and technical vision, collaborated with cross-functional teams, and delivered AI-driven features to market, aligning closely with the strategic goals of the organization.",
                "Filed two patents, key to the success of AI-based product innovations.",
                "Partnered with infrastructure teams to influence the Generative AI strategy and implementation.",
              ],
            },
          ],
          education: [
            {
              institution: "Stanford University",
              distinction: "Master of Science in Computer Science",
              startDate: new Date("2010-09-01"),
              endDate: new Date("2012-06-01"),
              location: "Stanford, CA",
              link: "https://stanford.edu",
            },
            {
              institution: "University of California, Berkeley",
              distinction:
                "Bachelor of Science in Electrical Engineering and Computer Science",
              startDate: new Date("2006-09-01"),
              endDate: new Date("2010-06-01"),
              location: "Berkeley, CA",
              link: "https://berkeley.edu",
            },
          ],
        },
      };

      return db[input.company_name.toLowerCase()];
    }),
});
