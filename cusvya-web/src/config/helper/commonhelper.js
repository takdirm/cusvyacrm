// Add this function at the top of your CustomerLists component
export const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return 'N/A';

  const birthDate = new Date(dateOfBirth);
  const today = new Date();

  // Check if the date is valid
  if (isNaN(birthDate.getTime())) return 'Invalid Date';

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  // If birth month/day hasn't occurred this year yet, subtract 1
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age >= 0 ? age : 0;
};
