import { UserRole } from '../types/index';

/**
 * Statutory Role Permission Matrix (SIH PS 26034)
 * 
 * 1. Inspector (Field Enforcement Officer):
 *    - Commodity optical surveillance & label image capture
 *    - Physical calibration (reference coins/cards/rulers)
 *    - Officer override / manual determination on inspections
 *    - CANNOT edit statutory rule repository, modify AI thresholds, revoke certificates, or adjudicate disputes.
 * 
 * 2. Deputy Controller (Supervisory Legal Metrology Authority):
 *    - Review and officer overrides
 *    - Adjudicate manufacturer dispute appeals & compounding recommendations
 *    - Revoke / suspend certificates of statutory compliance upon lab test failure
 *    - CANNOT edit codified statutory rules or change system parameters.
 * 
 * 3. Director General (Executive Directorate Head):
 *    - Executive oversight, national policy directives, appeal determination
 *    - Certificate revocation & executive overrides
 *    - CANNOT unilaterally rewrite statutory repository without Administrator audit.
 * 
 * 4. Administrator (Central Metrology Wing & System Authority):
 *    - Statutory rule codification, gazette versioning, threshold configuration
 *    - Full audit trail management, environment reset, user administration.
 */

export const Permissions = {
  canEditRules: (role: UserRole | string): boolean => {
    return role === 'Administrator' || role === 'Director General';
  },

  canChangeSystemConfig: (role: UserRole | string): boolean => {
    return role === 'Administrator' || role === 'Director General';
  },

  canFinalizeOverride: (role: UserRole | string): boolean => {
    return role === 'Administrator' || role === 'Director General' || role === 'Deputy Controller';
  },

  canOverrideDetermination: (role: UserRole | string): boolean => {
    // Deputy Controller, Director General, Administrator can finalize
    return role === 'Administrator' || role === 'Director General' || role === 'Deputy Controller';
  },

  canAdjudicateDisputes: (role: UserRole | string): boolean => {
    return role === 'Administrator' || role === 'Director General' || role === 'Deputy Controller';
  },

  canIssueCertificate: (role: UserRole | string): boolean => {
    // Only official enforcement roles can issue statutory compliance certificates
    return role !== 'Citizen';
  },

  canRevokeCertificate: (role: UserRole | string): boolean => {
    return role === 'Administrator' || role === 'Director General';
  },

  canManageDemoEnvironment: (role: UserRole | string): boolean => {
    return role === 'Administrator' || role === 'Director General';
  }
};

export function getRoleBadgeMeta(role: UserRole | string) {
  switch (role) {
    case 'Administrator':
      return {
        label: 'System & Legal Administrator',
        shortLabel: 'Admin',
        color: 'bg-purple-100 text-purple-800 border-purple-300',
        dotColor: 'bg-purple-600',
        description: 'Central Rule Codification Wing. Permitted to amend statutory rules, adjust AI thresholds, and manage system parameters.'
      };
    case 'Director General':
      return {
        label: 'Director General (Legal Metrology)',
        shortLabel: 'Director General',
        color: 'bg-amber-100 text-amber-900 border-amber-300',
        dotColor: 'bg-amber-600',
        description: 'Executive Directorate Head. National policy enforcement, appeal adjudication, and statutory oversight.'
      };
    case 'Deputy Controller':
    case 'Senior Officer':
      return {
        label: 'Deputy Controller of Legal Metrology',
        shortLabel: 'Deputy Controller',
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        dotColor: 'bg-blue-600',
        description: 'Supervisory Legal Authority. Adjudicates manufacturer disputes, reviews overrides, and revokes non-compliant certificates.'
      };
    case 'Citizen':
      return {
        label: 'Citizen / General Consumer',
        shortLabel: 'Citizen',
        color: 'bg-teal-100 text-teal-800 border-teal-300',
        dotColor: 'bg-teal-600',
        description: 'Public Consumer Vigilance. Quick package screening, report violations, and check statutory compliance certificates.'
      };
    case 'Inspector':
    case 'Enforcement Officer':
    default:
      return {
        label: 'Inspector (Legal Metrology)',
        shortLabel: 'Inspector',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        dotColor: 'bg-emerald-600',
        description: 'Field Enforcement Officer. Operational market surveillance, optical calibration, and compliance determinations.'
      };
  }
}
