import { prisma } from "../lib/prisma";

export class DatabaseService {
  /**
   * Fetch User by Email for Authentication & Authorization
   */
  static async getUserByEmail(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    return await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        patientProfile: true,
      },
    });
  }

  /**
   * Fetch Patient Care Plan & Metrics
   */
  static async getPatientDashboardData(userId: string) {
    const profile = await prisma.patientProfile.findUnique({
      where: { userId },
      include: {
        user: true,
        carePlanTasks: true,
        studies: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return profile;
  }

  /**
   * Fetch Doctor Clinical Queue
   */
  static async getDoctorClinicalQueue(doctorId: string) {
    return await prisma.diagnosticStudy.findMany({
      where: { doctorId },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Fetch Radiologist Studies Queue
   */
  static async getRadiologistQueue(radiologistId: string) {
    return await prisma.diagnosticStudy.findMany({
      where: { radiologistId },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Sync Community Health Worker Village Visits
   */
  static async syncVillageVisits(fieldWorkerId: string, visits: Array<{ villageName: string; villageCode?: string; screeningsCount: number; highRiskCases: number; visitDate?: Date }>) {
    return await prisma.$transaction(
      visits.map((visit) =>
        prisma.villageVisit.create({
          data: {
            fieldWorkerId,
            villageName: visit.villageName,
            villageCode: visit.villageCode,
            screeningsCount: visit.screeningsCount,
            highRiskCases: visit.highRiskCases,
            visitDate: visit.visitDate || new Date(),
          },
        })
      )
    );
  }

  /**
   * Fetch Anonymized Research Metrics (No PII)
   */
  static async getAnonymizedResearchMetrics() {
    const totalStudies = await prisma.diagnosticStudy.count();
    const highRiskCount = await prisma.diagnosticStudy.count({
      where: {
        aiRiskScore: { gte: 0.7 },
      },
    });

    const biradsDistribution = await prisma.diagnosticStudy.groupBy({
      by: ["biradsCategory"],
      _count: {
        id: true,
      },
    });

    return {
      totalStudies,
      highRiskCount,
      biradsDistribution,
    };
  }

  /**
   * Write Audit Log Event (HIPAA / DISHA Node Audit)
   */
  static async logEvent(userId: string, action: string, details?: string, ipAddress?: string) {
    return await prisma.auditLog.create({
      data: {
        userId,
        action,
        details,
        ipAddress,
      },
    });
  }
}
