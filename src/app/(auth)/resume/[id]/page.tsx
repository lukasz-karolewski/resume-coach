import ContactInfo from "~/components/resume/contact-info";
import EducationExperience from "~/components/resume/education-experience";
import JobExperience from "~/components/resume/job-experience";
import Section from "~/components/resume/section";
import { Skill, Skills } from "~/components/resume/skill";

export default async function HomePage() {
  const data = {
    contactInfo: {
      name: "Lukasz Karolewski",
      email: "lkarolewski@gmail.com",
      phone: "408 680 9149",
    },
    professionalSummary: "test \n test 2",
    skills: [
      { id: 1, name: "Strategic Technical Leadership" },
      { id: 2, name: "Cross-Functional Team Collaboration" },
      { id: 3, name: "Large-Scale Web Application Scalability" },
      { id: 4, name: "AI and Machine Learning" },
      { id: 5, name: "Product Roadmap Development" },
      { id: 6, name: "High-Impact Go-to-Market Strategies" },
      { id: 7, name: "Data-Driven Decision Making" },
      { id: 8, name: "Continuous Integration/Deployment (CI/CD)" },
      { id: 9, name: "Revenue Growth and Cost Optimization" },
      { id: 10, name: "Tech Talent Mentorship and Development" },
      { id: 11, name: "Agile Methodologies and SDLC Expertise" },
      { id: 12, name: "Corporate Innovation and Entrepreneurship" },
    ],
    experience: [],
    education: [],
  };

  return (
    <div className="m-auto flex max-w-4xl flex-col gap-4 bg-white p-12 shadow-lg dark:bg-gray-800 print:p-0 print:shadow-none">
      <ContactInfo
        name={data.contactInfo.name}
        email={data.contactInfo.email}
        phone={data.contactInfo.phone}
      />

      {/* <ProfessionalSummary text={resume.professionalSummary} /> */}

      <Skills>
        {data.skills.map((skill) => (
          <Skill key={skill.id}>{skill.name}</Skill>
        ))}
      </Skills>

      <Section title="Experience">
        <JobExperience
          company="LinkedIn"
          link="https://linkedin.com"
          title="Sr Manager, Engineering"
          from={new Date("2019-01-01")}
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
      </Section>
      <Section title="Patents">
        <ul>
          <li>
            Semantic-aware next best action recommendation systems - 18/243883
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
          distinction="Certificate of Business Excellence"
          school="Haas School of Business, University of California Berkeley"
          location="Berkeley, CA"
          link="https://executive.berkeley.edu/certificate-of-business-excellence"
          timeframe="2019 - 2022"
        >
          <span className="flex flex-wrap gap-2 text-sm">
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
      </Section>
    </div>
  );
}
