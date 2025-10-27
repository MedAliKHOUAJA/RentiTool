import React, { Suspense } from 'react';
import UserProfilePage from '@/features/user-profile/presentation/pages/UserProfilePage';

const AuthorPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserProfilePage />
    </Suspense>
  );
};

export default AuthorPage;