import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UserServices } from './userService';
const useFetchOneQuery = (currentId) => useQuery({
    enabled: currentId >= 0,
    queryFn: () => UserServices.fetchOne(currentId),
    queryKey: ["fetchOneUser" /* UserQueryKey.fetchOne */, currentId],
});
export const useUser = () => {
    const client = useQueryClient();
    const invalidateQuery = (queryKeys) => client.invalidateQueries({
        queryKey: queryKeys,
    });
    return {
        invalidateQuery,
        useFetchOneQuery,
    };
};
