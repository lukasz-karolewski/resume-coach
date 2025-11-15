import { describe, expect, it } from "vitest";
import { EducationType } from "~/generated/prisma/client";
import { mockDB } from "./db-mock-data";

describe("db-mock-data", () => {
  it("should have base company data", () => {
    expect(mockDB.base).toBeDefined();
    expect(mockDB.base.contactInfo).toBeDefined();
    expect(mockDB.base.contactInfo.name).toBe("Lukasz Karolewski");
    expect(mockDB.base.contactInfo.email).toBe("lkarolewski@gmail.com");
    // summary is now a parsed array (not a JSON string)
    expect(Array.isArray(mockDB.base.summary)).toBe(true);
    expect(mockDB.base.summary.length).toBeGreaterThan(0);
    expect(mockDB.base.experience).toBeInstanceOf(Array);
    expect(mockDB.base.education).toBeInstanceOf(Array);
  });

  it("should have salesforce company data", () => {
    expect(mockDB.salesforce).toBeDefined();
    expect(mockDB.salesforce.contactInfo).toBeDefined();
    // summary is now a parsed array (not a JSON string)
    expect(Array.isArray(mockDB.salesforce.summary)).toBe(true);
    expect(mockDB.salesforce.summary.length).toBeGreaterThan(0);
    expect(mockDB.salesforce.experience).toBeInstanceOf(Array);
    expect(mockDB.salesforce.education).toBeInstanceOf(Array);
  });

  it("should have experience with positions and accomplishments", () => {
    expect(mockDB.base.experience.length).toBeGreaterThan(0);
    const linkedIn = mockDB.base.experience[0];
    expect(linkedIn?.companyName).toBe("LinkedIn");
    expect(linkedIn?.positions).toBeInstanceOf(Array);
    expect(linkedIn?.positions.length).toBeGreaterThan(0);
    expect(linkedIn?.positions[0]?.accomplishments).toBeDefined();
    // accomplishments is now a parsed array (not a JSON string)
    expect(Array.isArray(linkedIn?.positions[0]?.accomplishments)).toBe(true);
    expect(linkedIn?.positions[0]?.accomplishments.length).toBeGreaterThan(0);
  });

  it("should have education entries", () => {
    expect(mockDB.base.education.length).toBeGreaterThan(0);
    const edu = mockDB.base.education.find(
      (e) => e.type === EducationType.EDUCATION,
    );
    expect(edu?.institution).toBe("Warsaw University of Technology");
    expect(edu?.distinction).toBe("Master of Science in Computer Science");
    expect(edu?.type).toBe(EducationType.EDUCATION);
  });

  it("should have certificates in education array", () => {
    const certs = mockDB.base.education.filter(
      (e) => e.type === EducationType.CERTIFICATION,
    );
    expect(certs.length).toBeGreaterThan(0);
    const cert = certs[0];
    expect(cert?.institution).toBeDefined();
    expect(cert?.distinction).toBeDefined();
    expect(cert?.type).toBe(EducationType.CERTIFICATION);
  });
});
