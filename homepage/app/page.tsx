import { EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/solid";
import JobExperience from "./components/job-experience";
import EducationExperience from "./components/education-experience";
import Section from "./components/section";
import Header from "./components/header";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-left gap-4 p-12">
      <div>
        <h1 className="text-4xl">Lukasz Karolewski</h1>
        <div className="flex">
          <PhoneIcon className="w-4 mr-2" /> 408 680 9149
        </div>
        <div className="flex">
          <EnvelopeIcon className="w-4 mr-2" />
          lkarolewski@gmail.com
        </div>
      </div>

      <p>
        I’m a technology leader with 15+ years of experience in both B2B and
        consumer environments. I believe in first principles thinking and
        leading through setting context. I thrive in fast-paced, goal-driven,
        growth-oriented environments. I’m entrepreneurial. I’ve built and sold a
        company, I’ve built an entire technology organization in a startup
        environment and teams from scratch in large organizations. I have
        experience managing managers, running high traffic ( ̃10k qps) web
        applications in a public cloud, as well as managing search
        infrastructure in private data centers, both with 99.99 availability and
        in multiple regions. Rich experience driving A/B testing, SEO, growth,
        leading technology migrations without disrupting business, and driving
        tech excellence. I love learning and grappling with a fresh challenge.
      </p>

      <Section>
        <Header title="Experince" />

        <JobExperience
          company="LinkedIn"
          link="https://linkedin.com"
          title="Sr Manager, Engineering"
          timeframe="2019 - Present"
          location="Sunnyvale, CA"
        >
          <ul className="list-inside list-disc text-sm">
            <li>
              Responsible for end-to-end search experience in Sales Navigator
              product (including UI, api, search infrastructure, hardware) and
              messaging.
            </li>
            <li>
              Leading group of 15 engineers. ○Leading a virtual group of 20 UI
              engineers to modernize UI tech stack, without disrupting the
              business.
            </li>
            <li>
              Built new team to lead recommendations track. ○Drove initiative to
              reduce on-call workload by 80% to 0.2 person/week.
            </li>
            <li>
              Partnered with Data standardization team to improve data quality
              and freshness, improved search precision for non-english queries.
            </li>
            <li>Championed introducing Natural Language queries in search.</li>
            <li>
              Partnering with AI team to modernize AI tech stack, as a result
              introducing brand new model takes now 2 weeks vs 4 months before.
            </li>
            <li>
              Introduced CSAT metric for gathering qualitative feedback in the
              a/b testing.
            </li>
            <li>
              Drove hardware rightsizing initiative which resulted in $4M annual
              savings, improved query performance, relevance of results.
            </li>
          </ul>
        </JobExperience>

        <JobExperience
          company="Move Inc. - realtor.com"
          title="Sr Manager, Engineering"
          location="Santa Clara, CA"
          timeframe="3 yr, Oct 2016 - Sep 2019"
        >
          <ul className="list-inside list-disc text-sm">
            <li>
              <li>
                Responsible for web tier of the www.realtor.com site. Leading up
                to 3&nbsp;managers and 38&nbsp;engineers organized into 6 teams.
              </li>
              <li>
                Proposed, managed and delivered a project that overhauled SRP
                experience. Project increased company revenue by 9% (~35M).
              </li>
              <li>
                Built business case for rewriting realtor.com to React.
                Delivered project in time, exceeding project goals and meeting
                the company's annual growth goals. On average improved above the
                fold render time by 45%, full page load by 40%, decreased bounce
                rate by 20%, Increased CSAT by 2 points, increased company
                revenue by 3% (~15M)
              </li>
              <li>
                Lead rewrite of business layer API's that drove 13 people/year
                ongoing savings in development by spending 1 person/year of
                effort.
              </li>
              <li>
                Drove a 95% reduction in the umber of 500 errors driving error
                rate from ~0.2% to ~0.01% which was attributed to 2 point
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
                experiments in the first year and increased company revenue by
                21% over the course of two years.
              </li>
              <li>
                Drove adoption of CICD reducing release process duration from 2
                days to 1 hour.
              </li>
            </li>
          </ul>
        </JobExperience>

        <JobExperience
          company="TelmedIQ"
          title="CTO and VP of Engineering"
          location="Victoria, BC"
          timeframe="1.5 yr, Jun 2015 - Oct 2016"
        >
          <ul className="list-inside list-disc text-sm">
            <li>
              Joined as 3rd employee, built engineering organization and hired
              18&nbsp;engineers and 2&nbsp;managers into DEV (web, android, ios,
              api), QE and DevOps roles.
            </li>
            <li>
              Built HIPAA compliant, streamlined communication workflow for
              healthcare providers recognized by KLAS and Gartner as \#1 vendor
              in the space. Solution was deployed across 100 healthcare
              organizations and 30,000 users, driving +2M revenue.
            </li>
            <li>
              Working with CEO on defining product strategy and establishing
              company culture.
            </li>
            <li>Negotiated contracts with customers and vendors.</li>
            <li>Responsible for the technical side of RFP's.</li>
            <li>Represented company at trade shows.</li>
            <li>Worked with research firms (KLAS and Gartner).</li>
          </ul>
        </JobExperience>

        <JobExperience
          company="Symantec"
          title="Principal Software Engineer"
          location="Mountain View, CA"
          timeframe="6 yr 10 mo, Sep 2008 - Jun 2015"
        >
          <ul className="text-sm flex flex-col gap-2">
            <li>
              Enterprise Security Group
              <ul className="list-inside list-disc">
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
              </ul>
            </li>

            <li>
              Information Security Group
              <ul className="list-inside list-disc">
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
                  Created a new deployment model that utilized rpm and enabled
                  fully automatic deployment. Brought down deploy time to
                  1&nbsp;hour from 3-day manual process before.
                </li>
              </ul>
            </li>

            <li>
              Internationalization team
              <ul className="list-inside list-disc">
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
              </ul>
            </li>
          </ul>
        </JobExperience>

        <JobExperience
          company="Simple S.A."
          title="Software Engineer"
          location="Warsaw, Poland"
          timeframe="1 yr 1 mo, Jun 2015 - Oct 2016"
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
          timeframe="6 yr, Sep 2004 - Aug 2010"
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

      <Section>
        <Header title="Patents" />

        <p>18/243883</p>

        <p>18/243883</p>
      </Section>

      <Section>
        <Header title="Education" />
        <EducationExperience
          distinction="Master of Science, Computer Science"
          school="Warsaw University of Technology"
          location="Warsaw, Poland"
          link="https://www.pw.edu.pl/engpw"
          timeframe="2004"
        />

        <EducationExperience
          distinction="Bachelor of Science, Computer Science"
          school="Warsaw University of Technology"
          location="Warsaw, Poland"
          link="https://www.pw.edu.pl/engpw"
          timeframe="2004"
        />

        <EducationExperience
          distinction="Certificate of Business Excellence"
          school="Haas School of Business, University of California Berkeley"
          location="Berkeley, CA"
          link="https://executive.berkeley.edu/certificate-of-business-excellence"
          timeframe="2019 - 2022"
        />

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
        {/* {[
          [
            "Certificate, Communication Excellence",
            "https://executive.berkeley.edu/communications/excellence",
            "2021",
          ],
          [
            "Certificate, Product Management",
            "https://executive.berkeley.edu/programs/product-management-studio",
            "2020",
          ],
          [
            "Certificate, Executive Decision Making with Data Science",
            "https://executive.berkeley.edu/programs/executive-decision-making",
            "2019",
          ],
          [
            "Certificate, Negotiation and Influence",
            "https://executive.berkeley.edu/programs/negotiation-and-influence",
            "2019",
          ],
        ]} */}
      </Section>
    </main>
  );
}
