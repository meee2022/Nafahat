import React from 'react';
import { Redirect } from 'expo-router';

// 🔁 /profile → /(tabs)/account — تبويب الحساب الموحّد
//   الـ Redirect بيـ replace بدل push عشان مفيش "رجوع لصفحة الـ redirect"
export default function Profile() {
  return <Redirect href="/account" />;
}
