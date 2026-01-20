import { UseFormRegister } from 'react-hook-form';

export type RegisterFormFields = {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'OWNER' | 'TENANT';
};

export type Register = UseFormRegister<RegisterFormFields>;
