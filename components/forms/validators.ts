
export const PhoneValidator = {
    checkPhoneNumber: {
        validation: (phoneNumber?: string): boolean => {
            if (phoneNumber && phoneNumber.length === 10) {
                return true;
            }
            return false;
        },
        errMessage: (t: (descriptor: { id: string; defaultMessage?: string }) => string): string => {
            return t({ id: 'error.phoneNumber.length' })
        }
    }
}

export const PasswordValidator = {
    checkPassword: {
        validation: (password?: string): boolean => {
            if (password && password.length >= 6) return true;
            return false;
        },
        errMessage: (t: (descriptor: { id: string; defaultMessage?: string }) => string): string => {
            return t({ id: 'error.password.length' })
        }
    }
}
