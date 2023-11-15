import EducationExperience from "./components/education-experience";
import JobExperience from "./components/job-experience";
import PersonalInfo from "./components/personal-info";
import Section from "./components/section";
import Skill from "./components/skill";
import TextEditor from "./components/text-editor";

export default async function HomePage() {
  return (
    <div className="max-w-4xl m-auto bg-white p-12 flex flex-col gap-4 shadow-lg print:shadow-none print:p-0 dark:bg-gray-800">
      <PersonalInfo
        name="Lukasz Karolewski"
        email="lkarolewski@gmail.com"
        phone="408 680 9149"
      />

      <p className="text-justify text-sm">
        I’m a technology leader with 20 years of experience in B2B and consumer
        environments. I’ve led feature, growth, and infrastructure teams. I
        believe in first-principles thinking and leading through context. I’m
        entrepreneurial and thrive in fast-paced, goal-driven, growth-oriented
        environments. I’ve built and sold a company, an entire engineering
        organization in a startup environment, and multiple teams in large
        organizations. I’ve managed managers. I’m a lifelong learner and love
        new challenges.
      </p>

      <p className="text-justify text-sm">
        I have experience with LLM’s, prompt engineering, RAG, langchain, LLM
        agents, machine learning, search, A/B testing, SEO, growth, leading
        technology migrations without disrupting business, driving tech
        excellence, high traffic (10k qps) web applications in multiple regions.
      </p>
      <Section title="Skills">
        <div className="flex text-xs gap-2 flex-wrap">
          <Skill>Strategic Technical Leadership</Skill>
          <Skill>Cross-Functional Team Collaboration</Skill>
          <Skill>Large-Scale Web Application Scalability</Skill>
          <Skill>AI and Machine Learning Implementation</Skill>
          <Skill>Product Roadmap Development</Skill>
          <Skill>High-Impact Go-to-Market Strategies</Skill>
          <Skill>Data-Driven Decision Making</Skill>
          <Skill>Continuous Integration/Deployment (CI/CD)</Skill>
          <Skill>Revenue Growth and Cost Optimization</Skill>
          <Skill>Tech Talent Mentorship and Development</Skill>
          <Skill>Agile Methodologies and SDLC Expertise</Skill>
          <Skill>Corporate Innovation and Entrepreneurship</Skill>
        </div>
      </Section>
      <Section title="Experience">
        <JobExperience
          company="LinkedIn"
          link="https://linkedin.com"
          title="Sr Manager, Engineering"
          timeframe="Nov 2022 - Present"
          location="Sunnyvale, CA"
        >
          <JobExperience.Accomplishments>
            <li>
              Delivered three Gen AI features to market. Created teams, defined
              technical vision, roadmap, influenced GTM strategy and design, and
              drove execution including trust requirements, automatic
              evaluation. Working directly with CPO and presenting to CEO on
              monthly basis.
            </li>
            <li>Filed 2 patent applications</li>
          </JobExperience.Accomplishments>
        </JobExperience>

        <JobExperience
          company="LinkedIn"
          link="https://linkedin.com"
          title="Sr Manager, Engineering"
          timeframe="3y, Sep 2019 - Oct 2022"
          location="Sunnyvale, CA"
        >
          <JobExperience.Accomplishments>
            <li>
              Responsible for all aspects of prospecting, outreach in the Sales
              Navigator - 80% of value prop of the 1.5B product.
            </li>
            <li>
              Created and leading Foundation Committee to drive technical
              excellence across LSS Business unit. Leading web UI, and mobile
              teams.
            </li>
            <li>
              Transformed search, and lead recommendations stacks driving 20
            </li>
            <li>Reduced on-call workload by 80%, by prioritizing .</li>
            <li>
              Partnered with Data standardization team to improve data quality
              and freshness, improved search precision for non-english queries.
            </li>
            {/* <li>Championed introducing Natural Language queries in search.</li> */}
            <li>
              Partnered with AI team to modernize AI tech stack, as a result
              reduced turn around to 2 weeks vs 4 months before.
            </li>
            <li>
              Introduced CSAT metric for gathering qualitative feedback in the
              a/b testing.
            </li>
            <li>
              Drove hardware rightsizing initiative which resulted in $4M annual
              savings, improved query performance, relevance of results.
            </li>
          </JobExperience.Accomplishments>
        </JobExperience>

        <JobExperience
          company="Move Inc. - realtor.com"
          title="Sr Manager, Engineering"
          location="Santa Clara, CA"
          timeframe="3y, Oct 2016 - Sep 2019"
        >
          <JobExperience.Accomplishments>
            <li>
              Responsible for web tier of the www.realtor.com site. Leading up
              to 3&nbsp;managers and 38&nbsp;engineers organized into
              6&nbsp;teams.
            </li>
            <li>
              Proposed, managed and delivered a project that overhauled SRP
              experience. Project increased company revenue by 9% (~35M).
            </li>
            <li>
              Built business case for rewriting realtor.com to React. Delivered
              project in time, exceeding project goals and meeting the company’s
              annual growth goals. On average improved above the fold render
              time by 45%, full page load by 40%, decreased bounce rate by 20%,
              Increased CSAT by 2 points, increased company revenue by 3% (~15M)
            </li>
            <li>
              Lead rewrite of business layer API’s that drove
              13&nbsp;people/year ongoing savings in development by spending
              1&nbsp;person/year of effort.
            </li>
            <li>
              Drove a 95% reduction in the umber of 500 errors driving error
              rate from ~0.2% to ~0.01% which was attributed to 2&nbsp;point
              increase in CSAT and improved SEO metrics.
            </li>
            <li>
              Collaborated with QE team to implement fully automated testing,
              which allowed moving from bi-weekly release to multiple daily
              releases, decreasing number of defects leaking to production.
            </li>
            <li>
              Refined hiring process in a way that increased onsite interview
              hire rate from 10% to 60%.
            </li>
            <li>
              Lead web technologies center of excellence, raising frontend
              technology expertise across the company.
            </li>
            <li>Migrated www.realtor.com to https.</li>
            <li>
              Contributed to embracing data-driven culture by building an
              experimentation program. Enabled the PM team to run over 30
              experiments in the first year and increased company revenue by 21%
              over the course of two years.
            </li>
            <li>
              Drove adoption of CICD reducing release process duration from 2
              days to 1 hour.
            </li>
          </JobExperience.Accomplishments>
        </JobExperience>

        <JobExperience
          company="TelmedIQ"
          title="CTO and VP of Engineering"
          location="Victoria, BC"
          timeframe="1.5y, Jun 2015 - Oct 2016"
        >
          <JobExperience.Accomplishments>
            <li>
              Built HIPAA compliant, streamlined communication workflow for
              healthcare providers recognized by KLAS and Gartner as #1 vendor
              in the space. Solution was deployed across 100 healthcare
              organizations and 30,000 users, driving +2M revenue.
            </li>
            <li>
              Joined as 3rd employee, built engineering organization hiring
              18&nbsp;engineers and 2&nbsp;managers into DEV (be, web, android,
              ios), QE and DevOps roles and established engineering culture.
            </li>
            <li>Negotiated contracts with customers and vendors.</li>
            <li>
              Responsible for the technical side of our company’s RFP responses.
            </li>
            <li>Represented company at HIMSS trade show.</li>
            <li>Worked with research firms (KLAS and Gartner).</li>
          </JobExperience.Accomplishments>
        </JobExperience>

        <JobExperience
          company="Symantec"
          title="Principal Software Engineer"
          location="Mountain View, CA"
          timeframe="6y 10mo, Sep 2008 - Jun 2015"
        >
          <ul className="text-sm flex flex-col gap-2">
            <li>
              <strong>Enterprise Security Group</strong>
              <JobExperience.Accomplishments>
                <li>
                  As a frontend architect, I was overseeing the migration of 8
                  Symantec cloud-based products into angular, coaching and
                  mentoring frontend teams of those products.
                </li>
                <li>
                  Initiated `Symantec open source` ecosystem to enhance
                  collaboration across teams.
                </li>
                <li>
                  Introduced git as an officially supported code repository,
                  Worked with C-level executives to build cross-organizational
                  support for the initiative, and VP level executives on
                  implementation.
                </li>
                <li>
                  Responsible for a complete redesign of a legacy web
                  application into a bleeding edge responsive, single page
                  application. The new version had support for branding, theming
                  and was localized into 14 languages.
                </li>
                <li>
                  Achieved 70% code coverage in unit tests for frontend,
                  designed and implemented e2e automation reducing the number of
                  defects by 60%.
                </li>
              </JobExperience.Accomplishments>
            </li>

            <li>
              <strong>Information Security Group</strong>
              <JobExperience.Accomplishments>
                <li>
                  VIP Intelligent Authentication Services Development Team.
                  Responsible for the design and implementation of multi-tiered
                  enterprise web applications as well as web services. Actively
                  participating in all phases of the software development life
                  cycle including requirement analysis, design, implementation,
                  and testing. Actively involved in the deployment of web
                  application and services to data centers as well as helping
                  resolve technical issues faced by customers while using the
                  product.
                </li>
                <li>SQL query optimization</li>
                <li>
                  Redesigned build process migrating it from Ant to Gradle
                  reducing build time from 15&nbsp;min to under 1&nbsp;min.
                </li>
                <li>
                  Created a new deployment model that utilized rpm and enabled
                  fully automatic deployment. Reduced deploy time to 1&nbsp;hour
                  from 3-day manual process before.
                </li>
              </JobExperience.Accomplishments>
            </li>

            <li>
              <strong>Internationalization team</strong>
              <JobExperience.Accomplishments>
                <li>
                  Responsible for end to end analysis, design and implementation
                  of i18n features for multiple products in Information Security
                  Group.
                </li>
                <li>
                  Created a localization process and built tooling to automate
                  localization. Used by 3 products to automate testing and
                  translation into 14 languages.
                </li>
              </JobExperience.Accomplishments>
            </li>
          </ul>
        </JobExperience>

        <JobExperience
          company="Simple S.A."
          title="Software Engineer"
          location="Warsaw, Poland"
          timeframe="1y 1mo, Aug 2007 - Aug 2008"
        >
          <ul className="text-sm">
            <li>
              As a part of a four-member team designed and implemented a
              prototype of automated supply chain management system that based
              on inventory thresholds inquired for quotes, based on user-defined
              criteria picked the best bid, tracked payments and shipments. It
              was an extension of a well established ERP.
            </li>
          </ul>
        </JobExperience>

        <JobExperience
          company="Fast Internet"
          title="Founder"
          location="Warsaw, Poland"
          timeframe="6y, Sep 2004 - Aug 2010"
        >
          <ul className="text-sm">
            <li>
              Started a business providing broadband internet to a local
              community of about 40 users. Built all of the systems to support
              operations, most notably: billing, traffic shaping, captive portal
              for device registration. Sold business to a larger ISP.
            </li>
          </ul>
        </JobExperience>
      </Section>
      <Section title="Patents">
        <ul>
          <li>
            Semantic-aware next best action recommendation systems - 18/243883
          </li>
          <li>
            Synthetic label generation for Natural Language-to-API systems
          </li>
        </ul>
      </Section>
      <Section title="Education">
        <EducationExperience
          distinction="Master of Science, Computer Science"
          school="Warsaw University of Technology"
          location="Warsaw, Poland"
          link="https://www.pw.edu.pl/engpw"
          timeframe="2008 - 2010"
        />

        <EducationExperience
          distinction="Bachelor of Science, Computer Science"
          school="Warsaw University of Technology"
          location="Warsaw, Poland"
          link="https://www.pw.edu.pl/engpw"
          timeframe="2004 - 2008"
        />

        <EducationExperience
          distinction="Certificate of Business Excellence"
          school="Haas School of Business, University of California Berkeley"
          location="Berkeley, CA"
          link="https://executive.berkeley.edu/certificate-of-business-excellence"
          timeframe="2019 - 2022"
        >
          <span className="text-sm flex flex-wrap gap-2">
            <a href="https://executive.berkeley.edu/programs/negotiation-and-influence">
              Negotiation and Influence
            </a>
            <a href="https://executive.berkeley.edu/programs/product-management-studio">
              Product Management
            </a>
            <a href="https://executive.berkeley.edu/communications/excellence">
              Communication Excellence
            </a>
            Communication Excellence
            <a href="https://executive.berkeley.edu/programs/executive-decision-making">
              Executive Decision Making with Data Science
            </a>
            <a>Corporate Business Model Innovation</a>
          </span>
        </EducationExperience>

        <EducationExperience
          distinction="Course BUS 53, Leadership and Decision-Making"
          school="Stanford Continuing Studies, Stanford University"
          location="Stanford, CA"
          link="https://continuingstudies.stanford.edu/"
          timeframe="2017"
        />

        <EducationExperience
          distinction="Course WSP 179 B, The Exceptional Leader: A Framework for Impactful Leadership"
          school="Stanford Continuing Studies, Stanford University"
          location="Stanford, CA"
          link="https://continuingstudies.stanford.edu/"
          timeframe="2017"
        />

        <EducationExperience
          distinction="Certificate, IT Management and IT Governance"
          school="SGH Warsaw School of Economics"
          location="Warsaw, Poland"
          link="http://www.sgh.waw.pl/en/Pages/default.aspx"
          timeframe="2010 - 2011"
        />

        <EducationExperience
          distinction="Certificate, Project Management"
          school="Ernst & Young Academy of Business"
          location="Warsaw, Poland"
          link="https://www.academyofbusiness.pl/en"
          timeframe="2009"
        />
      </Section>
    </div>
  );
}
