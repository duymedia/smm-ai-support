export interface RegistrationInput {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  phone?: string;
  language?: string;
  timezone?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  sanitizedData?: {
    name: string;
    username: string;
    email: string;
    password: string;
    phone?: string;
    language: 'en' | 'vi';
    timezone: string;
  };
}

/**
 * Validate registration input parameters and structure
 */
export function validateRegistrationInput(input: RegistrationInput): ValidationResult {
  const errors: Record<string, string> = {};

  // 1. Validate Email
  const rawEmail = (input.email || '').trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!rawEmail) {
    errors.email = 'Vui lòng nhập địa chỉ email.';
  } else if (!emailRegex.test(rawEmail) || rawEmail.length > 255) {
    errors.email = 'Địa chỉ email không đúng định dạng hoặc vượt quá 255 ký tự.';
  }

  // 2. Validate Username
  const rawUsername = (input.username || '').trim().toLowerCase();
  const usernameRegex = /^[a-z0-9_]{3,30}$/;
  if (!rawUsername) {
    errors.username = 'Vui lòng nhập tên đăng nhập (username).';
  } else if (!usernameRegex.test(rawUsername)) {
    errors.username = 'Tên đăng nhập phải từ 3-30 ký tự, chỉ gồm chữ thường (a-z), số (0-9) và dấu gạch dưới (_).';
  }

  // 3. Validate Password
  const rawPassword = input.password || '';
  if (!rawPassword) {
    errors.password = 'Vui lòng nhập mật khẩu.';
  } else if (rawPassword.length < 8) {
    errors.password = 'Mật khẩu phải có ít nhất 8 ký tự.';
  } else if (rawPassword.length > 128) {
    errors.password = 'Mật khẩu không được vượt quá 128 ký tự.';
  }

  // 4. Validate Full Name
  const rawName = (input.name || '').trim();
  if (!rawName) {
    errors.name = 'Vui lòng nhập họ và tên của bạn.';
  } else if (rawName.length < 2 || rawName.length > 100) {
    errors.name = 'Họ và tên phải từ 2 đến 100 ký tự.';
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    ...(isValid && {
      sanitizedData: {
        name: rawName,
        username: rawUsername,
        email: rawEmail,
        password: rawPassword,
        phone: input.phone ? input.phone.trim() : undefined,
        language: (input.language === 'en' || input.language === 'vi') ? input.language : 'vi',
        timezone: input.timezone || 'Asia/Ho_Chi_Minh (GMT+7)',
      },
    }),
  };
}
