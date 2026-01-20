import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';

export default function useDeleteUser() {
  const { data: session } = useSession();

  const mutation = useMutation({
    mutationFn: async (userId: number) => {
      const baseURL = env('NEXT_PUBLIC_API_BASE_URL')!;
      const apiClient = axios.create({ baseURL });
      const headers: Record<string, string> = {
        ...(session?.accessToken && {
          Authorization: `Bearer ${session.accessToken}`,
        }),
      };
      await apiClient.delete(`/admin/users/${userId}`, { headers });
    },
  });

  return {
    deleteUser: mutation.mutateAsync,
    ...mutation,
  };
}
