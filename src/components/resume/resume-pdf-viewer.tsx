"use client";

import {
  Document,
  Font,
  Link,
  Page,
  Path,
  PDFViewer,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ReactNode } from "react";

import { formatFromTo, toYearMonthsDuration } from "~/app/utils";
import type { RouterOutputs } from "~/trpc/shared";

import { partitionResumeEducation, toResumeTextBlocks } from "./resume-content";

export type ResumePdfData = RouterOutputs["resume"]["getById"];
type Resume = ResumePdfData;
type Education = Resume["education"][number];
type Experience = Resume["experience"][number];
type Position = Experience["positions"][number];

const PDF_FONT_FAMILY = "Noto Serif";
const FONT_BASE_PATH =
  typeof window === "undefined"
    ? `${process.cwd()}/public/fonts/noto-serif`
    : "/fonts/noto-serif";

Font.register({
  family: PDF_FONT_FAMILY,
  fonts: [
    {
      fontWeight: 400,
      src: `${FONT_BASE_PATH}/NotoSerif-Regular.ttf`,
    },
    {
      fontWeight: 700,
      src: `${FONT_BASE_PATH}/NotoSerif-Bold.ttf`,
    },
  ],
});

const styles = StyleSheet.create({
  bullet: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 3,
    paddingLeft: 4,
  },
  bulletMarker: {
    width: 8,
  },
  company: {
    marginBottom: 10,
  },
  companyName: {
    color: "#111827",
    fontSize: 10.5,
    fontWeight: 700,
    marginBottom: 5,
  },
  contactDetails: {
    flexDirection: "column",
    gap: 3,
  },
  contactIcon: {
    height: 9,
    width: 9,
  },
  contactRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
  },
  contactText: {
    color: "#4b5563",
    fontSize: 8.5,
  },
  educationDetails: {
    color: "#374151",
    fontSize: 8.5,
    marginTop: 2,
  },
  educationHeader: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  educationItem: {
    marginBottom: 7,
  },
  educationTitle: {
    flexGrow: 1,
    fontSize: 9.5,
    fontWeight: 700,
  },
  footer: {
    bottom: 20,
    color: "#9ca3af",
    fontSize: 7,
    left: 42,
    position: "absolute",
    right: 42,
    textAlign: "center",
  },
  header: {
    gap: 4,
    marginBottom: 16,
  },
  link: {
    color: "#111827",
    textDecoration: "none",
  },
  name: {
    color: "#111827",
    fontSize: 20,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  page: {
    backgroundColor: "#ffffff",
    color: "#1f2937",
    fontFamily: PDF_FONT_FAMILY,
    fontSize: 9,
    lineHeight: 1.35,
    paddingBottom: 46,
    paddingHorizontal: 42,
    paddingTop: 38,
  },
  paragraph: {
    marginBottom: 4,
  },
  position: {
    marginBottom: 9,
  },
  positionHeader: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 3,
  },
  positionLocation: {
    color: "#4b5563",
    fontSize: 8,
    marginBottom: 4,
  },
  positionTitle: {
    flexGrow: 1,
    fontSize: 9.5,
    fontWeight: 700,
  },
  section: {
    marginBottom: 13,
  },
  sectionTitle: {
    borderBottomColor: "#d1d5db",
    borderBottomWidth: 0.75,
    color: "#111827",
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 7,
    paddingBottom: 3,
  },
  timeframe: {
    color: "#4b5563",
    fontSize: 8,
    textAlign: "right",
  },
  viewer: {
    borderWidth: 0,
    height: "100%",
    width: "100%",
  },
});

export const resumePdfStyles = styles;

function ContactIcon({ type }: { type: "email" | "phone" }) {
  if (type === "phone") {
    return (
      <Svg style={styles.contactIcon} viewBox="0 0 24 24">
        <Path
          d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z"
          fill="#4b5563"
        />
      </Svg>
    );
  }

  return (
    <Svg style={styles.contactIcon} viewBox="0 0 24 24">
      <Path
        d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z"
        fill="#4b5563"
      />
      <Path
        d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z"
        fill="#4b5563"
      />
    </Svg>
  );
}

function ContactRow({
  children,
  type,
}: {
  children: string;
  type: "email" | "phone";
}) {
  return (
    <View style={styles.contactRow}>
      <ContactIcon type={type} />
      <Text style={styles.contactText}>{children}</Text>
    </View>
  );
}

function PdfMarkdown({ markdown }: { markdown: string }) {
  return toResumeTextBlocks(markdown).map((block, index) =>
    block.kind === "bullet" ? (
      // The parsed block order is stable, and markdown lines have no domain ID.
      // biome-ignore lint/suspicious/noArrayIndexKey: PDF text blocks are immutable for a single render.
      <View key={index} style={styles.bullet}>
        <Text style={styles.bulletMarker}>•</Text>
        <Text orphans={2} widows={2}>
          {block.text}
        </Text>
      </View>
    ) : (
      // The parsed block order is stable, and markdown lines have no domain ID.
      // biome-ignore lint/suspicious/noArrayIndexKey: PDF text blocks are immutable for a single render.
      <Text key={index} orphans={2} style={styles.paragraph} widows={2}>
        {block.text}
      </Text>
    ),
  );
}

function PdfSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <View style={styles.section}>
      <Text minPresenceAhead={40} style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function PositionItem({ position }: { position: Position }) {
  const { formattedFrom, formattedTo } = formatFromTo(
    position.startDate,
    position.endDate,
  );

  return (
    <View style={styles.position}>
      <View minPresenceAhead={36} style={styles.positionHeader}>
        <Text style={styles.positionTitle}>{position.title}</Text>
        <Text style={styles.timeframe}>
          {toYearMonthsDuration(position.startDate, position.endDate)} ·{" "}
          {formattedFrom} – {formattedTo}
        </Text>
      </View>
      {position.location ? (
        <Text style={styles.positionLocation}>{position.location}</Text>
      ) : null}
      <PdfMarkdown markdown={position.accomplishments} />
    </View>
  );
}

function ExperienceItem({ experience }: { experience: Experience }) {
  return (
    <View style={styles.company}>
      <Text minPresenceAhead={48} style={styles.companyName}>
        {experience.link ? (
          <Link src={experience.link} style={styles.link}>
            {experience.companyName}
          </Link>
        ) : (
          experience.companyName
        )}
      </Text>
      {experience.positions.map((position) => (
        <PositionItem key={position.id} position={position} />
      ))}
    </View>
  );
}

function EducationItem({ education }: { education: Education }) {
  const { formattedFrom, formattedTo } = formatFromTo(
    education.startDate,
    education.endDate,
    true,
  );
  const timeframe =
    formattedFrom === formattedTo
      ? formattedFrom
      : `${formattedFrom} – ${formattedTo}`;

  return (
    <View style={styles.educationItem} wrap={false}>
      <View style={styles.educationHeader}>
        <Text style={styles.educationTitle}>
          {education.link ? (
            <Link src={education.link} style={styles.link}>
              {education.institution}
            </Link>
          ) : (
            education.institution
          )}
        </Text>
        <Text style={styles.timeframe}>{timeframe}</Text>
      </View>
      <Text style={styles.educationDetails}>{education.distinction}</Text>
      {education.notes ? (
        <Text style={styles.educationDetails}>{education.notes}</Text>
      ) : null}
    </View>
  );
}

export function ResumePdfDocument({ resume }: { resume: Resume }) {
  const { certificates, education } = partitionResumeEducation(
    resume.education,
  );

  return (
    <Document
      author={resume.contactInfo?.name}
      language="en-US"
      pageLayout="oneColumn"
      title={resume.name}
    >
      <Page size="LETTER" style={styles.page} wrap>
        {resume.contactInfo ? (
          <View style={styles.header}>
            <Text style={styles.name}>{resume.contactInfo.name}</Text>
            {resume.contactInfo.phone || resume.contactInfo.email ? (
              <View style={styles.contactDetails}>
                {resume.contactInfo.phone ? (
                  <ContactRow type="phone">
                    {resume.contactInfo.phone}
                  </ContactRow>
                ) : null}
                {resume.contactInfo.email ? (
                  <ContactRow type="email">
                    {resume.contactInfo.email}
                  </ContactRow>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}

        {resume.summary ? (
          <PdfSection title="Summary">
            <PdfMarkdown markdown={resume.summary} />
          </PdfSection>
        ) : null}

        {resume.experience.length > 0 ? (
          <PdfSection title="Experience">
            {resume.experience.map((experience) => (
              <ExperienceItem key={experience.id} experience={experience} />
            ))}
          </PdfSection>
        ) : null}

        {education.length > 0 ? (
          <PdfSection title="Education">
            {education.map((entry) => (
              <EducationItem education={entry} key={entry.id} />
            ))}
          </PdfSection>
        ) : null}

        {certificates.length > 0 ? (
          <PdfSection title="Certificates">
            {certificates.map((entry) => (
              <EducationItem education={entry} key={entry.id} />
            ))}
          </PdfSection>
        ) : null}

        <Text
          fixed
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          style={styles.footer}
        />
      </Page>
    </Document>
  );
}

export default function ResumePdfViewer({ resume }: { resume: Resume }) {
  return (
    <div
      aria-label={`Paginated preview of ${resume.name}`}
      className="h-full w-full"
      role="region"
    >
      <PDFViewer showToolbar style={styles.viewer}>
        <ResumePdfDocument resume={resume} />
      </PDFViewer>
    </div>
  );
}
