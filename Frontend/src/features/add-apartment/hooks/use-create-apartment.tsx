import { ApartmentForm } from '@/features/add-apartment/schemas/add-apartment';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import axios from 'axios';
import { env } from 'next-runtime-env';

export async function createApartment(
  accessToken: string,
  payload: ApartmentForm,
  photos?: File[],
) {
  const baseURL = env('NEXT_PUBLIC_API_BASE_URL')!;
  const apiClient = axios.create({ baseURL });
  const formData = new FormData();
  formData.append('details', JSON.stringify(payload));

  if (photos && photos.length > 0) {
    photos.forEach((file) => {
      formData.append('photos', file);
    });
  }

  const { data } = await apiClient.post('/apartments', formData, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return data;
}

type CreateApartmentParams = {
  accessToken: string;
  payload: ApartmentForm;
  photos?: File[];
};
type CreateApartmentResult = Awaited<ReturnType<typeof createApartment>>;

export function useCreateApartment(
  options?: UseMutationOptions<
    CreateApartmentResult,
    unknown,
    CreateApartmentParams
  >,
) {
  return useMutation({
    mutationFn: ({ accessToken, payload, photos }) =>
      createApartment(accessToken, payload, photos),
    ...options,
  });
}
