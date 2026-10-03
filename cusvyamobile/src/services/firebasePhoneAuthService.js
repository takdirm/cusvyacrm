import auth from '@react-native-firebase/auth';

let confirmation = null;

export async function requestPhoneOtp(phoneNumber) {
  if (!phoneNumber?.trim()) {
    throw new Error('Phone number is required.');
  }

  confirmation = await auth().signInWithPhoneNumber(phoneNumber.trim());
}

export async function verifyPhoneOtp(otpCode) {
  if (!confirmation) {
    throw new Error('OTP session expired. Request OTP again.');
  }

  const credential = await confirmation.confirm(otpCode.trim());
  const idToken = await credential.user.getIdToken(true);
  return { idToken, user: credential.user };
}

