import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { EducationType } from "~/generated/prisma/client";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { normalizeWhitespace } from "~/utils";

// ============================================================================
// Zod Schemas for CRUD Operations
// ============================================================================

const positionSchema = z.object({
  accomplishments: z.array(z.string()),
  endDate: z.date().optional(),
  id: z.number().optional(),
  location: z.string(),
  startDate: z.date(),
  title: z.string(),
});

const experienceSchema = z.object({
  companyName: z.string(),
  id: z.number().optional(),
  link: z.string().optional(),
  positions: z.array(positionSchema),
});

const educationSchema = z.object({
  distinction: z.string(),
  endDate: z.date(),
  id: z.number().optional(),
  institution: z.string(),
  link: z.string(),
  location: z.string(),
  notes: z.string().optional(),
  startDate: z.date(),
  type: z.enum(EducationType),
});

const contactInfoSchema = z.object({
  email: z.email(),
  id: z.number().optional(),
  name: z.string(),
  phone: z.string(),
});

// ============================================================================
// TypeScript Interfaces for Legacy Data (to be migrated)
// ============================================================================

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
  email: "lkarolewski@gmail.com",
  name: "Lukasz Karolewski",
  phone: "408 680 9149",
};

const linkedIn: Experience = {
  company: "LinkedIn",
  link: "https://linkedin.com",
  positions: [
    {
      accomplishments: [
        `Tech lead for Sales Assistant, defining product and technical vision for organization of 120 engineers`,
        `Driving AI strategy for Sales Navigator, including integration with MSFT Copilot for Sales`,
        `Leading cross-functional teams to deliver AI-driven features, collaborating closely with PM, Design, Data Science, and Infra teams to ensure alignment with strategic goals.`,
        `Mentoring engineering leaders and fostering a culture of innovation and technical excellence.`,
      ].map((item) => normalizeWhitespace(item)),
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
      location: "Sunnyvale, CA",
      startDate: new Date("2019-09-09"),
      title: "Sr Manager, Engineering",
    },
  ],
};

const realtor: Experience = {
  company: "Move Inc. - realtor.com",
  link: "https://www.realtor.com/",
  positions: [
    {
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
      endDate: new Date("2019-09-30"),
      location: "Santa Clara, CA",
      startDate: new Date("2016-10-01"),
      title: "Sr Manager, Engineering",
    },
  ],
};

const telmediq: Experience = {
  company: "TelmedIQ",
  link: "https://www.telmediq.com/",
  positions: [
    {
      accomplishments: [
        `Joined as 3rd employee, built engineering organization hiring 18 engineers and 2 managers into DEV (be, web, android, ios), QE, and DevOps roles and established engineering culture.`,
        `Led the development of a HIPAA compliant communication workflow for healthcare providers, recognized as the #1 vendor by KLAS and Gartner and acquired by PerfectServe.`,
        `Collaborated with the CEO to define product strategy and establish company culture.`,
        `Negotiated contracts with customers and vendors, and handled the technical side of RFPs.`,
        `Represented TelmedIQ at trade shows and worked closely with research firms.`,
      ].map((item) => normalizeWhitespace(item)),
      endDate: new Date("2016-10-30"),
      location: "Victoria, BC",
      startDate: new Date("2014-09-01"),
      title: "CTO and VP of Engineering",
    },
  ],
};

const symantec: Experience = {
  company: "Symantec",
  link: "https://www.symantec.com/",
  positions: [
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
      location: "Mountain View, CA",
      startDate: new Date("2008-09-01"),
      title: "Principal Software Engineer",
    },
  ],
};

const simple: Experience = {
  company: "Simple S.A.",
  link: "https://www.simple.com/",
  positions: [
    {
      accomplishments: [
        `Designed and implemented a prototype of automated supply chain management system that based
          on inventory thresholds inquired for quotes, picked the best bid, tracked payments and shipments. 
          It was an extension for a market leading ERP.`,
      ].map((item) => normalizeWhitespace(item)),
      endDate: new Date("2008-08-31"),
      location: "Warsaw, Poland",
      startDate: new Date("2007-08-01"),
      title: "Software Engineer",
    },
  ],
};

const internet: Experience = {
  company: "Fast Internet",
  positions: [
    {
      accomplishments: [
        `Started a business providing broadband internet to a local
          community of about 40 users. Built all of the systems to support
          operations, most notably: billing, traffic shaping, captive portal
          for device registration. Sold business to a larger ISP.`,
      ].map((item) => normalizeWhitespace(item)),
      endDate: new Date("2010-08-31"),
      location: "Warsaw, Poland",
      startDate: new Date("2004-09-01"),
      title: "Founder",
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
    distinction: "Master of Science in Computer Science",
    endDate: new Date("2010-10-01"),
    institution: "Warsaw University of Technology",
    link: "https://www.elka.pw.edu.pl/",
    location: "Warsaw, Poland",
    startDate: new Date("2008-02-01"),
  },
  {
    distinction: "Bachelor of Science in Computer Science",
    endDate: new Date("2008-01-01"),
    institution: "Warsaw University of Technology",
    link: "https://www.elka.pw.edu.pl/",
    location: "Warsaw, Poland",
    startDate: new Date("2004-01-01"),
  },
];

const certificates: Education[] = [
  {
    distinction: "Certificate of Business Excellence",
    endDate: new Date("2022-01-01"),
    institution: "Haas School of Business, University of California Berkeley",
    link: "https://executive.berkeley.edu/certificate-of-business-excellence",
    location: "Berkeley, CA",
    notes:
      "Negotiation and Influence, Product Management, Communication Excellence, Executive Decision Making with Data Science, Corporate Business Model Innovation",
    startDate: new Date("2019-01-01"),
  },
  {
    distinction: "Stanford Continuing Studies",
    endDate: new Date("2018-01-01"),
    institution: "Stanford University",
    link: "https://continuingstudies.stanford.edu/",
    location: "Stanford, CA",
    notes:
      "Leadership and Decision-Making (BUS 53), The Exceptional Leader: A Framework for Impactful Leadership (WSP 199 B)",
    startDate: new Date("2017-01-01"),
  },

  {
    distinction: "Certificate, IT Management and IT Governance",
    endDate: new Date("2011-01-01"),
    institution: "SGH Warsaw School of Economics",
    link: "http://www.sgh.waw.pl/en/Pages/default.aspx",
    location: "Warsaw, Poland",
    startDate: new Date("2010-01-01"),
  },
  {
    distinction: "Certificate, Project Management",
    endDate: new Date("2009-01-01"),
    institution: "Ernst & Young Academy of Business",
    link: "https://www.academyofbusiness.pl/en",
    location: "Warsaw, Poland",
    startDate: new Date("2009-01-01"),
  },
];

export const resumeRouter = createTRPCRouter({
  // ============================================================================
  // CRUD Operations
  // ============================================================================

  // Create a new resume
  create: protectedProcedure
    .input(
      z.object({
        contactInfo: contactInfoSchema.optional(),
        education: z.array(educationSchema).default([]),
        experience: z.array(experienceSchema).default([]),
        jobId: z
          .string()
          .optional()
          .transform((val) => val || undefined),
        name: z.string().default("New Resume"),
        professionalSummary: z.array(z.string()).default([]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      console.log("DEBUG resume.create input:", JSON.stringify(input, null, 2));
      console.log("DEBUG userId:", userId);

      // Validate jobId if provided
      if (input.jobId) {
        const job = await ctx.db.job.findFirst({
          where: {
            id: input.jobId,
            userId: userId,
          },
        });

        if (!job) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Job not found or does not belong to user",
          });
        }
      }

      // First create contact info if provided
      let contactInfoId: number | undefined;
      if (input.contactInfo) {
        const contactInfo = await ctx.db.contactInfo.create({
          data: {
            email: input.contactInfo.email,
            name: input.contactInfo.name,
            phone: input.contactInfo.phone,
          },
        });
        contactInfoId = contactInfo.id;
      }

      // Create resume with nested relations
      console.log("DEBUG creating resume with data:", {
        contactInfoId: contactInfoId ?? null,
        jobId: input.jobId ?? null,
        name: input.name,
        userId: userId,
      });

      const resume = await ctx.db.resume.create({
        data: {
          contactInfoId: contactInfoId ?? null,
          education: {
            create: input.education.map((edu) => ({
              distinction: edu.distinction,
              endDate: edu.endDate,
              institution: edu.institution,
              link: edu.link,
              location: edu.location,
              notes: edu.notes,
              startDate: edu.startDate,
              type: edu.type,
            })),
          },
          experience: {
            create: input.experience.map((exp) => ({
              companyName: exp.companyName,
              link: exp.link,
              positions: {
                create: exp.positions.map((pos) => ({
                  accomplishments: JSON.stringify(pos.accomplishments),
                  endDate: pos.endDate,
                  location: pos.location,
                  startDate: pos.startDate,
                  title: pos.title,
                })),
              },
            })),
          },
          jobId: input.jobId ?? null,
          name: input.name,
          summary: JSON.stringify(input.professionalSummary),
          userId: userId!,
        },
        include: {
          contactInfo: true,
          education: true,
          experience: {
            include: {
              positions: true,
            },
          },
        },
      });

      return resume;
    }),

  // Delete resume
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Verify ownership
      const existing = await ctx.db.resume.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resume not found",
        });
      }

      await ctx.db.resume.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Duplicate resume (useful for creating job-specific versions)
  duplicate: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        jobId: z
          .string()
          .optional()
          .transform((val) => val || undefined),
        name: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Validate jobId if provided
      if (input.jobId) {
        const job = await ctx.db.job.findFirst({
          where: {
            id: input.jobId,
            userId: ctx.session.user.id,
          },
        });

        if (!job) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Job not found or does not belong to user",
          });
        }
      }

      // Get original resume
      const original = await ctx.db.resume.findFirst({
        include: {
          contactInfo: true,
          education: true,
          experience: {
            include: {
              positions: true,
            },
          },
        },
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      if (!original) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resume not found",
        });
      }

      // Create duplicate
      const duplicate = await ctx.db.resume.create({
        data: {
          name: input.name ?? `${original.name} (Copy)`,
          user: {
            connect: { id: ctx.session.user.id },
          },
          ...(input.jobId && {
            Job: {
              connect: { id: input.jobId },
            },
          }),
          ...(original.contactInfo && {
            contactInfo: {
              create: {
                email: original.contactInfo.email,
                name: original.contactInfo.name,
                phone: original.contactInfo.phone,
              },
            },
          }),
          education: {
            create: original.education.map((edu) => ({
              distinction: edu.distinction,
              endDate: edu.endDate,
              institution: edu.institution,
              link: edu.link,
              location: edu.location,
              notes: edu.notes,
              startDate: edu.startDate,
              type: edu.type,
            })),
          },
          experience: {
            create: original.experience.map((exp) => ({
              companyName: exp.companyName,
              link: exp.link,
              positions: {
                create: exp.positions.map((pos) => ({
                  accomplishments: pos.accomplishments,
                  endDate: pos.endDate,
                  location: pos.location,
                  startDate: pos.startDate,
                  title: pos.title,
                })),
              },
            })),
          },
          summary: original.summary,
        },
        include: {
          contactInfo: true,
          education: true,
          experience: {
            include: {
              positions: true,
            },
          },
        },
      });

      return {
        ...duplicate,
        experience: duplicate.experience.map((exp) => ({
          ...exp,
          positions: exp.positions.map((pos) => ({
            ...pos,
            accomplishments: JSON.parse(
              pos.accomplishments as string,
            ) as string[],
          })),
        })),
        summary: JSON.parse(duplicate.summary) as string[],
      };
    }),

  // Get resume by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const resume = await ctx.db.resume.findFirst({
        include: {
          contactInfo: true,
          education: true,
          experience: {
            include: {
              positions: {
                include: {
                  skillPosition: {
                    include: {
                      skill: true,
                    },
                  },
                },
              },
            },
          },
          Job: true,
        },
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      if (!resume) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resume not found",
        });
      }

      // Parse JSON fields
      return {
        ...resume,
        experience: resume.experience.map((exp) => ({
          ...exp,
          positions: exp.positions.map((pos) => ({
            ...pos,
            accomplishments: JSON.parse(pos.accomplishments) as string[],
          })),
        })),
        summary: JSON.parse(resume.summary) as string[],
      };
    }),

  // ============================================================================
  // Legacy Hardcoded Data (To Be Migrated)
  // ============================================================================

  getResume: protectedProcedure
    .input(
      z.object({
        company_name: z.string(),
        version: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const db: DB = {
        base: {
          certificates,
          contactInfo,
          education,
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
          professionalSummary: [
            `Accomplished engineering leader with over a decade of experience driving product innovation, strategic vision, and substantial revenue growth through high-performing teams. Expert in LLM-driven solutions, search technologies, AI modernization, and operational efficiency. Known for fostering innovation, mentoring top talent, and consistently exceeding business goals. Excels in strategic planning, team leadership, and detailed execution.`,
          ],
        },

        salesforce: {
          certificates,
          contactInfo,
          education,
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
        },
      };

      return db[input.company_name.toLowerCase()];
    }),

  // List all resumes for the current user
  list: protectedProcedure
    .input(
      z
        .object({
          jobId: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ input, ctx }) => {
      const resumes = await ctx.db.resume.findMany({
        include: {
          _count: {
            select: {
              education: true,
              experience: true,
            },
          },
          contactInfo: true,
          Job: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
        where: {
          userId: ctx.session.user.id,
          ...(input?.jobId ? { jobId: input.jobId } : {}),
        },
      });

      return resumes;
    }),

  // Update resume
  update: protectedProcedure
    .input(
      z.object({
        contactInfo: contactInfoSchema.optional(),
        education: z.array(educationSchema).optional(),
        experience: z.array(experienceSchema).optional(),
        id: z.number(),
        name: z.string().optional(),
        professionalSummary: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Verify ownership
      const existing = await ctx.db.resume.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resume not found",
        });
      }

      // Update contact info if provided
      if (input.contactInfo) {
        if (existing.contactInfoId) {
          await ctx.db.contactInfo.update({
            data: {
              email: input.contactInfo.email,
              name: input.contactInfo.name,
              phone: input.contactInfo.phone,
            },
            where: { id: existing.contactInfoId },
          });
        } else {
          // Create new contact info and connect to resume
          const newContactInfo = await ctx.db.contactInfo.create({
            data: {
              email: input.contactInfo.email,
              name: input.contactInfo.name,
              phone: input.contactInfo.phone,
            },
          });
          await ctx.db.resume.update({
            data: {
              contactInfo: {
                connect: { id: newContactInfo.id },
              },
            },
            where: { id: input.id },
          });
        }
      }

      // Handle experience updates
      if (input.experience) {
        // Delete existing experiences
        await ctx.db.experience.deleteMany({
          where: { resumeId: input.id },
        });

        // Create new experiences
        await ctx.db.experience.createMany({
          data: input.experience.map((exp) => ({
            companyName: exp.companyName,
            link: exp.link,
            resumeId: input.id,
          })),
        });

        // Get created experiences and add positions
        const experiences = await ctx.db.experience.findMany({
          where: { resumeId: input.id },
        });

        for (let i = 0; i < input.experience.length; i++) {
          const exp = input.experience[i];
          const dbExp = experiences[i];
          if (exp && dbExp) {
            await ctx.db.position.createMany({
              data: exp.positions.map((pos) => ({
                accomplishments: JSON.stringify(pos.accomplishments),
                endDate: pos.endDate,
                experienceId: dbExp.id,
                location: pos.location,
                startDate: pos.startDate,
                title: pos.title,
              })),
            });
          }
        }
      }

      // Handle education updates
      if (input.education) {
        // Delete existing education
        await ctx.db.education.deleteMany({
          where: { resumeId: input.id },
        });

        // Create new education
        await ctx.db.education.createMany({
          data: input.education.map((edu) => ({
            distinction: edu.distinction,
            endDate: edu.endDate,
            institution: edu.institution,
            link: edu.link,
            location: edu.location,
            notes: edu.notes,
            resumeId: input.id,
            startDate: edu.startDate,
            type: edu.type,
          })),
        });
      }

      // Update resume
      const updated = await ctx.db.resume.update({
        data: {
          ...(input.name && { name: input.name }),
          ...(input.professionalSummary && {
            summary: JSON.stringify(input.professionalSummary),
          }),
        },
        include: {
          contactInfo: true,
          education: true,
          experience: {
            include: {
              positions: true,
            },
          },
        },
        where: { id: input.id },
      });

      return {
        ...updated,
        experience: updated.experience.map((exp) => ({
          ...exp,
          positions: exp.positions.map((pos) => ({
            ...pos,
            accomplishments: JSON.parse(pos.accomplishments) as string[],
          })),
        })),
        summary: JSON.parse(updated.summary) as string[],
      };
    }),
});
