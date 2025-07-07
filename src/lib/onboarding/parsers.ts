/**
 * Parsers for bulk input fields in onboarding flows
 */

export interface BuildingInput {
  name: string;
  city: string;
  address?: string;
}

export interface InviteInput {
  email: string;
  name?: string;
  role?: string;
  building?: string;
}

/**
 * Parse CSV-style building input
 * Format: "Building Name, City"
 */
export function csvBuildingParser(input: string): BuildingInput[] {
  const lines = input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines.map((line) => {
    const parts = line.split(",").map((p) => p.trim());

    if (parts.length < 2) {
      throw new Error(
        `Invalid format: "${line}". Expected "Building Name, City"`,
      );
    }

    return {
      name: parts[0],
      city: parts[1],
      address: parts[2] || undefined,
    };
  });
}

/**
 * Parse smart invite format
 * Format: "email@company.com = Building Name" or "email@company.com = Name/Role"
 */
export function smartInviteParser(input: string): InviteInput[] {
  const lines = input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines.map((line) => {
    const parts = line.split("=").map((p) => p.trim());

    if (parts.length < 1) {
      throw new Error(`Invalid format: "${line}"`);
    }

    const email = parts[0];

    // Validate email
    if (!email.includes("@")) {
      throw new Error(`Invalid email: "${email}"`);
    }

    // Parse right side if exists
    let name: string | undefined;
    let role: string | undefined;
    let building: string | undefined;

    if (parts.length > 1) {
      const rightSide = parts[1];

      // Check if it contains a slash (Name/Role format)
      if (rightSide.includes("/")) {
        const subParts = rightSide.split("/").map((p) => p.trim());
        name = subParts[0];
        role = subParts[1];
      } else {
        // Assume it's a building name
        building = rightSide;
      }
    }

    return {
      email,
      name,
      role,
      building,
    };
  });
}

/**
 * Parse team member invite format
 * Format: "email@company.com" or "email@company.com, Name"
 */
export function teamInviteParser(input: string): InviteInput[] {
  const lines = input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines.map((line) => {
    const parts = line.split(",").map((p) => p.trim());

    const email = parts[0];

    // Validate email
    if (!email.includes("@")) {
      throw new Error(`Invalid email: "${email}"`);
    }

    return {
      email,
      name: parts[1] || undefined,
    };
  });
}

/**
 * Parse comma-separated values
 */
export function csvParser(input: string): string[] {
  return input
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

/**
 * Parse equipment list
 * Format: "Brand Model, Brand Model" or line-separated
 */
export function equipmentParser(input: string): string[] {
  const separator = input.includes("\n") ? "\n" : ",";
  return input
    .split(separator)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

/**
 * Parse area assignments
 * Format: "Area Name: User1, User2" or "Area Name"
 */
export function areaAssignmentParser(
  input: string,
): Array<{ area: string; users: string[] }> {
  const lines = input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines.map((line) => {
    const colonIndex = line.indexOf(":");

    if (colonIndex === -1) {
      // No assignments, just area name
      return {
        area: line,
        users: [],
      };
    }

    const area = line.substring(0, colonIndex).trim();
    const usersStr = line.substring(colonIndex + 1).trim();
    const users = usersStr
      .split(",")
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    return { area, users };
  });
}

/**
 * Smart address parser with autocomplete suggestions
 */
export function addressParser(input: string): {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
} {
  // This would integrate with a geocoding service
  // For now, return a simple parse
  const parts = input.split(",").map((p) => p.trim());

  return {
    street: parts[0],
    city: parts[1],
    state: parts[2],
    zip: parts[3],
    country: parts[4] || "USA",
  };
}

/**
 * Registry of all parsers
 */
export const parsers: Record<string, (input: string) => any> = {
  csv_building_parser: csvBuildingParser,
  smart_invite_parser: smartInviteParser,
  team_invite_parser: teamInviteParser,
  csv_parser: csvParser,
  equipment_parser: equipmentParser,
  area_assignment_parser: areaAssignmentParser,
  address_parser: addressParser,
};

/**
 * Validate parsed data
 */
export function validateParsedData(
  type: string,
  data: any[],
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  switch (type) {
    case "buildings":
      data.forEach((building: BuildingInput, index) => {
        if (!building.name) {
          errors.push(`Building ${index + 1}: Name is required`);
        }
        if (!building.city) {
          errors.push(`Building ${index + 1}: City is required`);
        }
      });
      break;

    case "invites":
      data.forEach((invite: InviteInput, index) => {
        if (!invite.email) {
          errors.push(`Invite ${index + 1}: Email is required`);
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invite.email)) {
          errors.push(`Invite ${index + 1}: Invalid email format`);
        }
      });
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
