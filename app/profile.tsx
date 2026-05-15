import { useRouter } from 'expo-router';
import React from 'react';
import { Redirect } from 'expo-router';

// إعادة توجيه لـ Account
export default function Profile() {
  return <Redirect href="/account" />;
}
