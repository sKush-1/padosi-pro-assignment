// ─── Profile Update ───────────────────────────────────────────────────────────
export interface ProfileBody {
  name: string;
  phone: string;
  address: string;
  business_name?: string;
}

export function validateProfile(data: unknown): {
  valid: true;
  value: ProfileBody;
} | { valid: false; error: string } {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Request body is required." };
  }
  const { name, phone, address, business_name } = data as Record<string, unknown>;

  // Name
  if (!name || typeof name !== "string" || name.trim() === "") {
    return { valid: false, error: "Name is required." };
  }
  if (name.trim().length < 2) {
    return { valid: false, error: "Name must be at least 2 characters long." };
  }
  if (name.trim().length > 150) {
    return { valid: false, error: "Name must not exceed 150 characters." };
  }

  // Phone — Indian mobile: +91 followed by 10 digits starting with 6-9
  if (!phone || typeof phone !== "string" || phone.trim() === "") {
    return { valid: false, error: "Mobile number is required." };
  }
  const phoneRegex = /^\+91[6-9]\d{9}$/;
  if (!phoneRegex.test(phone.trim())) {
    return {
      valid: false,
      error:
        "Mobile number must be a valid Indian number in the format +91XXXXXXXXXX.",
    };
  }

  // Address
  if (!address || typeof address !== "string" || address.trim() === "") {
    return { valid: false, error: "Address is required." };
  }
  if (address.trim().length > 500) {
    return { valid: false, error: "Address must not exceed 500 characters." };
  }

  // Business name — optional
  if (business_name !== undefined && business_name !== null) {
    if (typeof business_name !== "string") {
      return { valid: false, error: "Business name must be a string." };
    }
    if (business_name.trim().length > 255) {
      return { valid: false, error: "Business name must not exceed 255 characters." };
    }
  }

  return {
    valid: true,
    value: {
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      business_name:
        business_name && typeof business_name === "string" && business_name.trim() !== ""
          ? business_name.trim()
          : undefined,
    },
  };
}

// ─── Task Selection ───────────────────────────────────────────────────────────
export interface TaskSelectionBody {
  task_ids: string[];
}

export function validateTaskSelection(data: unknown): {
  valid: true;
  value: TaskSelectionBody;
} | { valid: false; error: string } {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Request body is required." };
  }
  const { task_ids } = data as Record<string, unknown>;

  if (!Array.isArray(task_ids)) {
    return { valid: false, error: "task_ids must be an array of UUIDs." };
  }
  if (task_ids.length === 0) {
    return { valid: false, error: "task_ids must contain at least one task." };
  }
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  for (const id of task_ids) {
    if (typeof id !== "string" || !uuidRegex.test(id)) {
      return { valid: false, error: `"${id}" is not a valid UUID.` };
    }
  }

  return { valid: true, value: { task_ids } };
}
